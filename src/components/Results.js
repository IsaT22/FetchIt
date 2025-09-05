import React from 'react';

const Results = ({ results, searchQuery, navigateTo }) => {
  return (
    <div className="page">
      <h1>Search Results</h1>
      <p>Results for: "<strong>{searchQuery}</strong>"</p>
      
      {results.length > 0 ? (
        <div className="results-list">
          {results.map((result) => (
            <div key={result.id} className="result-item">
              <h3>{result.name}</h3>
              <p><strong>Platform:</strong> {result.platform}</p>
              <p><strong>Summary:</strong> {result.summary}</p>
              <p>
                <strong>Relevance Score:</strong> 
                <span className="relevance-score">{result.relevanceScore}%</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No results found. Try a different search query.</p>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <button 
          className="button"
          onClick={() => navigateTo('search')}
        >
          Back to Search
        </button>
        
        <button 
          className="button secondary"
          onClick={() => navigateTo('home')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Results;
