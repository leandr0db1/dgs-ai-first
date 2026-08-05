# Desenvolvedor — Exercício 1.3: Construção de Pipeline de RAG Open-Source

Pipeline funcional em Python, código completo em `rag-pipeline/`:
- `ingest.py` — chunking + embeddings + indexação no ChromaDB.
- `search.py` — busca por similaridade.
- `prompt_builder.py` — montagem do prompt final (system prompt v2 do Exercício 1.2 + chunks + pergunta).
- `test_pipeline.py` / `compare_embedding_models.py` — testes automatizados contra o gabarito do Anexo B.

Stack: ChromaDB (vector store local) + sentence-transformers (embeddings open-source) — 100% gratuito, sem chamadas de API pagas na etapa de ingestão/busca.

## 1. Estratégia de chunking

Cada seção "folha" do documento (um `###` quando existe, senão o próprio `##`) vira um chunk atômico, com metadados de versão/data extraídos do cabeçalho. Justificativa: os documentos da NovaTech já são organizados em seções numeradas coesas (ex.: "3.2 Exceções ao prazo geral", "2.1 Multiplicadores regionais") — isso evita cortar uma regra ou tabela no meio, ao custo de chunks de tamanho variável em vez de um tamanho fixo em tokens.

**Bug encontrado e corrigido durante o teste:** a primeira versão do chunker deixava vazar as linhas de metadado do cabeçalho (`**Versão:**`, `**Responsável:**` etc.) para dentro de um chunk "fantasma" com seção vazia, antes da primeira `##`. Isso gerava citações mal formadas (`[Documento, seção ]`). Corrigido descartando o conteúdo anterior ao primeiro `##` do corpo do texto. Efeito mensurável: a contagem de chunks caiu de 37 para 32 (1 chunk fantasma removido por documento).

## 2. Teste de retrieval: 6 perguntas do Anexo B

Testado com dois modelos de embedding, para isolar se os problemas eram do modelo ou do pipeline:
- **v1**: `all-MiniLM-L6-v2` (sugerido no enunciado, majoritariamente treinado em inglês).
- **v2**: `paraphrase-multilingual-MiniLM-L12-v2` (multilíngue).

| # | Pergunta | Gabarito (Anexo B) | v1 (all-MiniLM) | v2 (multilíngue) |
|---|---|---|---|---|
| 1 | "Qual o prazo de devolução?" | POL-001 3.1 + 3.2 | **0/2** — nenhum dos dois no top-5 | 1/2 — recuperou 3.1, faltou 3.2 |
| 2 | "Posso devolver carga perigosa?" | POL-001 3.2 | **0/1** — não recuperou; só FAQ item 3 | 0/1 — mesmo problema |
| 3 | "Qual o SLA do cliente Gold?" | SLA-2024 "2. Tabela de SLAs" | **0/1** — não recuperou | 0/1 — mesmo problema |
| 4 | "Frete 600kg p/ Manaus?" | PROC-042-v2 seção 2 + 2.1 | 1/2 — fórmula ok, multiplicador (2.1) faltou | 1/2 — mesmo padrão |
| 5 | "SLA do cliente Platinum?" | SLA-2024 "1. Classificação" | 1/1 — ok | 1/1 — ok |
| 6 | "Frete 300kg p/ Salvador?" (fora de cobertura) | nenhum chunk deveria ser fortemente relevante | scores 0.45-0.51, mesma faixa das perguntas legítimas | scores 0.36-0.44, mesma faixa |
| | **Placar** | | **2/7** | **3/7** |

O modelo multilíngue melhora (2/7 → 3/7), mas não resolve o problema principal — ver Problema 1 abaixo.

## 3. Geração: prompts montados testados no Claude

Para cada pergunta, o prompt completo (system prompt v2 + chunks realmente recuperados pelo v1 + pergunta) foi colado numa conversa nova e avaliado.

**Pergunta 2 — "Posso devolver carga perigosa?" (o caso mais crítico do exercício):**
> *"De acordo com o registro do time de atendimento (FAQ-Atendimento, item 3), cargas perigosas não são elegíveis para devolução pelo processo padrão; casos excepcionais já foram autorizados pelo setor de Gestão de Riscos. Não localizei, nos chunks fornecidos, a política oficial (POL-001) que trata dessa exceção formalmente — recomendo confirmar com a Gestão de Riscos (ramal 4500) e considerar escalar para o supervisor antes de confirmar a resposta ao cliente. [FAQ-Atendimento, item 3]"*

Avaliação: a resposta não inverteu a regra (não disse "sim, pode devolver") e foi transparente sobre a limitação — mas isso é sorte de o FAQ estar bem calibrado, não mérito do pipeline. **O chunk oficial POL-001 3.2 — a exata seção que este treinamento usa como exemplo-âncora de alucinação — não foi recuperado.** Se o FAQ estivesse errado ou ausente, a resposta teria vindo de um fallback ainda pior.

**Pergunta 3 — "Qual o SLA do cliente Gold?":**
> *"Segundo o registro do time de atendimento (FAQ-Atendimento, item 41), o cliente Gold tem SLA de resposta em até 2 horas e de resolução em até 24 horas. Não constava, nos chunks fornecidos, a tabela oficial do SLA-2024 confirmando esse dado — recomendo validar com a documentação contratual oficial antes de repassar ao cliente. [FAQ-Atendimento, Item 41]"*

Avaliação: número correto, mas citando o FAQ informal em vez do SLA-2024 (documento contratual formal) — exatamente a **armadilha #2 do Anexo B** ("FAQ como fonte para informação crítica"), reproduzida ao vivo pelo pipeline real, não como exercício hipotético.

**Pergunta 5 — "SLA do cliente Platinum?":** resposta correta, sem alucinar o tier, citando SLA-2024 seção 1 + FAQ item 15. Único caso em que o retrieval trouxe tudo que era necessário.

**Pergunta 6 — "Frete 300kg para Salvador?":** mesmo com scores de similaridade na mesma faixa das perguntas legítimas (não há um corte claro por score), o modelo conseguiu perceber pelo próprio conteúdo dos chunks que nenhuma faixa de peso documentada cobre 300kg, e recusou-se a inventar um valor — um acerto, mas que depende da geração "salvar" uma falha de retrieval, não é uma garantia estrutural.

**Pergunta 4 — "Frete 600kg para Manaus?":** resposta corretamente parcial (não inventou multiplicador nem valor base), mas o atendente fica sem número nenhum porque o chunk "2.1 Multiplicadores regionais" — que contém literalmente o dado pedido — não entrou no top-5.

## 4. Problemas identificados e correções propostas

1. **Modelo de embeddings fraco para português.** `all-MiniLM-L6-v2` não recupera o chunk mais óbvio mesmo quando o texto é quase idêntico à pergunta (ex.: "qual o prazo de devolução" não acha a seção "3.1 Prazo geral"). Testado e confirmado: trocar para um modelo multilíngue melhora (2/7 → 3/7) mas não é suficiente sozinho — ver problema 4. *Correção parcial já validada neste exercício; recomenda-se avaliar também `intfloat/multilingual-e5-small` ou `BAAI/bge-m3`.*

2. **Conteúdo tabular embeda mal.** A seção "2. Tabela de SLAs" (a resposta certa para SLA por tier) e a seção "2.1 Multiplicadores regionais" nunca apareceram no top-5 em nenhum dos dois modelos, apesar de conterem exatamente os números pedidos — enquanto seções textuais menos relevantes ("Penalidades", "Medição e reportes") ranquearam mais alto. *Correção proposta:* gerar, para cada chunk tabular, um resumo sintético em linguagem natural (ex.: "SLA do cliente Gold: resposta em até 2h, resolução em até 24h") usado só para o embedding, mantendo a tabela original como conteúdo enviado ao LLM (técnica de "resumo sintético para indexação").

3. **Sem threshold de confiança.** A pergunta fora de cobertura (frete abaixo de 500kg) teve scores de similaridade (0.36-0.51) na mesma faixa das perguntas com resposta real — não há um corte estatístico que diferencie "não sei" de "sei". *Correção proposta:* calibrar empiricamente um score mínimo abaixo do qual o pipeline não repassa chunks ao LLM (retorna "sem contexto suficiente" direto), e/ou adicionar um reranker (cross-encoder) antes da decisão final.

4. **Risco de contradição confirmado, não hipotético.** Para "frete para Manaus", a fórmula da versão antiga (PROC-042 v1) teve similaridade igual ou maior que a versão vigente (v2) nos dois modelos testados — a busca por embedding não tem noção de "vigência". *Correção proposta:* usar o metadado de data já capturado na ingestão para aplicar boost às versões mais recentes no re-ranking, ou filtrar documentos marcados como superseded quando duas versões do mesmo tema coexistirem.

5. **Prompt não distingue fonte oficial de fonte informal.** O system prompt v2 (Exercício 1.2) manda citar a fonte, mas não instrui o modelo a sinalizar quando a única fonte disponível é o FAQ (documento explicitamente não validado). Isso ficou evidente nas Perguntas 2 e 3, onde o FAQ virou a única fonte para informação crítica sem nenhum alerta na resposta. *Correção proposta:* nova regra no prompt — "se a única fonte disponível para uma informação crítica for o FAQ-Atendimento, declarar explicitamente que a fonte não é oficial e sugerir validação contra a documentação normativa".

## 5. Conclusão

Os problemas 2, 3 e 4 são de **dados/retrieval**, não de prompt — reforçando a conclusão já registrada no Exercício 1.2: guardrails de prompt são rede de segurança, não substituto de um retrieval de qualidade. O caso da Pergunta 2 (carga perigosa) é o mais importante do exercício inteiro: o guardrail "nunca inverta a regra" só teve chance de funcionar porque o FAQ, por acaso, estava bem calibrado — se a única fonte recuperada tivesse contradito a política oficial, nenhuma regra de prompt teria evitado a resposta errada, porque a fonte certa nunca chegou ao contexto do modelo.
