from llama_index.core import SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openrouter import OpenRouter
from llama_index.core.llms import ChatMessage
from pinecone import Pinecone
import os
import hashlib
from dotenv import load_dotenv
from abc import ABC, abstractmethod

load_dotenv()


# Abstract Embedding Provider
class EmbeddingProvider(ABC):
    @abstractmethod
    def embed(self, text):
        """Embed text into a vector representation"""
        pass
    
    @abstractmethod
    def get_dimension(self):
        """Return the dimension of the embedding vector"""
        pass

# Local Embedding Provider using fastembed
class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name="BAAI/bge-small-en-v1.5"):
        try:
            from fastembed import TextEmbedding
            self.model_name = model_name
            self.model = TextEmbedding(model_name)
            print(f"Initialized local embedding model: {model_name}")
        except ImportError:
            raise ImportError("Please install fastembed package to use local embeddings")
    
    def embed(self, text):
        embeddings = list(self.model.embed(text))
        return embeddings[0].tolist()
    
    def get_dimension(self):
        # For BAAI/bge-small-en-v1.5 it's 384
        return int(os.getenv("PINECONE_DIMENSION", "384"))

# Gemini Embedding Provider
class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key):
        try:
            import google.generativeai as genai
            self.genai = genai  # Store the module reference
            self.api_key = api_key
            genai.configure(api_key=api_key)
            print("Initialized Gemini embedding model")
        except ImportError:
            raise ImportError("Please install google-generativeai package to use Gemini embeddings")
    
    def embed(self, text):
        # Use the correct embedding method from the genai module
        embedding_result = self.genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        # Access the embedding from the result dictionary
        return embedding_result['embedding']
    
    def get_dimension(self):
        # Gemini embeddings are typically 768-dimensional
        return 768

# Factory function to create the appropriate embedding provider
def create_embedding_provider():
    embedding_type = os.getenv("EMBEDDING_TYPE", "local").lower()
    
    if embedding_type == "local":
        embedding_model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
        return LocalEmbeddingProvider(model_name=embedding_model_name)
    elif embedding_type == "gemini":
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required when EMBEDDING_TYPE is set to 'gemini'")
        return GeminiEmbeddingProvider(api_key=gemini_api_key)
    else:
        raise ValueError(f"Unknown EMBEDDING_TYPE: {embedding_type}. Use 'local' or 'gemini'")



# configurazione iniziale
def initialize_embedding_provider():
    #"""Inizializza il modello di embedding."""
    #embedding_model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    #embedding_model = TextEmbedding(embedding_model_name)
    #print(f"Initialized embedding model: {embedding_model_name}")
    #return embedding_model
    return create_embedding_provider()

def initialize_pinecone():
    """Inizializza la connessione a Pinecone e crea/connette all'indice."""
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    index_name = os.getenv("PINECONE_INDEX_NAME")
    #dimension = int(os.getenv("PINECONE_DIMENSION"))
    embedding_provider = initialize_embedding_provider()
    dimension = embedding_provider.get_dimension()
    
    if not pc.has_index(index_name):
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
        )
        print(f"Created new index '{index_name}' with dimension {dimension}")
    
    index = pc.Index(index_name)
    print(f"Connected to index '{index_name}'")
    
    return index, embedding_provider

def get_namespaces(index):
    """Ottiene la lista dei namespace disponibili."""
    index_stats = index.describe_index_stats()
    namespaces = list(index_stats.get("namespaces", {}).keys())
    print(f"Found {len(namespaces)} namespaces: {', '.join(namespaces)}")
    return namespaces, index_stats

def create_safe_namespace(filename):
    """Crea un nome di namespace sicuro da un nome di file."""
    filename = os.path.splitext(os.path.basename(filename))[0]
    return ''.join(e for e in filename if e.isalnum())

def load_document(file_path):
    """Carica un singolo documento PDF."""
    if not os.path.exists(file_path):
        print(f"Error: PDF file '{file_path}' not found.")
        return None
        
    print(f"Loading PDF: {file_path}")
    reader = SimpleDirectoryReader(input_files=[file_path])
    documents = reader.load_data()
    print(f"Loaded {len(documents)} documents from {os.path.basename(file_path)}")
    return documents

#def load_all_documents(directory):
#    """Carica tutti i documenti dalla directory specificata."""
#    reader = SimpleDirectoryReader(input_dir=str(directory))
#    documents = reader.load_data()
#    print(f"Loaded {len(documents)} documents for indexing")
#    return documents

def process_document_chunk(doc, safe_namespace, i, embedding_provider):
    """Elabora un singolo documento (pagina del pdf) in chunks e crea i record per Pinecone."""
    records = []
    page_number = doc.metadata.get('page_label', 'unknown')
    
    # divido il doc (pagina del pdf) in chunks
    parser = SentenceSplitter()
    nodes = parser.get_nodes_from_documents([doc])
    
    print(f"Processing page {i+1}, split into {len(nodes)} chunks")
    
    # creo vettore per ogni chunk di una pagina specifica
    for j, node in enumerate(nodes):
        # Skip empty nodes or nodes with only whitespace
        if not node.text or not node.text.strip():
            print(f"Skipping empty chunk on page {i+1}, chunk {j}")
            continue
            
        # creo un id deterministico basato sul contenuto del chunk per evitare duplicati
        content_hash = hashlib.md5(node.text.encode()).hexdigest()
        record_id = f"{safe_namespace}_doc_{i}_chunk_{j}_{content_hash[:8]}"
        
        # creo embedding per il testo del chunk
        try:
            embedding = embedding_provider.embed(node.text)

            # aggiungo al record (unità di informazione per pinecone) l'embedding e i metadati (id univoco, embedding, testo del chunk, pagina e nome del pdf)
            records.append({
                "id": record_id,
                "values": embedding,
                "metadata": {
                    "text": node.text,
                    "page_label": page_number,
                    "file_name": doc.metadata.get('file_name', 'unknown')
                }
            })
        except ValueError as e:
            print(f"Error embedding chunk on page {i+1}, chunk {j}: {str(e)}")
            continue
    
    return records

def upsert_records_in_batches(index, records, namespace, batch_size=100):
    """Inserisce i record in Pinecone in batch."""
    if not records:
        return
        
    print(f"Upserting {len(records)} records to namespace {namespace} in batches of {batch_size}")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        index.upsert(vectors=batch, namespace=namespace)
        print(f"Upserted batch {i//batch_size + 1}/{(len(records)-1)//batch_size + 1}")

def index_single_pdf(file_path, index, embedding_provider, unique_file_name):
    """Indicizza un singolo file PDF in un namespace specifico.
    
    Returns:
        bool: True se l'indicizzazione è riuscita, False altrimenti
    """
    pdf_name = os.path.basename(file_path)
    safe_namespace = create_safe_namespace(pdf_name)
    
    # controllo se questo namespace esiste già
    namespace_stats = index.describe_index_stats(namespace=safe_namespace)
    vectors_count = namespace_stats.get("namespaces", {}).get(safe_namespace, {}).get("vector_count", 0)
    
    if vectors_count > 0:
        print(f"Namespace {safe_namespace} already contains {vectors_count} vectors.")
        # cancello il namespace esistente
        index.delete(delete_all=True, namespace=safe_namespace)
        print(f"Cleared namespace {safe_namespace}")
    
    # carico il pdf
    documents = load_document(unique_file_name)
    if not documents:
        return False
    
    # elaboro i docs per questo namespace (corrispondono alle pagine del pdf)
    all_records = []
    for i, doc in enumerate(documents):
        records = process_document_chunk(doc, safe_namespace, i, embedding_provider)
        all_records.extend(records)
    
    # inserisco i vettori in pinecone in batch
    upsert_records_in_batches(index, all_records, safe_namespace)
    
    print(f"Successfully indexed {pdf_name} into namespace '{safe_namespace}'")
    
    return True

#def index_all_documents(data_dir, index, embedding_model):
#    """Indicizza tutti i documenti dalla directory dei dati.
#    
#    Returns:
#        bool: True se almeno un documento è stato indicizzato con successo, False altrimenti
#    """
#    # carico i documenti
#    documents = load_all_documents(data_dir)
#    if not documents:
#        print("No documents found to index.")
#        return False
#        
#    # raggruppo i documenti per nome file 
#    documents_by_file = {}
#    for doc in documents:
#        file_name = doc.metadata.get('file_name', 'unknown')
#        # rimuovo l'estensione del file per il nome del namespace
#        namespace = os.path.splitext(file_name)[0]
#        if namespace not in documents_by_file:
#            documents_by_file[namespace] = []
#        documents_by_file[namespace].append(doc)
#    
#    if not documents_by_file:
#        print("No valid documents found to index.")
#        return False
#        
#    indexed_count = 0
#    # elaboro i documenti di ciascun file e inserisco nel namespace appropriato
#    for namespace, docs in documents_by_file.items():
#        # creo il nome del namespace
#        safe_namespace = create_safe_namespace(namespace)
#        print(f"\nProcessing {len(docs)} documents for namespace: {safe_namespace}")
#        
#        # controllo se questo namespace ha già contenuti
#        namespace_stats = index.describe_index_stats(namespace=safe_namespace)
#        vectors_count = namespace_stats.get("namespaces", {}).get(safe_namespace, {}).get("vector_count", 0)
#        
#        # se il namespace ha già contenuti, skippo l'inserimento e passo al prossimo
#        if vectors_count > 0:
#            print(f"Namespace {safe_namespace} already contains {vectors_count} vectors. Skipping insertion.")
#            continue
#        
#        # analizzo e creo embedding per i documenti (pagine del pdf) di questo namespace
#        all_records = []
#        for i, doc in enumerate(docs):
#            records = process_document_chunk(doc, safe_namespace, i, embedding_model)
#            all_records.extend(records)
#        
#        # inserisco i records in pinecone in batch
#        if all_records:
#            upsert_records_in_batches(index, all_records, safe_namespace)
#            indexed_count += 1
#    
#    return indexed_count > 0

def query_index(query, target_namespaces, index, embedding_provider, top_k=3):
    """Esegue query su uno o più namespace e restituisce i risultati."""
    print(f"\nQuerying the index with: {query}")
    # fastembed ritorna un generatore di embeddings, converto in lista
    #embeddings = list(embedding_model.embed(query))
    #query_embedding = embeddings[0].tolist()
    query_embedding = embedding_provider.embed(query)
    
    # interrogo ogni namespace
    all_matches = []
    for namespace in target_namespaces:
        print(f"Querying namespace: {namespace}")
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            namespace=namespace
        )
        
        # aggiungo il namespace a ogni match per il tracciamento
        for match in results["matches"]:
            match["namespace"] = namespace
        
        all_matches.extend(results["matches"])
    
    # ordino i risultati combinati per punteggio e prendo i primi 5
    all_matches.sort(key=lambda x: x.get("score", 0), reverse=True)
    top_matches = all_matches[:5]
    
    return top_matches

def display_search_results(matches):
    """Visualizza i risultati della ricerca, ovvero i chunks rilevanti recuperati con i punteggi relativi."""
    if not matches:
        print("No matching results found.")
        return "", []
        
    page_refs = []
    context_with_pages = []
    
    try:
        for i, match in enumerate(matches):
            score = match.get("score", 0.0)
            namespace = match.get("namespace", "unknown")
            metadata = match.get("metadata", {})
            text = metadata.get("text", "")
            page_number = metadata.get("page_label", "unknown")
            file_name = metadata.get("file_name", "unknown")
            
            # estraggo i metadati
            page_refs.append({"page": str(page_number), "file": str(file_name)})
            
            # formatto il contesto con il numero di pagina
            page_info = f"[Page {page_number}]"
            context_with_pages.append(f"{page_info} {text}")
        
        context = "\n\n".join(context_with_pages)
        
        return context, page_refs
    except Exception as e:
        print(f"Error formatting search results: {str(e)}")
        return "", []

def query_llm(query, context, page_refs):
    """Invia la query al modello LLM con il contesto recuperato."""
    try:
        # configuro la chiave api fake di openai per evitare errori tra openAI sdk e openrouter
        os.environ["OPENAI_API_KEY"] = "dummy_value"
        
        llm_model = os.getenv("LLM_MODEL")
        llm = OpenRouter(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            max_tokens=4096,
            context_window=32768,
            model=llm_model
        )
        
        prompt = f"""You are an expert in board game rules and gameplay mechanics, with deep knowledge of strategy games.

Using the context provided, answer the query in a clear, formal, and detailed manner. Your answer MUST:
- Be written in the same language as the query
- Adhere strictly to the official game rules
- Provide clarifications if the context is ambiguous or insufficient
- Avoid speculation beyond the provided rules
- Avoid reiterating the obvious and focus on resolving ambiguity with precise rule-based reasoning
- Include the page number references where the information was found in your answer

---

Query:
{query}

---

Context:
{context}

---

Answer:"""
        
        message = ChatMessage(role="user", content=prompt)
        resp = llm.chat([message])
        print("LLM Response:\n", resp)
        
        # prendo il testo della risposta
        if hasattr(resp, 'message'):
            response_text = resp.message
        elif isinstance(resp, str):
            response_text = resp
        else:
            # converto l'intera risposta in stringa
            response_text = str(resp)
            # estraggo il testo dopo "assistant:" se presente nella stringa
            if "assistant:" in response_text:
                response_text = response_text.split("assistant:", 1)[1].strip()
        
        serializable_page_refs = []
        for ref in page_refs:
            serializable_page_refs.append({
                "page": str(ref["page"]) if "page" in ref else "unknown",
                "file": str(ref["file"]) if "file" in ref else "unknown"
            })
            
        # stampo il riepilogo dei riferimenti
        print("\nReferences:")
        for ref in serializable_page_refs:
            print(f"- Manual: {ref['file']}, Page: {ref['page']}")
            
        # ritorno il testo della risposta
        return response_text
    except Exception as e:
        print(f"Error querying LLM: {str(e)}")
        return f"I encountered an error while processing your query. Error: {str(e)}"

def clear_namespace(index, namespace):
    """Cancella un namespace specifico."""
    index.delete(delete_all=True, namespace=namespace)
    print(f"Cleared namespace {namespace}")

def clear_all_namespaces(index):
    """Cancella tutti i namespace dall'indice.
    
    Returns:
        bool: True se almeno un namespace è stato cancellato, False altrimenti
    """
    # ottieni tutti i namespace disponibili
    index_stats = index.describe_index_stats()
    namespaces = list(index_stats.get("namespaces", {}).keys())
    
    if not namespaces:
        print("No namespaces found to clear.")
        return False
    
    print(f"Found {len(namespaces)} namespaces to clear: {', '.join(namespaces)}")
    
    cleared_count = 0
    for namespace in namespaces:
        print(f"Clearing namespace: {namespace}")
        try:
            index.delete(delete_all=True, namespace=namespace)
            cleared_count += 1
        except Exception as e:
            print(f"Error clearing namespace {namespace}: {str(e)}")
    
    if cleared_count > 0:
        print(f"Successfully cleared {cleared_count} namespaces.")
        return True
    else:
        print("No namespaces were cleared.")
        return False 