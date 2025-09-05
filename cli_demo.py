
import os
from fetchit_agent.agent import FetchItAgent
from fetchit_agent.connector_interface import LocalFileConnector

def main():
    print("Welcome to FetchIt AI Agent CLI Demo!")
    data_dir = "./fetchit_agent_data"
    agent = FetchItAgent(data_dir=data_dir)
    local_connector = LocalFileConnector()

    user_id = input("Enter a user ID (e.g., 'user123'): ")

    while True:
        command = input("\nChoose an action: (index, remove, list, chat, summarize_file, clear_history, exit): ").lower()

        if command == "index":
            file_path = input("Enter file path to index (e.g., 'documents/my_doc.txt'): ")
            file_type = input("Enter file type (txt, pdf, docx): ").lower()
            if not os.path.exists(file_path):
                print(f"Error: File not found at {file_path}")
                continue
            try:
                agent.index_file(user_id, file_path, file_type, local_connector)
                print(f"File {file_path} indexed successfully.")
            except Exception as e:
                print(f"Failed to index file: {e}")
        
        elif command == "remove":
            file_path = input("Enter file path to remove: ")
            try:
                agent.remove_file(user_id, file_path)
                print(f"File {file_path} removed successfully.")
            except Exception as e:
                print(f"Failed to remove file: {e}")

        elif command == "list":
            indexed_files = agent.list_indexed_files(user_id)
            if indexed_files:
                print("Indexed files:")
                for f in indexed_files:
                    print(f"- {f}")
            else:
                print("No files indexed for this user.")

        elif command == "chat":
            print("Start chatting with the agent. Type 'back' to return to main menu.")
            while True:
                chat_message = input(f"You ({user_id}): ")
                if chat_message.lower() == "back":
                    break
                response = agent.process_message(user_id, chat_message)
                print(f"Agent: {response['answer']}")
                if response['source_files']:
                    print("Source files:")
                    for sf in response['source_files']:
                        print(f"- {sf}")

        elif command == "summarize_file":
            file_path = input("Enter file path to summarize: ")
            file_type = input("Enter file type (txt, pdf, docx): ").lower()
            num_sentences = int(input("Number of sentences for summary (default 3): ") or 3)
            if not os.path.exists(file_path):
                print(f"Error: File not found at {file_path}")
                continue
            try:
                summary = agent.summarize_file(user_id, file_path, file_type, local_connector, num_sentences)
                print(f"Summary of {file_path}:\n{summary}")
            except Exception as e:
                print(f"Failed to summarize file: {e}")

        elif command == "clear_history":
            agent.clear_chat_history(user_id)
            print("Chat history cleared.")

        elif command == "exit":
            print("Exiting demo.")
            break

        else:
            print("Invalid command. Please try again.")

if __name__ == "__main__":
    # Create a dummy documents directory for the demo
    os.makedirs("documents", exist_ok=True)
    with open("documents/sample.txt", "w") as f:
        f.write("This is a sample text document. It contains some information about the project. We are building an AI agent.")
    with open("documents/another_sample.txt", "w") as f:
        f.write("This is another sample text document. It talks about the features of the AI agent, including summarization and search.")
    
    main()


