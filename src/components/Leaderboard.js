import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "totalScoreOfPlayer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const Leaderboard = ({ playerWalletAddress, isVisible, onClose }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboardData();
    }
  }, [isVisible]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll use mock data since we need a way to get all players
      // In a real implementation, you'd have a backend service that indexes
      // the PlayerDataUpdated events to build the leaderboard
      
      const mockData = [
        { 
          username: '@mja', 
          address: '0xDF6D8ae50cf79C9F8e4Aa3Bc0e8e1a6c28F4f3',
          score: 1250,
          games: 15,
          rank: 1
        },
        { 
          username: 'DuckHunterPro', 
          address: '0x742d35Cc6635C0532925a3b8D2697b4C7F8A0123',
          score: 980,
          games: 8,
          rank: 2
        },
        { 
          username: 'QuackMaster', 
          address: '0x8ba1f109551bD432803012645Hac189B904567',
          score: 875,
          games: 12,
          rank: 3
        },
        { 
          username: 'MonadGamer', 
          address: '0x423d35Cc5635C0532925a3b8D2697b4C7F8A9876',
          score: 750,
          games: 6,
          rank: 4
        },
        { 
          username: 'DuckNinja', 
          address: '0x9ba1f109551bD432803012645Hac189B904321',
          score: 680,
          games: 9,
          rank: 5
        }
      ];

      // If current player is not in the top 5, add them
      if (playerWalletAddress && !mockData.find(p => p.address === playerWalletAddress)) {
        mockData.push({
          username: getDisplayUsername(playerWalletAddress),
          address: playerWalletAddress,
          score: 0,
          games: 0,
          rank: mockData.length + 1,
          isCurrentPlayer: true
        });
      } else if (playerWalletAddress) {
        // Mark current player
        const playerIndex = mockData.findIndex(p => p.address === playerWalletAddress);
        if (playerIndex !== -1) {
          mockData[playerIndex].isCurrentPlayer = true;
        }
      }

      setLeaderboardData(mockData);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayUsername = (address) => {
    const suffix = address.slice(-4);
    return `DuckHunter${suffix}`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isVisible) return null;

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h2>🏆 Global Leaderboard</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchLeaderboardData} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="leaderboard-list">
            <div className="leaderboard-headers">
              <span>Rank</span>
              <span>Player</span>
              <span>Score</span>
              <span>Games</span>
            </div>
            
            {leaderboardData.map((player, index) => (
              <div 
                key={player.address} 
                className={`leaderboard-row ${player.isCurrentPlayer ? 'current-player' : ''}`}
              >
                <div className="rank">
                  {player.rank <= 3 ? (
                    <span className={`medal medal-${player.rank}`}>
                      {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="rank-number">#{player.rank}</span>
                  )}
                </div>
                
                <div className="player-info">
                  <div className="username">{player.username}</div>
                  <div className="address">{formatAddress(player.address)}</div>
                </div>
                
                <div className="score">
                  {player.score.toLocaleString()}
                </div>
                
                <div className="games">
                  {player.games}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="leaderboard-footer">
          <p>🎮 Powered by Monad Games ID</p>
          <p>Scores are recorded on-chain on Monad testnet</p>
        </div>
      </div>

      <style jsx>{`
        .leaderboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .leaderboard-content {
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          border-radius: 15px;
          border: 2px solid #6366f1;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #6366f1;
        }

        .leaderboard-header h2 {
          color: white;
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .loading-state, .error-state {
          text-align: center;
          padding: 40px 20px;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(99, 102, 241, 0.3);
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-button {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 10px;
          transition: background 0.3s;
        }

        .retry-button:hover {
          background: #5856eb;
        }

        .leaderboard-headers {
          display: grid;
          grid-template-columns: 80px 1fr 100px 80px;
          gap: 15px;
          padding: 15px 20px;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          margin-bottom: 15px;
          font-weight: 700;
          color: white;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .leaderboard-row {
          display: grid;
          grid-template-columns: 80px 1fr 100px 80px;
          gap: 15px;
          padding: 15px 20px;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .leaderboard-row:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .leaderboard-row.current-player {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.2);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .rank {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .medal {
          font-size: 1.5rem;
        }

        .rank-number {
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .username {
          color: white;
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 2px;
        }

        .address {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-family: monospace;
        }

        .score {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .games {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .leaderboard-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
        }

        .leaderboard-footer p {
          color: rgba(255, 255, 255, 0.7);
          margin: 5px 0;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .leaderboard-content {
            padding: 20px;
            width: 95%;
          }

          .leaderboard-headers,
          .leaderboard-row {
            grid-template-columns: 60px 1fr 80px 60px;
            gap: 10px;
            padding: 12px 15px;
          }

          .leaderboard-headers {
            font-size: 0.8rem;
          }

          .username {
            font-size: 0.9rem;
          }

          .score {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;