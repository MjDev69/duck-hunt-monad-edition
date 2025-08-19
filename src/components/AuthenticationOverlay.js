import React from 'react';

const AuthenticationOverlay = ({ onLogin, onPlayAsGuest }) => {
  const handleUsernameRegistration = () => {
    window.open('https://monad-games-id-site.vercel.app/', '_blank');
  };

  return (
    <div id="authOverlay" className="auth-overlay">
      <div className="auth-content">
        <h2>Welcome to DuckNads!</h2>
        <p>Sign in with your Monad Games ID to track your scores on the global leaderboard</p>
        <button onClick={onLogin} className="auth-button">
          🎮 Sign in with Monad Games ID
        </button>
        <p className="auth-note">
          Don't have a Monad Games ID username?{' '}
          <span onClick={handleUsernameRegistration} className="guest-link">
            Register here
          </span>
        </p>
        <p className="auth-note">
          Or <span onClick={onPlayAsGuest} className="guest-link">play as guest</span>
        </p>
      </div>
    </div>
  );
};

export default AuthenticationOverlay;