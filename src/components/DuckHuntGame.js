import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AuthenticationOverlay from './AuthenticationOverlay';
import GameCanvas from './GameCanvas';
import PlayerInfo from './PlayerInfo';
import LoadingOverlay from './LoadingOverlay';

// Constants
const MONAD_GAMES_ID = 'cmd8euall0037le0my79qpz42';

const DuckHuntGame = () => {
  // Real Privy authentication
  const { ready, authenticated, user, login, logout } = usePrivy();
  
  // Game authentication state
  const [isGameAuthenticated, setIsGameAuthenticated] = useState(false);
  const [playerWalletAddress, setPlayerWalletAddress] = useState(null);
  const [playerUsername, setPlayerUsername] = useState(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Check authentication status when ready
  useEffect(() => {
    if (ready) {
      setShowLoadingOverlay(false);
      
      if (authenticated && user) {
        handleUserAuthenticated(user);
      } else {
        handleUserNotAuthenticated();
      }
    }
  }, [ready, authenticated, user]);

  // Handle authenticated user
  const handleUserAuthenticated = async (user) => {
    console.log('User authenticated:', user);
    
    try {
      // First, try to find cross-app account (ideal scenario)
      const crossAppAccount = user.linkedAccounts?.find(account => 
        account.type === 'cross_app' && 
        account.providerApp?.id === MONAD_GAMES_ID
      );
      
      if (crossAppAccount && crossAppAccount.embeddedWallets?.length > 0) {
        // Cross-app account found (this is the ideal case)
        const walletAddress = crossAppAccount.embeddedWallets[0].address;
        const username = await fetchUsername(walletAddress);
        
        setIsGameAuthenticated(true);
        setPlayerWalletAddress(walletAddress);
        setPlayerUsername(username);
        setShowAuthOverlay(false);
        
        console.log('Successfully logged in with Monad Games ID cross-app:', {
          username,
          walletAddress
        });
        
        showNotification('Welcome!', `Logged in as ${username}`);
        return;
      }
      
      // Fallback: Try to find email account and lookup Monad Games ID
      const emailAccount = user.linkedAccounts?.find(account => 
        account.type === 'email'
      );
      
      if (emailAccount && emailAccount.address) {
        console.log('Trying email-based Monad Games ID lookup for:', emailAccount.address);
        
        // Look up Monad Games ID by email
        const monadAccount = await fetchMonadGamesByEmail(emailAccount.address);
        
        if (monadAccount) {
          setIsGameAuthenticated(true);
          setPlayerWalletAddress(monadAccount.walletAddress);
          setPlayerUsername(monadAccount.username);
          setShowAuthOverlay(false);
          
          console.log('Successfully found Monad Games ID via email lookup:', monadAccount);
          
          showNotification('Welcome!', `Logged in as ${monadAccount.username}`);
          return;
        }
      }
      
      // No Monad Games ID found
      console.log('No Monad Games ID account found');
      handleUserNotAuthenticated();
      
    } catch (error) {
      console.error('Error processing authenticated user:', error);
      handleUserNotAuthenticated();
    }
  };

  // Handle unauthenticated user
  const handleUserNotAuthenticated = () => {
    console.log('User not authenticated');
    setIsGameAuthenticated(false);
    setPlayerWalletAddress(null);
    setPlayerUsername(null);
    setShowAuthOverlay(true);
  };

  // Clear authentication and logout
  const clearAuthAndLogout = async () => {
    try {
      await logout();
      handleUserNotAuthenticated();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch Monad Games ID by email
  const fetchMonadGamesByEmail = async (email) => {
    try {
      console.log('Looking up Monad Games ID for email:', email);
      
      // TEMPORARY: Hardcode your account for testing
      if (email === 'mjanasmjtest@gmail.com') {
        return {
          walletAddress: '0xDF6D8ae50cf79C9F8e4Aa3Bc0e8e1a6c28F4f3',
          username: '@mja'
        };
      }
      
      console.log('Email not found in Monad Games ID system');
      return null;
      
    } catch (error) {
      console.error('Error fetching Monad Games ID by email:', error);
      return null;
    }
  };

  // Fetch username from Monad Games ID API
  const fetchUsername = async (walletAddress) => {
    try {
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.hasUsername && data.user?.username) {
        return data.user.username;
      } else {
        // User doesn't have a username yet
        return getDisplayUsername(walletAddress);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
      return getDisplayUsername(walletAddress);
    }
  };

  // Login with Monad Games ID
  const loginWithMonadGamesID = async () => {
    try {
      console.log('Starting Monad Games ID login...');
      
      // Use standard Privy login - configuration in Provider handles cross-app
      await login();
      
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login Failed', 'Please try again or contact support.');
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      
      await logout();
      
      // Reset state
      setIsGameAuthenticated(false);
      setPlayerWalletAddress(null);
      setPlayerUsername(null);
      setShowAuthOverlay(true);
      
      showNotification('Logged Out', 'Disconnected from Monad Games ID');
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Play as guest
  const playAsGuest = () => {
    setShowAuthOverlay(false);
    console.log('Playing as guest');
  };

  // Get display username (fallback function)
  const getDisplayUsername = (walletAddress) => {
    const suffix = walletAddress.slice(-4);
    return `DuckHunter${suffix}`;
  };

  // Submit score function
  const submitScore = async (score) => {
    console.log(`Attempting to submit score: ${score}`);
    
    if (!isGameAuthenticated || !playerWalletAddress) {
      console.log('User not authenticated, prompting for login');
      return {
        success: false,
        message: 'Sign in with Monad Games ID to save your score to the global leaderboard!',
        showLoginButton: true
      };
    }
    
    try {
      console.log(`Submitting score ${score} for player ${playerWalletAddress}`);
      
      // Here you would submit to the actual Monad Games leaderboard smart contract
      // For now, we'll simulate success
      showNotification('Score Submitted!', 
        `Your score of ${score} points has been recorded on the Monad Games leaderboard.`);
      
      return {
        success: true,
        message: `🎯 Score ${score} submitted to Monad Games leaderboard!`,
        showLoginButton: false
      };
      
    } catch (error) {
      console.error('Error submitting score:', error);
      showNotification('Submission Failed', 'Failed to submit score. Please try again.');
      return {
        success: false,
        message: 'Failed to submit score. Please try again.',
        showLoginButton: false
      };
    }
  };

  // Show notification function
  const showNotification = (title, message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(145deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95));
      color: white;
      padding: 20px;
      border-radius: 10px;
      border: 2px solid #6366f1;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
      font-family: 'Rajdhani', sans-serif;
    `;
    
    notification.innerHTML = `
      <h4 style="margin: 0 0 10px 0; font-size: 1.1rem; font-weight: 700;">${title}</h4>
      <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  };

  return (
    <>
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <LoadingOverlay />
      )}

      {/* Authentication Overlay */}
      {showAuthOverlay && !showLoadingOverlay && (
        <AuthenticationOverlay
          onLogin={loginWithMonadGamesID}
          onPlayAsGuest={playAsGuest}
        />
      )}

      {/* Player Info Bar */}
      {isGameAuthenticated && (
        <PlayerInfo
          username={playerUsername}
          address={playerWalletAddress}
          onLogout={handleLogout}
        />
      )}

      {/* Main Game Container */}
      <div className="game-container">
        {/* Header */}
        <header className="game-header">
          <h1 className="game-title">DuckNads: Monad Edition</h1>
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span id="score" className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Round</span>
              <div>
                <span id="round" className="stat-value">1</span>
                <span className="stat-sub">/3</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <div>
                <span id="timer" className="stat-value">30</span>
                <span className="stat-sub">s</span>
              </div>
            </div>
          </div>
        </header>

        {/* Game Canvas Component */}
        <GameCanvas 
          submitScore={submitScore}
          onLoginRequest={loginWithMonadGamesID}
        />

        {/* Instructions */}
        <div className="instructions">
          <h3>Mission Briefing</h3>
          <div className="briefing-grid">
            <div className="briefing-section">
              <h4>Scoring System</h4>
              <p><span className="score-item">Round 1:</span> 10 points per duck</p>
              <p><span className="score-item">Round 2:</span> 15 points per duck</p>
              <p><span className="score-item">Round 3:</span> 20 points per duck</p>
            </div>
            
            <div className="briefing-section">
              <h4>Special Targets</h4>
              <p><span className="gold-duck">✨ Golden Duck:</span> 50 points (rare)</p>
              <p><span className="tiny-duck">⚡ Tiny Duck:</span> 25 points (small & fast)</p>
            </div>
            
            <div className="briefing-section">
              <h4>Difficulty Progression</h4>
              <p>Each round increases duck speed</p>
              <p>More targets spawn simultaneously</p>
              <p>3 rounds • 30 seconds each</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DuckHuntGame;