import React, { useState } from 'react';

const Search = ({ searchQuery, setSearchQuery, performSearch, navigateTo }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      performSearch(localQuery);
    }
  };

  const handleVoiceInput = () => {
    // Placeholder for future Eleven Labs integration
    alert('Voice input will be integrated with Eleven Labs in the future!');
  };

  return (
    <div className="page">
      <h1>Search Files</h1>
      <p>Enter your search query to find files across your selected platforms</p>
      
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Enter your search query..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        
        <button
          type="button"
          className="voice-button"
          onClick={handleVoiceInput}
        >
          🎤 Voice Input
        </button>
        
        <button 
          type="submit"
          className="button"
          disabled={!localQuery.trim()}
        >
          Search Files
        </button>
      </form>
      
      <button 
        className="button secondary"
        onClick={() => navigateTo('home')}
      >
        Back to Home
      </button>
    </div>
  );
};

export default Search;
