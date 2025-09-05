import React from 'react';

const Home = ({ selectedPlatforms, updatePlatforms, navigateTo }) => {
  const handlePlatformChange = (platform) => {
    updatePlatforms({
      ...selectedPlatforms,
      [platform]: !selectedPlatforms[platform]
    });
  };

  const canProceed = selectedPlatforms.googleDrive || selectedPlatforms.oneDrive;

  return (
    <div className="page">
      <h1>Drive Bot</h1>
      <p>Welcome to Drive Bot – AI-powered multi-platform file search!</p>
      
      <h2>Select Platforms</h2>
      <div className="platform-selection">
        <div 
          className={`platform-option ${selectedPlatforms.googleDrive ? 'selected' : ''}`}
          onClick={() => handlePlatformChange('googleDrive')}
        >
          <input
            type="checkbox"
            id="googleDrive"
            checked={selectedPlatforms.googleDrive}
            onChange={() => handlePlatformChange('googleDrive')}
          />
          <label htmlFor="googleDrive">Google Drive</label>
        </div>
        
        <div 
          className={`platform-option ${selectedPlatforms.oneDrive ? 'selected' : ''}`}
          onClick={() => handlePlatformChange('oneDrive')}
        >
          <input
            type="checkbox"
            id="oneDrive"
            checked={selectedPlatforms.oneDrive}
            onChange={() => handlePlatformChange('oneDrive')}
          />
          <label htmlFor="oneDrive">OneDrive</label>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          className="button"
          onClick={() => navigateTo('search')}
          disabled={!canProceed}
        >
          Go to Search
        </button>
        
        <button 
          className="button"
          onClick={() => navigateTo('conversation')}
          disabled={!canProceed}
          style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' }}
        >
          Chat with AI Assistant
        </button>
      </div>
      
      {!canProceed && (
        <p style={{ color: '#ff6b6b', marginTop: '10px', fontSize: '0.9rem' }}>
          Please select at least one platform to continue
        </p>
      )}
    </div>
  );
};

export default Home;
