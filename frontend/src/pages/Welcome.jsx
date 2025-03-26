import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css'; 
function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <span className="sparkle-icon"></span>
          <h1>Welcome to Agency Check</h1>
        </div>
        <p className="welcome-description">
        </p>
        <p className="welcome-details">
          Lets get started
        </p>
        <Link to="/login">
          <button className="welcome-button">Get Started</button>
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
