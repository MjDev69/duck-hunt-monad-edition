const PlayerInfo = ({ username, address, onLogout }) => {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div id="playerInfo" className="player-info">
      <div className="player-details">
        <span id="playerUsername">{username}</span>
        <span id="playerAddress" className="player-address">
          {formatAddress(address)}
        </span>
      </div>
      <button onClick={onLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default PlayerInfo;