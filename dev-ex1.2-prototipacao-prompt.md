# Desenvolvedor — Exercício 1.2: Prototipação de Prompt com Engenharia de Contexto

## 1. System Prompt v1

```
# Identidade
Você é o assistente de atendimento da NovaTech, uma empresa de logística. Ajude
atendentes a responder dúvidas de clientes sobre prazos, frete, devolução e SLA
usando a documentação oficial da empresa.

# Regras
1. Use apenas as informações dos documentos fornecidos nesta conversa.
2. Sempre cite a fonte (documento e seção).
3. Nunca invente prazos ou valores que não estejam na documentação.
4. Se não encontrar a resposta, diga isso explicitamente e sugira escalar para
   o supervisor.
5. Responda em português formal, mas acessível.

# Formato de resposta
Resposta objetiva de até 3 frases, com a fonte citada ao final entre colchetes.
Ex.: [POL-001, seção 3.2]

# Uso dos chunks
Os chunks abaixo contêm os trechos de documentação relevantes disponíveis nesta
conversa. Baseie sua resposta neles. Se dois chunks conflitarem, sinalize o
conflito em vez de escolher um deles arbitrariamente.
```

## 2. Mapeamento de contexto estático vs. dinâmico (v1)

| Parte | Estático/Dinâmico | Muda quando? | Tamanho estimado |
|---|---|---|---|
| Identidade + Regras + Formato + Uso dos chunks | **Estático** | Só quando o time revisa o prompt | ~160 palavras ≈ **~210 tokens** |
| Chunks recuperados (A, B, C neste teste) | **Dinâmico** | A cada pergunta (depende do retrieval) | 3 chunks × ~45 palavras ≈ **~180 tokens** |
| Pergunta do atendente | **Dinâmico** | A cada pergunta | ~10 palavras ≈ **~15 tokens** |
| Metadados do cliente (tier, região) | **Dinâmico** (não usado neste teste, mas parte da anatomia real) | A cada pergunta | ~20-50 tokens quando presente |
| Histórico da conversa | **Dinâmico, crescente** | Cresce a cada novo turno na mesma sessão do Teams | 0 neste teste (conversa nova) |

Total para este teste: ~400-450 tokens — bem abaixo do orçamento de ~5-8 chunks recomendado no Exercício 1.1, porque aqui só temos 3 chunks fixos fornecidos pelo enunciado.

## 3. Teste do v1 — 3 perguntas

Testado colando o system prompt v1 + os 3 chunks (A, B, C) como contexto inicial de uma conversa nova, respondendo como o assistente definido pelo prompt.

**Chunks fornecidos:**
- A: POL-001 3.2 — devolução em 7 dias úteis, exceto cargas perigosas (classes 1-6 ANTT).
- B: SLA-2024 — Gold: resposta 2h / resolução 24h; Silver: 4h/48h; Standard: 8h/72h.
- C: PROC-042-v2 seção 2 — frete acima de 500kg = valor base × multiplicador regional (Sul 1.3, Sudeste 1.1, Norte 1.8, Nordeste 1.5, Centro-Oeste 1.4).

---

**Pergunta 1: "Qual o prazo de devolução para carga perigosa?"**

> Resposta obtida: *"De acordo com a POL-001 (seção 3.2), a política geral de devolução é de até 7 dias úteis após o recebimento. No entanto, essa regra não se aplica a cargas classificadas como perigosas (classes 1 a 6 da ANTT) — para esse tipo de carga, a devolução dentro desse prazo não é permitida, e a documentação fornecida não especifica um prazo alternativo. [POL-001, seção 3.2]"*

**Análise:**
- Correta? Sim — identificou a exceção corretamente, não caiu na armadilha de responder "7 dias" ignorando a ressalva.
- Citou fonte? Sim.
- Respeitou guardrails? Parcialmente. A Regra 4 ("se não encontrar a resposta, sugira escalar") só foi escrita para o caso de "não encontrei nada" — aqui encontrou uma exceção mas não uma regra alternativa, e o prompt não deixa claro que esse caso também deveria sugerir escalonamento. A resposta não sugeriu escalar, e deveria ter sugerido, já que o atendente ficou sem uma resposta acionável para o cliente.
- **Onde errou:** gap de guardrail (falta de escalonamento em resposta parcial), não erro factual.

---

**Pergunta 2: "Meu cliente é Gold, qual o SLA de resolução?"**

> Resposta obtida: *"Para clientes Gold, o SLA de resolução é de até 24 horas, com resposta inicial em até 2 horas. [SLA-2024]"*

**Análise:**
- Correta? Sim.
- Citou fonte? Sim.
- Respeitou guardrails? Sim.
- **Onde errou:** não errou. Este caso não expôs problema no v1.

---

**Pergunta 3: "Quanto custa o frete para 600kg para Manaus?"**

> Resposta obtida: *"Como Manaus fica na Região Norte, o frete especial para cargas acima de 500kg tem multiplicador de 1.8 sobre o valor base. A documentação fornecida não indica o valor base a ser usado no cálculo, então não posso informar o custo final. [PROC-042-v2, seção 2]"*

**Análise:**
- Correta? Parcialmente. Acertou em não inventar o valor final (respeitou a Regra 3). **Mas errou em um ponto sutil: afirmou "Manaus fica na Região Norte" como um fato dado, quando essa informação não está em nenhum chunk fornecido.** Isso é conhecimento geral de geografia sendo usado para preencher uma lacuna da documentação — o que a Regra 1 ("use apenas as informações dos documentos fornecidos") deveria proibir, mas o prompt não trata explicitamente esse tipo de inferência (mapeamento cidade → região) como "informação fora dos documentos".
- Citou fonte? Sim, mas a citação cobre o multiplicador, não a afirmação sobre Manaus/Região Norte (que não tem fonte nenhuma).
- Respeitou guardrails? Parcialmente — acertou o guardrail de não inventar valor, mas violou o espírito do guardrail de "usar apenas os documentos fornecidos" ao assumir uma classificação regional não documentada.
- **Onde errou:** usou conhecimento externo (geografia) para uma decisão que, no mundo real, pode não corresponder à classificação comercial da NovaTech (a "Região Norte" da tabela de frete pode não coincidir exatamente com a macrorregião geográfica do IBGE — isso é uma decisão de negócio, não um fato geográfico).

---

## 4. Diagnóstico e decisão de iteração

Dois problemas reais encontrados, nenhum deles corrigível só com "seja mais cuidadoso":

1. A Regra 4 (escalonamento) só cobre o caso "não encontrei nada" — falta cobrir o caso "encontrei uma exceção, mas não uma regra substituta".
2. A Regra 1 não distingue "informação da documentação" de "inferência plausível, mas não documentada" (ex.: cidade → região). O prompt precisa proibir explicitamente esse tipo de ponte silenciosa.

## 5. System Prompt v2

```
# Identidade
Você é o assistente de atendimento da NovaTech, uma empresa de logística. Ajude
atendentes a responder dúvidas de clientes sobre prazos, frete, devolução e SLA
usando exclusivamente a documentação oficial fornecida nesta conversa.

# Regras
1. Use apenas as informações contidas nos chunks fornecidos. Não use
   conhecimento geral (geografia, práticas de mercado, senso comum) para
   preencher lacunas da documentação. Se um mapeamento necessário para
   responder (ex.: a qual "região" comercial uma cidade pertence, ou a qual
   tier um cliente pertence) não estiver explícito nos chunks, trate isso
   como informação faltante — não assuma.
2. Sempre cite a fonte (documento e seção) de cada informação usada.
3. Nunca invente prazos, valores ou dados que não estejam explicitamente nos
   chunks — incluindo valores derivados de cálculo, quando um dos insumos
   (ex.: valor base) não estiver documentado.
4. Se a pergunta só puder ser respondida parcialmente — parte da informação
   existe, parte falta, ou existe uma exceção sem regra alternativa
   documentada — estruture a resposta em três partes: (a) o que a
   documentação confirma, (b) o que falta ou não pode ser determinado com o
   que foi fornecido, (c) sugestão de escalar para o supervisor para a parte
   faltante.
5. Se não encontrar nenhuma informação relevante para a pergunta, diga isso
   explicitamente e sugira escalar para o supervisor.
6. Se dois chunks tratarem do mesmo tema com informações conflitantes,
   priorize o de data de vigência mais recente; se não houver data explícita,
   aponte o conflito em vez de escolher arbitrariamente.
7. Responda em português formal, mas acessível.

# Formato de resposta
Resposta objetiva, até 4 frases. Fonte citada ao final entre colchetes:
[Documento, seção]. Respostas parciais seguem a estrutura da Regra 4.

# Uso dos chunks
Os chunks abaixo são a única fonte de verdade disponível nesta conversa. Antes
de responder, verifique se todos os dados necessários — incluindo mapeamentos
como cidade→região ou cliente→tier — estão explícitos nos chunks. Se não
estiverem, trate como faltantes, mesmo que pareçam óbvios de senso comum.
```

**O que mudou:** Regra 1 ficou explícita sobre não usar conhecimento externo para mapeamentos; Regra 4 é nova e cobre respostas parciais; Formato ganhou 1 frase de folga para acomodar a estrutura de resposta parcial.

## 6. Reteste do v2 — mesmas 3 perguntas

**Pergunta 1** (carga perigosa):
> *"De acordo com a POL-001 (seção 3.2), o prazo geral de devolução é de 7 dias úteis, mas cargas classificadas como perigosas (classes 1 a 6 da ANTT) são excluídas dessa regra. A documentação fornecida não especifica um prazo alternativo para esse tipo de carga. Recomendo escalar para o supervisor para confirmar o procedimento aplicável. [POL-001, seção 3.2]"*

✅ Melhoria: agora sugere escalonamento explicitamente, seguindo a estrutura da Regra 4.

**Pergunta 2** (SLA Gold): resposta idêntica à v1 — já estava correta, sem regressão.

**Pergunta 3** (frete Manaus):
> *"A documentação fornecida (PROC-042-v2, seção 2) define o frete especial para cargas acima de 500kg como valor base × multiplicador regional, mas não inclui um mapeamento de cidade para região — não posso confirmar, apenas com estes chunks, se Manaus é classificada como Região Norte para fins comerciais da NovaTech. Além disso, o valor base não está documentado. Recomendo escalar para o supervisor para confirmar a região comercial de Manaus e o valor base vigente. [PROC-042-v2, seção 2]"*

✅ Melhoria: não afirma mais "Manaus é Região Norte" como fato — sinaliza a lacuna explicitamente, em vez de silenciosamente preenchê-la com conhecimento externo.

## 7. Ressalva final (limite do que um prompt resolve)

A resposta v2 da Pergunta 3 é mais segura, mas também mais frustrante para o atendente: uma pergunta de frete que provavelmente é feita centenas de vezes por dia (frete para uma capital de estado) agora sempre escala, porque falta um dado trivial. **Isso não é um problema de prompt — é um problema de dados.** A correção real é adicionar ao pipeline de RAG um chunk de referência com o mapeamento cidade/UF → região comercial da NovaTech (que pode não ser igual à macrorregião do IBGE), para que o retrieval traga esse dado junto com o multiplicador. O guardrail no prompt deve continuar existindo como rede de segurança, mas não deveria ser a primeira linha de defesa para uma lacuna previsível.

## Resumo da iteração v1 → v2
- Regra 4 nova: formaliza resposta parcial + escalonamento (corrige a Pergunta 1).
- Regra 1 reforçada: proíbe explicitamente pontes de conhecimento externo para mapeamentos não documentados (corrige a Pergunta 3).
- Identificado que a correção definitiva da Pergunta 3 é no pipeline de dados (chunk de mapeamento cidade→região), não só no prompt — guardrail de prompt é rede de segurança, não substituto de dado faltante.
