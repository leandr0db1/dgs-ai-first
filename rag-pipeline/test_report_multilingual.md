# Comparação: all-MiniLM-L6-v2 (v1) vs paraphrase-multilingual-MiniLM-L12-v2 (v2)

## "Qual o prazo de devolução?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.601 | POL-001-politica-devolucao | 3.1. Prazo geral |
| 2 | 0.551 | PROC-042-v2-frete-especial-revisado | 3. Prazo de entrega para frete especial |
| 3 | 0.527 | PROC-042-frete-especial-v1 | 3. Prazo de entrega para frete especial |
| 4 | 0.481 | POL-001-politica-devolucao | 3.5. Custos de devolução |
| 5 | 0.452 | POL-001-politica-devolucao | 3.3. Procedimento de devolução |

**Gabarito (Anexo B):**
- POL-001-politica-devolucao / "3.1" -> OK recuperado
- POL-001-politica-devolucao / "3.2" -> FALTOU

## "Posso devolver carga perigosa?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.557 | FAQ-atendimento | Item 38 — "Cliente quer saber a política para carga que chegou danificada." |
| 2 | 0.535 | FAQ-atendimento | Item 3 — "Cliente perguntou se pode devolver carga perigosa. O que respondo?" |
| 3 | 0.470 | PROC-042-v2-frete-especial-revisado | 4. Condições especiais |
| 4 | 0.450 | POL-001-politica-devolucao | 3.5. Custos de devolução |
| 5 | 0.449 | FAQ-atendimento | Item 22 — "Cliente quer saber sobre seguro de carga. O que falar?" |

**Gabarito (Anexo B):**
- POL-001-politica-devolucao / "3.2" -> FALTOU

## "Qual o SLA do cliente Gold?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.518 | SLA-2024-tabela-sla-clientes | 1. Classificação de clientes |
| 2 | 0.466 | FAQ-atendimento | Item 15 — "Cliente diz que é Platinum. Existe esse tier?" |
| 3 | 0.436 | SLA-2024-tabela-sla-clientes | 5. Medição e reportes |
| 4 | 0.433 | FAQ-atendimento | Item 41 — "Qual a diferença entre SLA de resposta e SLA de resolução?" |
| 5 | 0.426 | SLA-2024-tabela-sla-clientes | 4. Penalidades por descumprimento |

**Gabarito (Anexo B):**
- SLA-2024-tabela-sla-clientes / "2. Tabela de SLAs" -> FALTOU

## "Quanto custa o frete para 600kg para Manaus?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.439 | PROC-042-frete-especial-v1 | 2. Fórmula de cálculo |
| 2 | 0.425 | PROC-042-v2-frete-especial-revisado | 2. Fórmula de cálculo |
| 3 | 0.417 | PROC-042-v2-frete-especial-revisado | 4. Condições especiais |
| 4 | 0.378 | PROC-042-frete-especial-v1 | 4. Condições especiais |
| 5 | 0.344 | PROC-042-frete-especial-v1 | 1. Objetivo |

**Gabarito (Anexo B):**
- PROC-042-v2-frete-especial-revisado / "2. Fórmula" -> OK recuperado
- PROC-042-v2-frete-especial-revisado / "2.1" -> FALTOU

## "Qual o SLA do cliente Platinum?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.713 | FAQ-atendimento | Item 15 — "Cliente diz que é Platinum. Existe esse tier?" |
| 2 | 0.550 | SLA-2024-tabela-sla-clientes | 1. Classificação de clientes |
| 3 | 0.482 | SLA-2024-tabela-sla-clientes |  |
| 4 | 0.396 | SLA-2024-tabela-sla-clientes | 5. Medição e reportes |
| 5 | 0.395 | PROC-042-v2-frete-especial-revisado |  |

**Gabarito (Anexo B):**
- SLA-2024-tabela-sla-clientes / "1. Classificação" -> OK recuperado

## "Quanto custa o frete para 300kg para Salvador?"
| Rank | Similaridade | Documento | Seção |
|---|---|---|---|
| 1 | 0.440 | PROC-042-v2-frete-especial-revisado | 4. Condições especiais |
| 2 | 0.430 | PROC-042-frete-especial-v1 | 2. Fórmula de cálculo |
| 3 | 0.415 | PROC-042-v2-frete-especial-revisado | 2. Fórmula de cálculo |
| 4 | 0.382 | PROC-042-frete-especial-v1 | 4. Condições especiais |
| 5 | 0.362 | PROC-042-frete-especial-v1 | 1. Objetivo |

**Gabarito (Anexo B):** nenhum chunk deveria ser fortemente relevante.

## Placar: 3/7 chunks esperados recuperados no top-5