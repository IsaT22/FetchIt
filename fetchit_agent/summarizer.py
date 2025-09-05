
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

class Summarizer:
    def __init__(self, language: str = "english"):
        self.language = language
        self.stemmer = Stemmer(language)
        self.summarizer = LsaSummarizer(self.stemmer)
        self.summarizer.stop_words = get_stop_words(language)

    def summarize(self, text_content: str, num_sentences: int = 3) -> str:
        """Generates an extractive summary of the given text content."""
        if not text_content:
            return ""
        
        parser = PlaintextParser.from_string(text_content, Tokenizer(self.language))
        summary_sentences = self.summarizer(parser.document, num_sentences)
        return " ".join([str(sentence) for sentence in summary_sentences])


