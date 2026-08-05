"""
Busca: recebe uma pergunta, gera o embedding e retorna os N chunks mais
similares do ChromaDB, com o score de similaridade (1 - distancia cosseno).
"""

import chromadb
from sentence_transformers import SentenceTransformer

from ingest import CHROMA_DIR, COLLECTION_NAME, EMBEDDING_MODEL

_model = None
_collection = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_collection(COLLECTION_NAME)
    return _collection


def search(question, top_k=5):
    model = _get_model()
    collection = _get_collection()
    query_embedding = model.encode([question]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    hits = []
    for i in range(len(results["ids"][0])):
        distance = results["distances"][0][i]
        hits.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "similarity": 1 - distance,
        })
    return hits


if __name__ == "__main__":
    import sys
    question = " ".join(sys.argv[1:]) or "Qual o prazo de devolução?"
    for hit in search(question):
        print(f"[{hit['similarity']:.3f}] {hit['id']} -> {hit['metadata']['section']}")
