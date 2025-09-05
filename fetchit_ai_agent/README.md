# FetchIt AI Agent

This project contains a self-contained, local, and production-ready Python module for **FetchIt**, a conversational AI agent designed to help users find, summarize, and interact with their files.

## Project Structure

- `fetchit_agent/`: The core Python package containing all the AI logic.
  - `agent.py`: The main `FetchItAgent` class that the backend will instantiate and call.
  - `vector_index.py`: Manages the FAISS vector stores for semantic search.
  - `embedder.py`: Handles converting text to vector embeddings using `sentence-transformers`.
  - `connector_interface.py`: Defines the `FileConnector` interface and includes a `LocalFileConnector` for testing and demonstration.
  - `summarizer.py`: Provides text summarization capabilities.
  - `utils.py`: Contains helper functions for file parsing (PDF, DOCX, TXT) and text chunking.
- `requirements.txt`: Lists all necessary Python libraries (`sentence-transformers`, `faiss-cpu`, etc.) for the agent to function.
- `cli_demo.py`: A simple command-line tool for developers to test the agent's functionality in isolation, without needing the full web app.
- `tests/`: A folder with unit tests to ensure the agent's components (indexing, search, chat) are working reliably.

## Setup

1.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

2.  **Run the CLI demo:**

    ```bash
    python cli_demo.py
    ```

## Usage

The `FetchItAgent` is designed to be integrated into a larger application. Here's how to use it:

```python
from fetchit_agent.agent import FetchItAgent
from fetchit_agent.connector_interface import LocalFileConnector

# Initialize the agent
agent = FetchItAgent()

# Initialize a connector (e.g., for local files)
local_connector = LocalFileConnector()

# Index a file
agent.index_file(
    user_id="user123",
    file_path="/path/to/your/document.pdf",
    file_type="pdf",
    connector=local_connector
)

# Ask a question
response = agent.answer_question(
    user_id="user123",
    question="What is the main topic of the document?"
)

print(response["answer"])
print(response["source_files"])
```


