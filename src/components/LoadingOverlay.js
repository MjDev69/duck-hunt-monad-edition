const LoadingOverlay = () => {
  return (
    <div id="loadingOverlay" className="loading-overlay">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Initializing Monad Games ID...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;