# Desenvolvedor — Exercício 1.1: Análise de Viabilidade Técnica

## Versão 1 — Análise inicial

### 1. Desafios por tipo de fonte

| Fonte | Desafio técnico | Impacto na qualidade da resposta | Estratégia de tratamento |
|---|---|---|---|
| **PDFs com tabelas complexas** (ex.: tabela de frete com 15+ colunas) | Extração de texto "ingênua" (PyPDF2, pdfminer) lineariza a tabela e desalinha linha/coluna — cabeçalhos de região e multiplicadores se dissociam. | O modelo recebe um chunk com dados numéricos embaralhados e pode citar o multiplicador errado para uma região, com total confiança e citando a fonte "correta". Isso é pior que uma alucinação óbvia: parece rastreável, mas está errado. | Usar extração table-aware (pdfplumber, Unstructured.io, ou Azure Document Intelligence). Converter cada tabela em Markdown ou em pares chave-valor por linha (ex.: "Região Sul: multiplicador 1.3") antes de indexar. Nunca deixar uma tabela ser cortada no meio por um chunker genérico — tratá-la como unidade atômica. |
| **PDFs escaneados** (~15% da base, requerem OCR) | Qualidade de OCR varia com resolução/inclinação do scan; erros de caractere (ex.: "7 dias" lido como "1 dias") não têm sinalização visual. | Erro silencioso: o texto errado entra no embedding e na geração como se fosse texto limpo. Não há como o modelo "desconfiar". | OCR robusto (Azure Document Intelligence/Tesseract com pré-processamento) + score de confiança por documento. Documentos com confiança baixa vão para fila de revisão humana antes de indexar, e o metadado de confiança pode ser propagado para a resposta ("fonte extraída via OCR, confira o original"). |
| **Wiki Confluence com links internos e macros** | Conteúdo fragmentado em páginas pequenas e interligadas; macros customizadas (caixas de info, seções expansíveis) viram ruído ou ficam vazias na exportação bruta. | Um chunk pode referenciar "ver tabela de SLA" sem conter a tabela — o modelo responde de forma incompleta ou preenche a lacuna inventando. | Pré-processar para resolver referências cruzadas críticas antes do chunking; converter/limpar macros em texto plano; considerar retrieval "pai-filho" (o chunk recuperado traz metadado apontando para o conteúdo linkado, que também é buscado). |
| **Planilhas com fórmulas interdependentes** | Exportar para CSV/texto captura o valor calculado, não a regra; se o valor depende de células fora do range extraído, a lógica se perde. | O assistente cita um número correto hoje mas não consegue explicar a regra, e não há como saber se o número ficou desatualizado quando um input da fórmula muda em outra aba. | Converter cada regra de negócio em uma frase estruturada e autocontida (ex.: "Se peso > 500kg e região = Sul, multiplicador = 1.3"), versionada com data de extração. Cada regra vira um chunk atômico, no mesmo espírito das tabelas em PDF. |

### 2. Estimativa de tamanho da base em tokens

Premissas assumidas (não fornecidas no enunciado, preciso deixá-las explícitas):
- PDFs: ~500 palavras/página (densidade típica de documento corporativo).
- Wiki: 1.500 palavras/página (dado).
- Planilhas: ~1.500 palavras-equivalentes por planilha (estimativa grosseira — tabelas não são "palavras", mas usamos como proxy de volume textual pós-conversão).
- Regra: 0,75 palavras por token → tokens = palavras ÷ 0,75.

| Fonte | Cálculo | Palavras | Tokens (aprox.) |
|---|---|---|---|
| PDFs | 800 docs × 10 páginas × 500 palavras | 4.000.000 | ~5,3M |
| Wiki | 400 páginas × 1.500 palavras | 600.000 | ~0,8M |
| Planilhas | 50 × 1.500 palavras | 75.000 | ~0,1M |
| **Total** | | | **~6,2M tokens** |

### 3. Orçamento de contexto por query

- Janela do GPT-4o: 128K tokens.
- System prompt + instruções: ~2K tokens (dado).
- Restante: ~126K tokens.
- Com chunks de ~500 tokens: 126.000 ÷ 500 ≈ **252 chunks caberiam no limite técnico**.

Isso não significa que devemos usar 252 chunks. É exatamente o oposto: o limite técnico é muito maior do que o limite de qualidade. Recomendação: recuperar apenas 5-10 chunks por query (~2,5K-5K tokens), guardando o restante do orçamento para histórico de conversa (sessões no Teams podem ter várias perguntas seguidas) e para a resposta gerada.

### 4. Estratégia de chunking recomendada

Como as perguntas do domínio são majoritariamente buscas pontuais (um prazo, um multiplicador, um SLA) e não pedidos de resumo amplo, priorizar **precisão sobre amplitude**: chunks pequenos e semanticamente coerentes (por seção/regra/linha de tabela, ~300-500 tokens) em vez de chunks fixos genéricos. Usar overlap de ~10% apenas em texto corrido (políticas, wiki), não em tabelas — tabelas devem ser atômicas. Para combater o efeito *lost in the middle*, posicionar o chunk mais relevante no início e (se houver mais de um) também perto do fim do contexto montado, evitando que a informação mais importante fique "enterrada" no meio.

---

## Revisão crítica (papel de "advogado do diabo")

Pontos fracos identificados nesta primeira versão:

1. **A estimativa de tokens é frágil.** "500 palavras/página" para PDFs com tabelas é uma premissa ruim — tabelas têm poucas palavras mas muitos tokens estruturais (bordas, repetição de cabeçalho ao serializar em Markdown). O mesmo vale para os escaneados. Um número único passa falsa precisão; isso deveria ser uma faixa, não um ponto.
2. **Chunk de tamanho fixo (~500 tokens) conflita com "tabela como unidade atômica".** Se uma tabela tiver mais linhas do que cabe em 500 tokens, a recomendação não diz o que fazer — falta uma regra explícita para tabelas grandes.
3. **O orçamento de contexto ignora custos "escondidos":** título do documento, metadados de citação, formatação de instrução por chunk, e principalmente o **histórico de conversa acumulado** em sessões longas no Teams — isso não foi reservado explicitamente no cálculo.
4. **Risco não considerado:** reindexação incremental. Como a documentação muda mensalmente sem processo unificado, reprocessar a base inteira a cada atualização não escala — falta uma estratégia de versionamento por chunk (hash + data de vigência).
5. **O fluxo de baixa confiança de OCR foi mencionado mas não tem dono nem SLA** — "marcar para revisão humana" sem definir quem revisa e em quanto tempo é uma mitigação vaga.

---

## Versão 2 — Análise final (incorporando a revisão)

### Estimativa de tokens (revisada)
Em vez de um número único, apresento uma faixa: **~6M a ~12M tokens**, dependendo da densidade real das páginas e do overhead de serialização de tabelas (que pode adicionar 30-50% de tokens extras por página tabular). **Recomendação concreta:** antes de dimensionar infraestrutura, rodar um piloto de extração em ~20 documentos reais (mix de PDF simples, PDF com tabela e escaneado) e medir o token count real, em vez de confiar na estimativa teórica.

### Chunking (revisado)
Chunker híbrido, não apenas por tamanho fixo:
- Corte primário por limite semântico (seção, tabela, regra de negócio).
- Se uma unidade semântica exceder ~500-700 tokens (ex.: tabela grande), sub-dividir por grupos de linhas, **replicando o cabeçalho/contexto da tabela em cada fragmento** (ex.: repetir "Tabela de Frete Especial — Região" em cada sub-chunk), para que cada fragmento continue autocontido mesmo isolado.
- Nunca mesclar regras não relacionadas num único chunk só para atingir um tamanho-alvo.

### Orçamento de contexto (revisado)
Orçamento explícito por parte, não apenas "o que sobra":
- System prompt + instruções: ~2K tokens (fixo).
- Histórico de conversa: janela deslizante — últimos 2-3 turnos completos + resumo dos turnos anteriores, com teto de ~3-5K tokens (evita que sessões longas no Teams degradem a qualidade por *context rot*).
- Chunks recuperados: teto de working-default de 5-8 chunks (~3-4K tokens), não os ~252 que caberiam tecnicamente — revisitar esse teto só se avaliação mostrar perda de recall.
- Resposta gerada: reservar ~1-2K tokens.

Isso deixa a maior parte da janela de 128K como margem de segurança, não como orçamento a ser gasto — o gargalo real é qualidade de atenção e custo/latência, não espaço.

### Riscos operacionais adicionados
- **Reindexação incremental:** cada chunk versionado por hash de conteúdo + data de vigência do documento-fonte, para reprocessar só o que mudou a cada atualização mensal.
- **Fluxo de revisão de OCR de baixa confiança:** definir dono (ex.: time de Compliance/Operações que já valida os documentos) e SLA (ex.: revisão em até 48h) — sem isso, o "flag" de baixa confiança fica sem efeito prático.

---

## O que mudou entre v1 e v2 (resumo da iteração)
- Estimativa de tokens virou faixa (6-12M) com plano de validação empírica, em vez de número único.
- Chunking ganhou regra explícita para tabelas maiores que o tamanho-alvo.
- Orçamento de contexto passou a reservar espaço explícito para histórico de conversa, não só para chunks.
- Dois riscos operacionais (reindexação incremental, dono/SLA de revisão de OCR) foram adicionados — não existiam na v1.
