"""
Compara o modelo de embeddings original (all-MiniLM-L6-v2, majoritariamente
treinado em ingles) com um modelo multilingue, para testar a hipotese de que
a fraqueza do retrieval em portugues vem do modelo de embeddings.
"""

import os

import chromadb
from sentence_transformers import SentenceTransformer

from ingest import DOC_FILES, DOCS_DIR, CHROMA_DIR, chunk_markdown
from test_pipeline import TEST_CASES, check_hit

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
COLLECTION_NAME = "novatech_docs_multilingual"


def build_index_v2():
    print(f"Carregando modelo {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME, metadata={"hnsw:space": "cosine"})

    all_chunks = []
    for filename in DOC_FILES:
        path = os.path.join(DOCS_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        doc_id = os.path.splitext(filename)[0]
        all_chunks.extend(chunk_markdown(text, doc_id))

    ids = [f"{c['doc_id']}__{i}" for i, c in enumerate(all_chunks)]
    texts = [c["text"] for c in all_chunks]
    metadatas = [{k: v for k, v in c.items() if k != "text"} for c in all_chunks]

    print(f"Gerando embeddings para {len(all_chunks)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True).tolist()
    collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    return model, collection


def search_v2(model, collection, question, top_k=5):
    query_embedding = model.encode([question]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)
    hits = []
    for i in range(len(results["ids"][0])):
        hits.append({
            "metadata": results["metadatas"][0][i],
            "similarity": 1 - results["distances"][0][i],
        })
    return hits


def run():
    model, collection = build_index_v2()
    lines = [f"# Comparação: all-MiniLM-L6-v2 (v1) vs {MODEL_NAME} (v2)\n"]

    total_expected = 0
    total_found = 0

    for case in TEST_CASES:
        question = case["question"]
        expected = case["expected"]
        hits = search_v2(model, collection, question, top_k=5)

        lines.append(f"## \"{question}\"")
        lines.append("| Rank | Similaridade | Documento | Seção |")
        lines.append("|---|---|---|---|")
        for rank, hit in enumerate(hits, start=1):
            m = hit["metadata"]
            lines.append(f"| {rank} | {hit['similarity']:.3f} | {m['doc_id']} | {m['section']} |")

        if expected:
            lines.append("")
            lines.append("**Gabarito (Anexo B):**")
            for doc_id, kw in expected:
                total_expected += 1
                matched = any(check_hit(h, doc_id, kw) for h in hits)
                total_found += 1 if matched else 0
                lines.append(f"- {doc_id} / \"{kw}\" -> {'OK recuperado' if matched else 'FALTOU'}")
        else:
            lines.append("")
            lines.append("**Gabarito (Anexo B):** nenhum chunk deveria ser fortemente relevante.")
        lines.append("")

    lines.append(f"## Placar: {total_found}/{total_expected} chunks esperados recuperados no top-5")

    report_path = os.path.join(os.path.dirname(__file__), "test_report_multilingual.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Relatório salvo em {report_path}")
    print(f"Placar: {total_found}/{total_expected}")


if __name__ == "__main__":
    run()
