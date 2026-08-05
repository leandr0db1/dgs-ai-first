# Relatório de teste do pipeline de RAG

## Teste 1: "Qual o prazo de devolução?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.613 | POL-001-politica-devolucao | 3.5. Custos de devolução |
| 2 | 0.542 | POL-001-politica-devolucao | 3.3. Procedimento de devolução |
| 3 | 0.486 | FAQ-atendimento | Item 3 — "Cliente perguntou se pode devolver carga perigosa. O que respondo?" |
| 4 | 0.455 | FAQ-atendimento | Item 38 — "Cliente quer saber a política para carga que chegou danificada." |
| 5 | 0.443 | FAQ-atendimento | Item 22 — "Cliente quer saber sobre seguro de carga. O que falar?" |

**Gabarito (Anexo B):**
- POL-001-politica-devolucao / "3.1" -> FALTOU
- POL-001-politica-devolucao / "3.2" -> FALTOU

## Teste 2: "Posso devolver carga perigosa?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.616 | FAQ-atendimento | Item 22 — "Cliente quer saber sobre seguro de carga. O que falar?" |
| 2 | 0.554 | FAQ-atendimento | Item 3 — "Cliente perguntou se pode devolver carga perigosa. O que respondo?" |
| 3 | 0.522 | PROC-042-frete-especial-v1 | 4. Condições especiais |
| 4 | 0.518 | FAQ-atendimento | Item 38 — "Cliente quer saber a política para carga que chegou danificada." |
| 5 | 0.505 | POL-001-politica-devolucao | 3.5. Custos de devolução |

**Gabarito (Anexo B):**
- POL-001-politica-devolucao / "3.2" -> FALTOU

## Teste 3: "Qual o SLA do cliente Gold?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.635 | SLA-2024-tabela-sla-clientes | 5. Medição e reportes |
| 2 | 0.599 | SLA-2024-tabela-sla-clientes | 4. Penalidades por descumprimento |
| 3 | 0.547 | SLA-2024-tabela-sla-clientes | 1. Classificação de clientes |
| 4 | 0.541 | FAQ-atendimento | Item 15 — "Cliente diz que é Platinum. Existe esse tier?" |
| 5 | 0.514 | FAQ-atendimento | Item 41 — "Qual a diferença entre SLA de resposta e SLA de resolução?" |

**Gabarito (Anexo B):**
- SLA-2024-tabela-sla-clientes / "2. Tabela de SLAs" -> FALTOU

## Teste 4: "Quanto custa o frete para 600kg para Manaus?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.512 | FAQ-atendimento | Item 8 — "Como funciona o frete especial?" |
| 2 | 0.504 | PROC-042-frete-especial-v1 | 2. Fórmula de cálculo |
| 3 | 0.504 | FAQ-atendimento | Item 27 — "O tracking mostra 'em trânsito' há 5 dias. O que faço?" |
| 4 | 0.489 | PROC-042-frete-especial-v1 | 4. Condições especiais |
| 5 | 0.482 | PROC-042-v2-frete-especial-revisado | 2. Fórmula de cálculo |

**Gabarito (Anexo B):**
- PROC-042-v2-frete-especial-revisado / "2. Fórmula" -> OK recuperado
- PROC-042-v2-frete-especial-revisado / "2.1" -> FALTOU

## Teste 5: "Qual o SLA do cliente Platinum?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.613 | FAQ-atendimento | Item 15 — "Cliente diz que é Platinum. Existe esse tier?" |
| 2 | 0.576 | SLA-2024-tabela-sla-clientes | 5. Medição e reportes |
| 3 | 0.540 | SLA-2024-tabela-sla-clientes | 4. Penalidades por descumprimento |
| 4 | 0.535 | SLA-2024-tabela-sla-clientes | 1. Classificação de clientes |
| 5 | 0.516 | SLA-2024-tabela-sla-clientes | 2. Tabela de SLAs |

**Gabarito (Anexo B):**
- SLA-2024-tabela-sla-clientes / "1. Classificação" -> OK recuperado

## Teste 6: "Quanto custa o frete para 300kg para Salvador?"

| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.506 | FAQ-atendimento | Item 27 — "O tracking mostra 'em trânsito' há 5 dias. O que faço?" |
| 2 | 0.468 | PROC-042-frete-especial-v1 | 2. Fórmula de cálculo |
| 3 | 0.466 | PROC-042-frete-especial-v1 | 4. Condições especiais |
| 4 | 0.459 | FAQ-atendimento | Item 8 — "Como funciona o frete especial?" |
| 5 | 0.452 | PROC-042-v2-frete-especial-revisado | 2. Fórmula de cálculo |

**Gabarito (Anexo B):** nenhum chunk deveria ser fortemente relevante (pergunta fora de cobertura). Verificar se o top-1 tem similaridade baixa.
