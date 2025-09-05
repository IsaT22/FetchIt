
import os
import pytest
from fetchit_agent.agent import FetchItAgent
from fetchit_agent.connector_interface import LocalFileConnector

# Setup a temporary data directory for tests
@pytest.fixture(scope="module")
def agent_data_dir(tmp_path_factory):
    return tmp_path_factory.mktemp("agent_data")

@pytest.fixture(scope="module")
def fetchit_agent(agent_data_dir):
    return FetchItAgent(data_dir=str(agent_data_dir))

@pytest.fixture(scope="module")
def local_connector():
    return LocalFileConnector()

# Create dummy files for testing
@pytest.fixture(scope="module")
def dummy_files(tmp_path_factory):
    docs_dir = tmp_path_factory.mktemp("documents")
    
    file1_path = docs_dir / "test_doc1.txt"
    file1_path.write_text("This is the first test document. It talks about AI and machine learning.")

    file2_path = docs_dir / "test_doc2.txt"
    file2_path.write_text("The second document discusses natural language processing and deep learning models.")

    # Create a dummy PDF file (requires pypdf to read)
    # For simplicity, we'll create a very basic one or use a placeholder.
    # A real test would involve a proper PDF generation or a pre-existing dummy PDF.
    # For now, let's just create a dummy file that the TextProcessor can attempt to read.
    pdf_path = docs_dir / "test_pdf.pdf"
    # This is a placeholder. In a real scenario, you'd use a library like reportlab to create a valid PDF.
    # For testing text extraction, a simple text file renamed to .pdf might suffice if pypdf is lenient.
    # Or, we can just test the indexing with a .txt and assume PDF parsing works if pypdf is installed.
    # For now, let's create a simple text file and pretend it's a PDF for the test setup.
    # The actual text extraction is tested in test_utils.py
    pdf_path.write_text("This is a dummy PDF content. It mentions data science and analytics.")

    docx_path = docs_dir / "test_docx.docx"
    # Similar to PDF, creating a real DOCX is complex for a fixture.
    # We'll rely on test_utils.py for actual docx parsing tests.
    docx_path.write_text("This is a dummy DOCX content. It talks about project management and agile methodologies.")

    return {
        "file1": str(file1_path),
        "file2": str(file2_path),
        "pdf": str(pdf_path),
        "docx": str(docx_path)
    }

def test_index_and_search(fetchit_agent, local_connector, dummy_files):
    user_id = "test_user_1"
    
    # Index first file
    fetchit_agent.index_file(user_id, dummy_files["file1"], "txt", local_connector)
    indexed_files = fetchit_agent.list_indexed_files(user_id)
    assert dummy_files["file1"] in indexed_files

    # Search for a term in the first file
    results = fetchit_agent.search_files(user_id, "AI machine learning")
    assert len(results) > 0
    assert "AI and machine learning" in results[0]["content"]

    # Index second file
    fetchit_agent.index_file(user_id, dummy_files["file2"], "txt", local_connector)
    indexed_files = fetchit_agent.list_indexed_files(user_id)
    assert dummy_files["file1"] in indexed_files
    assert dummy_files["file2"] in indexed_files

    # Search for a term that should be in the second file
    results = fetchit_agent.search_files(user_id, "natural language processing")
    assert len(results) > 0
    assert "natural language processing" in results[0]["content"]

def test_remove_file(fetchit_agent, local_connector, dummy_files):
    user_id = "test_user_2"
    fetchit_agent.index_file(user_id, dummy_files["file1"], "txt", local_connector)
    fetchit_agent.index_file(user_id, dummy_files["file2"], "txt", local_connector)

    indexed_files = fetchit_agent.list_indexed_files(user_id)
    assert dummy_files["file1"] in indexed_files
    assert dummy_files["file2"] in indexed_files

    fetchit_agent.remove_file(user_id, dummy_files["file1"])
    indexed_files = fetchit_agent.list_indexed_files(user_id)
    assert dummy_files["file1"] not in indexed_files
    assert dummy_files["file2"] in indexed_files

    # Ensure searching for removed file content yields no results
    results = fetchit_agent.search_files(user_id, "AI machine learning")
    assert len(results) == 0

def test_summarize_file(fetchit_agent, local_connector, dummy_files):
    user_id = "test_user_3"
    # For summarize_file, we need to ensure the content is read correctly.
    # The dummy_files fixture creates text files.
    summary = fetchit_agent.summarize_file(user_id, dummy_files["file1"], "txt", local_connector, num_sentences=1)
    assert "test document" in summary or "AI" in summary
    assert len(summary.split('.')) <= 2 # Should be roughly 1 sentence

def test_answer_question(fetchit_agent, local_connector, dummy_files):
    user_id = "test_user_4"
    fetchit_agent.index_file(user_id, dummy_files["file1"], "txt", local_connector)
    fetchit_agent.index_file(user_id, dummy_files["file2"], "txt", local_connector)

    response = fetchit_agent.answer_question(user_id, "What is discussed about deep learning?")
    assert "answer" in response
    assert "source_files" in response
    assert "deep learning" in response["answer"] or "natural language processing" in response["answer"]
    assert dummy_files["file2"] in response["source_files"]

    response = fetchit_agent.answer_question(user_id, "Tell me about AI.")
    assert "AI" in response["answer"] or "machine learning" in response["answer"]
    assert dummy_files["file1"] in response["source_files"]

def test_chat_history(fetchit_agent):
    user_id = "test_user_5"
    fetchit_agent.process_message(user_id, "Hello agent.")
    history = fetchit_agent.get_chat_history(user_id)
    assert len(history) == 2 # User message + agent response
    assert history[0]["content"] == "Hello agent."

    fetchit_agent.clear_chat_history(user_id)
    history = fetchit_agent.get_chat_history(user_id)
    assert len(history) == 0



