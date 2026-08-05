"""
Ingestao: le os documentos da NovaTech, divide em chunks por secao (## / ###),
gera embeddings com sentence-transformers e armazena no ChromaDB.

Estrategia de chunking: cada secao "folha" do documento (um ### quando existe,
senao o proprio ##) vira um chunk atomico. Justificativa: os documentos da
NovaTech ja sao organizados em secoes numeradas que correspondem a uma unica
regra/tabela coesa (ex.: "3.2 Excecoes ao prazo geral", "2.1 Multiplicadores
regionais"). Isso evita cortar uma regra ou tabela no meio, e da um tamanho de
chunk variavel mas sempre semanticamente completo -- em vez de um tamanho fixo
em tokens que ignoraria os limites naturais do conteudo.
"""

import os
import re

import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "novatech_docs"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

DOC_FILES = [
    "POL-001-politica-devolucao.md",
    "PROC-042-frete-especial-v1.md",
    "PROC-042-v2-frete-especial-revisado.md",
    "SLA-2024-tabela-sla-clientes.md",
    "FAQ-atendimento.md",
]

FIELD_MAP = {
    "Versão": "versao",
    "Última atualização": "atualizado_em",
    "Data de emissão": "emitido_em",
    "Responsável": "responsavel",
    "Classificação": "classificacao",
    "Status": "status",
}


def extract_metadata(lines):
    meta = {}
    for line in lines:
        m = re.match(r"\*\*(.+?):\*\*\s*(.+)", line.strip())
        if m:
            key = FIELD_MAP.get(m.group(1).strip())
            if key:
                meta[key] = m.group(2).strip()
    return meta


def chunk_markdown(text, doc_id):
    lines = text.splitlines()
    doc_title = lines[0].lstrip("#").strip() if lines and lines[0].startswith("#") else doc_id
    metadata = extract_metadata(lines[:10])

    chunks = []
    current_h2 = ""
    current_h3 = ""
    buffer = []
    seen_h2 = False  # descarta o cabecalho/metadados antes da primeira secao "##"

    def flush():
        content = "\n".join(l for l in buffer if l.strip())
        if content.strip():
            heading = current_h3 or current_h2
            chunks.append({
                "text": f"{doc_title} — {heading}\n{content.strip()}",
                "doc_id": doc_id,
                "doc_title": doc_title,
                "section": heading,
                **metadata,
            })

    for line in lines[1:]:
        if line.startswith("### "):
            flush()
            current_h3 = line[4:].strip()
            buffer = []
        elif line.startswith("## "):
            flush()
            current_h2 = line[3:].strip()
            current_h3 = ""
            buffer = []
            seen_h2 = True
        elif not seen_h2:
            continue
        else:
            buffer.append(line)

    flush()
    return chunks


def build_index():
    print("Carregando modelo de embeddings ({})...".format(EMBEDDING_MODEL))
    model = SentenceTransformer(EMBEDDING_MODEL)

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(
        COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
    )

    all_chunks = []
    for filename in DOC_FILES:
        path = os.path.join(DOCS_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        doc_id = os.path.splitext(filename)[0]
        doc_chunks = chunk_markdown(text, doc_id)
        print(f"  {filename}: {len(doc_chunks)} chunks")
        all_chunks.extend(doc_chunks)

    ids = [f"{c['doc_id']}__{i}" for i, c in enumerate(all_chunks)]
    texts = [c["text"] for c in all_chunks]
    metadatas = [{k: v for k, v in c.items() if k != "text"} for c in all_chunks]

    print(f"Gerando embeddings para {len(all_chunks)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True).tolist()

    collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    print(f"Indexados {len(all_chunks)} chunks no ChromaDB em {CHROMA_DIR}")
    return all_chunks


if __name__ == "__main__":
    build_index()
