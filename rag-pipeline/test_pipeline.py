"""
Testa o pipeline (ingestao -> busca -> montagem de prompt) com perguntas do
mapa de cobertura do Anexo B, comparando os chunks recuperados com o gabarito.
Grava um relatorio em test_report.md e os prompts montados em prompts_output/
para serem colados manualmente no Claude (etapa de geracao).
"""

import os

from search import search
from prompt_builder import build_prompt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR = os.path.join(BASE_DIR, "prompts_output")
REPORT_PATH = os.path.join(BASE_DIR, "test_report.md")

# Gabarito: pergunta -> lista de (doc_id, palavra-chave da secao esperada)
# Baseado no mapa de cobertura do Anexo B.
TEST_CASES = [
    {
        "question": "Qual o prazo de devolução?",
        "expected": [("POL-001-politica-devolucao", "3.1"), ("POL-001-politica-devolucao", "3.2")],
    },
    {
        "question": "Posso devolver carga perigosa?",
        "expected": [("POL-001-politica-devolucao", "3.2")],
    },
    {
        "question": "Qual o SLA do cliente Gold?",
        "expected": [("SLA-2024-tabela-sla-clientes", "2. Tabela de SLAs")],
    },
    {
        "question": "Quanto custa o frete para 600kg para Manaus?",
        "expected": [
            ("PROC-042-v2-frete-especial-revisado", "2. Fórmula"),
            ("PROC-042-v2-frete-especial-revisado", "2.1"),
        ],
    },
    {
        "question": "Qual o SLA do cliente Platinum?",
        "expected": [("SLA-2024-tabela-sla-clientes", "1. Classificação")],
    },
    {
        "question": "Quanto custa o frete para 300kg para Salvador?",
        "expected": [],  # frete padrao < 500kg nao esta documentado
    },
]


def check_hit(hit, expected_doc_id, expected_section_kw):
    return (
        hit["metadata"]["doc_id"] == expected_doc_id
        and expected_section_kw.lower() in hit["metadata"]["section"].lower()
    )


def run():
    os.makedirs(PROMPTS_DIR, exist_ok=True)
    report_lines = ["# Relatório de teste do pipeline de RAG\n"]

    for idx, case in enumerate(TEST_CASES, start=1):
        question = case["question"]
        expected = case["expected"]
        hits = search(question, top_k=5)

        report_lines.append(f"## Teste {idx}: \"{question}\"\n")
        report_lines.append("| Rank | Similaridade | Documento | Seção |")
        report_lines.append("|---|---|---|---|")
        for rank, hit in enumerate(hits, start=1):
            meta = hit["metadata"]
            report_lines.append(
                f"| {rank} | {hit['similarity']:.3f} | {meta['doc_id']} | {meta['section']} |"
            )

        if expected:
            found = []
            for doc_id, kw in expected:
                matched = any(check_hit(h, doc_id, kw) for h in hits)
                found.append((doc_id, kw, matched))
            report_lines.append("")
            report_lines.append("**Gabarito (Anexo B):**")
            for doc_id, kw, matched in found:
                status = "OK recuperado" if matched else "FALTOU"
                report_lines.append(f"- {doc_id} / \"{kw}\" -> {status}")
        else:
            report_lines.append("")
            report_lines.append(
                "**Gabarito (Anexo B):** nenhum chunk deveria ser fortemente relevante "
                "(pergunta fora de cobertura). Verificar se o top-1 tem similaridade baixa."
            )

        report_lines.append("")

        # grava o prompt montado com os top_k chunks para geracao manual no Claude
        prompt = build_prompt(question, hits)
        prompt_path = os.path.join(PROMPTS_DIR, f"prompt_{idx:02d}.txt")
        with open(prompt_path, "w", encoding="utf-8") as f:
            f.write(prompt)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Relatório salvo em {REPORT_PATH}")
    print(f"Prompts montados salvos em {PROMPTS_DIR}/")


if __name__ == "__main__":
    run()
