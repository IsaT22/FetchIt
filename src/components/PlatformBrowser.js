import React, { useState, useMemo } from 'react';
import { getAllCategories, searchPlatforms } from '../services/platformRegistry';

const PlatformBrowser = ({ onSelectPlatform, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...getAllCategories()];
  
  const filteredPlatforms = useMemo(() => {
    let platforms = searchPlatforms(searchQuery);
    
    if (selectedCategory !== 'All') {
      platforms = platforms.filter(platform => platform.category === selectedCategory);
    }
    
    return platforms;
  }, [searchQuery, selectedCategory]);

  const platformsByCategory = useMemo(() => {
    const grouped = {};
    filteredPlatforms.forEach(platform => {
      if (!grouped[platform.category]) {
        grouped[platform.category] = [];
      }
      grouped[platform.category].push(platform);
    });
    return grouped;
  }, [filteredPlatforms]);

  return (
    <div className="platform-browser">
      <div className="browser-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Add New Connection</h2>
        <p>Search and connect to platforms that store your files</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="platforms-grid">
        {selectedCategory === 'All' ? (
          // Show platforms grouped by category
          Object.entries(platformsByCategory).map(([category, platforms]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category}</h3>
              <div className="platforms-row">
                {platforms.map(platform => (
                  <div
                    key={platform.id}
                    className="platform-card"
                    onClick={() => onSelectPlatform(platform)}
                  >
                    <img src={platform.icon} alt={platform.name} className="platform-logo" />
                    <h4 className="platform-name">{platform.name}</h4>
                    <p className="platform-description">{platform.description}</p>
                    <div className="platform-features">
                      {platform.features.slice(0, 3).map(feature => (
                        <span key={feature} className="feature-tag">
                          {feature.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Show platforms in selected category only
          <div className="platforms-row">
            {filteredPlatforms.map(platform => (
              <div
                key={platform.id}
                className="platform-card"
                onClick={() => onSelectPlatform(platform)}
              >
                <img src={platform.icon} alt={platform.name} className="platform-logo" />
                <h4 className="platform-name">{platform.name}</h4>
                <p className="platform-description">{platform.description}</p>
                <div className="platform-features">
                  {platform.features.slice(0, 3).map(feature => (
                    <span key={feature} className="feature-tag">
                      {feature.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="no-results">
          <p>No platforms found matching your search.</p>
          <button onClick={() => setSearchQuery('')} className="clear-search-btn">
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default PlatformBrowser;
