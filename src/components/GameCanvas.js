import { useRef, useEffect, useState, useCallback } from 'react';

// Debug Panel Component (temporary for testing)
const DebugPanel = ({ gameRefs, gameState, currentRound }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      left: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 1000,
      borderRadius: '5px',
      fontFamily: 'monospace'
    }}>
      <div>Game State: {gameState}</div>
      <div>Round: {currentRound}</div>
      <div>Ducks: {gameRefs.current?.ducks?.length || 0}</div>
      <div>Animation Time: {gameRefs.current?.animationTime?.toFixed(2) || 0}</div>
      <div>Running: {gameRefs.current?.isGameRunning ? 'Yes' : 'No'}</div>
      <div>Clouds: {gameRefs.current?.clouds?.length || 0}</div>
      <div>Hit Streak: {gameRefs.current?.hitStreak || 0}</div>
    </div>
  );
};

const GameCanvas = ({ submitScore, onLoginRequest }) => {
  // Canvas ref
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  
  // Game state
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'roundEnd', 'gameEnd'
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Game refs (using refs for values that need to persist but don't trigger re-renders)
  const gameRefs = useRef({
    ducks: [],
    gameTimer: null,
    countdownTimer: null,
    animationTimer: null,
    animationTime: 0,
    clouds: [],
    feedbackMessages: [],
    hitStreak: 0,
    maxHitStreak: 0,
    missedShots: 0,
    duckImage: new Image(),
    backgroundAudio: new Audio('/assets/ducksound.mp3'),
    quackAudio: new Audio('/assets/quack.mp3'),
    imageLoaded: false,
    isGameRunning: false,
    currentRoundRef: 1 // FIX: Add ref to track current round
  });

  // Game constants
  const TOTAL_ROUNDS = 3;
  const ROUND_TIME = 30;
  const DUCK_SIZE = 60;
  const DUCK_SPAWN_RATE = 0.02;
  
  // Progressive difficulty settings
  const getDifficultySettings = (round) => {
    switch(round) {
      case 1:
        return { speed: 1.5, maxDucks: 4, erraticMovement: 0.05 };
      case 2:
        return { speed: 2.5, maxDucks: 5, erraticMovement: 0.15 };
      case 3:
        return { speed: 3.5, maxDucks: 7, erraticMovement: 0.25 };
      default:
        return { speed: 1.5, maxDucks: 4, erraticMovement: 0.05 };
    }
  };

  // FIX: Update the ref whenever currentRound changes
  useEffect(() => {
    gameRefs.current.currentRoundRef = currentRound;
    console.log('Updated round ref to:', currentRound);
  }, [currentRound]);

  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    
    setupCanvas();
    setupAudio();
    loadDuckImage();
    generateClouds();
    
    // Initial draw
    drawBackground();
    
    return () => {
      // Cleanup ALL timers on unmount
      const refs = gameRefs.current;
      if (refs.gameTimer) clearInterval(refs.gameTimer);
      if (refs.countdownTimer) clearInterval(refs.countdownTimer);
      if (refs.animationTimer) clearInterval(refs.animationTimer);
    };
  }, []);

  // Setup canvas responsiveness
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(300, Math.min(500, window.innerHeight * 0.6));
      
      // Regenerate clouds when canvas resizes
      generateClouds();
      
      if (gameState === 'start') {
        drawBackground();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  };

  // Setup audio
  const setupAudio = () => {
    const { backgroundAudio, quackAudio } = gameRefs.current;
    
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3;
    quackAudio.volume = 0.6;
    
    backgroundAudio.onerror = () => console.log('Background audio failed to load');
    quackAudio.onerror = () => console.log('Quack audio failed to load');
    
    backgroundAudio.load();
    quackAudio.load();
  };

  // Load duck image
  const loadDuckImage = () => {
    const { duckImage } = gameRefs.current;
    
    duckImage.onload = () => {
      gameRefs.current.imageLoaded = true;
      console.log('Duck image loaded successfully!');
    };
    
    duckImage.onerror = () => {
      gameRefs.current.imageLoaded = false;
      console.log('Duck image failed to load, using fallback');
    };
    
    duckImage.src = '/assets/ducknads.png';
    
    // Fallback SVG
    setTimeout(() => {
      if (!gameRefs.current.imageLoaded) {
        duckImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjMwIiBjeT0iMzUiIHJ4PSIyMCIgcnk9IjE1IiBmaWxsPSIjRkZENzAwIi8+CjxlbGxpcHNlIGN4PSI0MCIgY3k9IjIwIiByeD0iMTAiIHJ5PSIxMCIgZmlsbD0iI0ZGRDcwMCIvPgo8ZWxsaXBzZSBjeD0iNDgiIGN5PSIxOCIgcng9IjUiIHJ5PSIzIiBmaWxsPSIjRkY4QzAwIi8+CjxjaXJjbGUgY3g9IjQ1IiBjeT0iMTYiIHI9IjIiIGZpbGw9IiMwMDAwMDAiLz4KPC9zdmc+';
      }
    }, 1000);
  };

  // Generate clouds for background
  const generateClouds = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    console.log('Generating clouds for canvas size:', canvas.width, 'x', canvas.height);
    
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: 50 + Math.random() * 100,
        size: 40 + Math.random() * 60,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
    gameRefs.current.clouds = clouds;
    console.log('Generated clouds:', clouds);
  };

  // Game control functions
  const startGame = () => {
    console.log('Starting game...');
    setGameState('playing');
    setCurrentRound(1);
    setScore(0);
    // Don't call startRound here - let useEffect handle it
  };

  // FIX: Remove useCallback and dependencies - make it simpler
  const startRound = () => {
    // FIX: Use ref value instead of state value
    const roundToStart = gameRefs.current.currentRoundRef;
    
    // FIX: Prevent double execution
    if (gameRefs.current.isGameRunning) {
      console.log('Game already running, preventing double start for round', roundToStart);
      return;
    }
    
    console.log(`Starting round ${roundToStart} (refs round: ${gameRefs.current.currentRoundRef})`);
    gameRefs.current.isGameRunning = true;
    
    // Clear existing timers first
    const refs = gameRefs.current;
    if (refs.gameTimer) {
      clearInterval(refs.gameTimer);
      refs.gameTimer = null;
    }
    if (refs.countdownTimer) {
      clearInterval(refs.countdownTimer);
      refs.countdownTimer = null;
    }
    if (refs.animationTimer) {
      clearInterval(refs.animationTimer);
      refs.animationTimer = null;
    }
    
    // Reset round state
    setTimeLeft(ROUND_TIME);
    refs.ducks = [];
    refs.feedbackMessages = [];
    refs.hitStreak = 0;
    refs.animationTime = 0;
    
    // FIX: Force regenerate clouds for each round
    generateClouds();
    
    // Start background music
    playBackgroundMusic();
    
    // Start SEPARATE animation timer for consistent canvas updates
    refs.animationTimer = setInterval(() => {
      updateGame();
    }, 1000/60); // 60 FPS
    
    // Start countdown timer
    refs.countdownTimer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          endRound();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  // FIX: Simpler useEffect with better timing
  useEffect(() => {
    if (gameState === 'playing') {
      console.log('Game state changed to playing, starting round', currentRound);
      // Small delay to ensure state is settled
      const timeout = setTimeout(() => {
        startRound();
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [gameState]); // Only depend on gameState

  const updateGame = () => {
    const refs = gameRefs.current;
    
    // FIX: Check both gameState and running flag
    if (gameState !== 'playing' || !refs.isGameRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Update animation time
    refs.animationTime += 0.016;
    
    // Update clouds - FIX: Ensure clouds move in all rounds
    if (refs.clouds && refs.clouds.length > 0) {
      refs.clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.size) {
          cloud.x = -cloud.size;
        }
      });
    }
    
    // FIX: Use ref value for current round and round-specific difficulty
    const currentRoundForSpawn = refs.currentRoundRef;
    const difficulty = getDifficultySettings(currentRoundForSpawn);
    const spawnRate = currentRoundForSpawn === 1 ? DUCK_SPAWN_RATE * 3 : DUCK_SPAWN_RATE * 1.5;
    
    if (Math.random() < spawnRate && refs.ducks.length < difficulty.maxDucks) {
      console.log(`Round ${currentRoundForSpawn}: Spawning duck! Current duck count: ${refs.ducks.length}/${difficulty.maxDucks}`);
      spawnDuck();
    }
    
    // Update ducks
    if (refs.ducks && refs.ducks.length > 0) {
      refs.ducks.forEach((duck, index) => {
        updateDuck(duck);
        
        // Remove ducks that are off screen
        if (duck.x > canvas.width + 100 || 
            duck.x < -100 || 
            duck.y > canvas.height + 100 || 
            duck.y < -100) {
          console.log('Removing off-screen duck');
          refs.ducks.splice(index, 1);
        }
      });
    }
    
    // Update feedback messages
    if (refs.feedbackMessages) {
      for (let i = refs.feedbackMessages.length - 1; i >= 0; i--) {
        const feedback = refs.feedbackMessages[i];
        feedback.life--;
        if (feedback.life <= 0) {
          refs.feedbackMessages.splice(i, 1);
        }
      }
    }
    
    // Draw everything
    draw();
  };

  const spawnDuck = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    console.log('Spawning duck at canvas size:', canvas.width, 'x', canvas.height);
    
    // Get difficulty settings for current round
    const currentRoundForSpawn = gameRefs.current.currentRoundRef;
    const difficulty = getDifficultySettings(currentRoundForSpawn);
    
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    switch(side) {
      case 0: // Top
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * difficulty.speed;
        vy = Math.random() * difficulty.speed + 0.5;
        break;
      case 1: // Right
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -Math.random() * difficulty.speed - 0.5;
        vy = (Math.random() - 0.5) * difficulty.speed;
        break;
      case 2: // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        vx = (Math.random() - 0.5) * difficulty.speed;
        vy = -Math.random() * difficulty.speed - 0.5;
        break;
      case 3: // Left
        x = -50;
        y = Math.random() * canvas.height;
        vx = Math.random() * difficulty.speed + 0.5;
        vy = (Math.random() - 0.5) * difficulty.speed;
        break;
      default:
        x = -50;
        y = canvas.height / 2;
        vx = difficulty.speed;
        vy = 0;
    }
    
    // Add randomness
    vx += (Math.random() - 0.5) * 0.5;
    vy += (Math.random() - 0.5) * 0.5;
    
    // Determine duck type based on round
    let duckType = 'normal';
    let points = getPointsForRound();
    let size = DUCK_SIZE;
    let hits = 1; // Default: single hit
    let maxHits = 1;
    
    const rand = Math.random();
    if (currentRoundForSpawn === 3 && rand < 0.1) { // 10% chance in Round 3
      duckType = 'armored';
      points = 30;
      size = DUCK_SIZE * 1.1; // Slightly larger
      hits = 2; // Requires 2 hits
      maxHits = 2;
    } else if (rand < 0.05) { // 5% chance
      duckType = 'golden';
      points = 50;
      size = DUCK_SIZE * 0.8;
    } else if (rand < 0.15) { // 10% chance
      duckType = 'tiny';
      points = 25;
      size = DUCK_SIZE * 0.6;
    }
    
    const newDuck = {
      x, y, vx, vy, size,
      rotation: Math.atan2(vy, vx),
      hit: false,
      type: duckType,
      points: points,
      hits: hits, // Current hits remaining
      maxHits: maxHits, // Total hits required
      erraticMovement: difficulty.erraticMovement // Store erratic movement factor
    };
    
    gameRefs.current.ducks.push(newDuck);
    console.log(`Duck spawned (Round ${currentRoundForSpawn}):`, newDuck, 'Total ducks:', gameRefs.current.ducks.length);
  };

  const getPointsForRound = () => {
    // FIX: Use ref value
    const round = gameRefs.current.currentRoundRef;
    switch(round) {
      case 1: return 10;
      case 2: return 15;
      case 3: return 20;
      default: return 10;
    }
  };

  const updateDuck = (duck) => {
    if (duck.hit) return;
    
    // Update position
    duck.x += duck.vx;
    duck.y += duck.vy;
    
    // Add erratic movement based on round difficulty
    const erraticFactor = duck.erraticMovement || 0.05;
    duck.vx += (Math.random() - 0.5) * erraticFactor;
    duck.vy += (Math.random() - 0.5) * erraticFactor;
    
    // Update rotation
    duck.rotation = Math.atan2(duck.vy, duck.vx);
    
    // Speed limits - use round-specific max speed
    const currentRoundForUpdate = gameRefs.current.currentRoundRef;
    const difficulty = getDifficultySettings(currentRoundForUpdate);
    const maxSpeed = difficulty.speed * 2;
    
    const speed = Math.sqrt(duck.vx * duck.vx + duck.vy * duck.vy);
    if (speed > maxSpeed) {
      duck.vx = (duck.vx / speed) * maxSpeed;
      duck.vy = (duck.vy / speed) * maxSpeed;
    }
  };

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log('Canvas clicked at:', clickX, clickY, 'Ducks available:', gameRefs.current.ducks.length);
    
    let hitAnyDuck = false;
    
    // Check if any duck was hit
    for (let i = gameRefs.current.ducks.length - 1; i >= 0; i--) {
      const duck = gameRefs.current.ducks[i];
      if (duck.hit) continue;
      
      const distance = Math.sqrt(
        (clickX - duck.x) * (clickX - duck.x) + 
        (clickY - duck.y) * (clickY - duck.y)
      );
      
      console.log(`Duck ${i} at (${duck.x}, ${duck.y}), distance: ${distance}, hitbox: ${duck.size / 2}`);
      
      if (distance < duck.size / 2) {
        console.log('Duck hit!', duck);
        
        // Handle armored duck hits
        if (duck.type === 'armored') {
          duck.hits--;
          console.log(`Armored duck hit! Hits remaining: ${duck.hits}`);
          
          if (duck.hits > 0) {
            // Duck is damaged but not destroyed
            showHitFeedback(clickX, clickY, 5, 'armor_hit'); // Small points for hit
            playQuackSound();
            
            // Visual feedback for armored hit (brief flash)
            duck.armorHit = true;
            setTimeout(() => {
              duck.armorHit = false;
            }, 200);
            
            hitAnyDuck = true;
            break; // Don't destroy the duck yet
          } else {
            // Duck is destroyed
            duck.hit = true;
            hitAnyDuck = true;
            
            setScore(prev => prev + duck.points);
            gameRefs.current.hitStreak++;
            gameRefs.current.maxHitStreak = Math.max(gameRefs.current.maxHitStreak, gameRefs.current.hitStreak);
            
            showHitFeedback(clickX, clickY, duck.points, duck.type);
            playQuackSound();
            
            setTimeout(() => {
              const index = gameRefs.current.ducks.indexOf(duck);
              if (index > -1) {
                gameRefs.current.ducks.splice(index, 1);
              }
            }, 500);
            
            break;
          }
        } else {
          // Normal duck hit (single hit)
          duck.hit = true;
          hitAnyDuck = true;
          
          setScore(prev => prev + duck.points);
          
          gameRefs.current.hitStreak++;
          gameRefs.current.maxHitStreak = Math.max(gameRefs.current.maxHitStreak, gameRefs.current.hitStreak);
          
          showHitFeedback(clickX, clickY, duck.points, duck.type);
          playQuackSound();
          
          setTimeout(() => {
            const index = gameRefs.current.ducks.indexOf(duck);
            if (index > -1) {
              gameRefs.current.ducks.splice(index, 1);
            }
          }, 500);
          
          break;
        }
      }
    }
    
    if (!hitAnyDuck) {
      console.log('No duck hit - showing miss indicator');
      gameRefs.current.hitStreak = 0;
      gameRefs.current.missedShots++;
      showMissIndicator(clickX, clickY);
    }
  }, [gameState]);

  // Audio functions
  const playBackgroundMusic = () => {
    try {
      const { backgroundAudio } = gameRefs.current;
      backgroundAudio.currentTime = 0;
      backgroundAudio.play().catch(e => console.log('Background music play failed:', e));
    } catch (e) {
      console.log('Background music error:', e);
    }
  };

  const stopBackgroundMusic = () => {
    try {
      const { backgroundAudio } = gameRefs.current;
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    } catch (e) {
      console.log('Background music stop error:', e);
    }
  };

  const playQuackSound = () => {
    try {
      const { quackAudio } = gameRefs.current;
      const quack = quackAudio.cloneNode();
      quack.volume = 0.6;
      quack.play().catch(e => console.log('Quack sound play failed:', e));
    } catch (e) {
      console.log('Quack sound error:', e);
    }
  };

  // Feedback functions
  const showHitFeedback = (x, y, points, type) => {
    const feedback = {
      x, y, points, type,
      life: 60,
      startLife: 60
    };
    
    if (!gameRefs.current.feedbackMessages) {
      gameRefs.current.feedbackMessages = [];
    }
    
    gameRefs.current.feedbackMessages.push(feedback);
  };

  const showMissIndicator = (x, y) => {
    const miss = {
      x, y,
      type: 'miss',
      life: 40,
      startLife: 40
    };
    
    if (!gameRefs.current.feedbackMessages) {
      gameRefs.current.feedbackMessages = [];
    }
    
    gameRefs.current.feedbackMessages.push(miss);
  };

  // Round control functions
  const endRound = () => {
    console.log(`Ending round ${currentRound}`);
    
    gameRefs.current.isGameRunning = false;
    
    // Clear ALL timers
    const refs = gameRefs.current;
    if (refs.gameTimer) {
      clearInterval(refs.gameTimer);
      refs.gameTimer = null;
    }
    if (refs.countdownTimer) {
      clearInterval(refs.countdownTimer);
      refs.countdownTimer = null;
    }
    if (refs.animationTimer) {
      clearInterval(refs.animationTimer);
      refs.animationTimer = null;
    }
    
    stopBackgroundMusic();
    
    refs.ducks = [];
    refs.feedbackMessages = [];
    refs.hitStreak = 0;
    
    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
    } else {
      setGameState('roundEnd');
    }
  };

  const startNextRound = () => {
    console.log(`Moving from round ${currentRound} to ${currentRound + 1}`);
    setCurrentRound(prev => prev + 1);
    setGameState('playing');
  };

  const endGame = async () => {
    console.log('Game ended with final score:', score);
    setGameState('gameEnd');
    
    const result = await submitScore(score);
    
    const scoreText = document.getElementById('scoreSubmissionText');
    const loginButton = document.getElementById('gameEndLoginButton');
    
    if (scoreText) {
      scoreText.textContent = result.message;
    }
    
    if (loginButton) {
      if (result.showLoginButton) {
        loginButton.classList.remove('hidden');
      } else {
        loginButton.classList.add('hidden');
      }
    }
  };

  const resetGame = () => {
    console.log('Resetting game - FULL RESET');
    
    // FIX: Reset everything completely
    gameRefs.current.isGameRunning = false;
    
    // Clear ALL timers first
    const refs = gameRefs.current;
    if (refs.gameTimer) {
      clearInterval(refs.gameTimer);
      refs.gameTimer = null;
    }
    if (refs.countdownTimer) {
      clearInterval(refs.countdownTimer);
      refs.countdownTimer = null;
    }
    if (refs.animationTimer) {
      clearInterval(refs.animationTimer);
      refs.animationTimer = null;
    }
    
    // Stop audio
    stopBackgroundMusic();
    
    // Reset ALL state and refs
    setGameState('start');
    setScore(0);
    setCurrentRound(1);
    setTimeLeft(ROUND_TIME);
    
    // Reset ref values
    refs.ducks = [];
    refs.hitStreak = 0;
    refs.maxHitStreak = 0;
    refs.missedShots = 0;
    refs.feedbackMessages = [];
    refs.animationTime = 0;
    refs.currentRoundRef = 1; // FIX: Reset the ref too
    
    // FIX: Force regenerate clouds and redraw
    setTimeout(() => {
      generateClouds();
      drawBackground();
      console.log('Game reset complete - ready for round 1');
    }, 200);
  };

  // Drawing functions
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw ducks
    if (gameRefs.current.ducks && gameRefs.current.ducks.length > 0) {
      gameRefs.current.ducks.forEach((duck, index) => {
        drawDuck(duck);
      });
    }
    
    // Draw UI overlays
    drawGameUI();
  };

  const drawBackground = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    const waterLine = canvas.height * 0.65;
    
    // FIX: Use ref value for round to avoid stale state
    const roundForBackground = gameRefs.current.currentRoundRef;
    console.log(`Drawing background for round ${roundForBackground} (state: ${currentRound})`);
    
    switch(roundForBackground) {
      case 1:
        console.log('Drawing DAYTIME background');
        drawDaytimeBackground(waterLine);
        break;
      case 2:
        console.log('Drawing SUNSET background');
        drawSunsetBackground(waterLine);
        break;
      case 3:
        console.log('Drawing NIGHT background');
        drawNightBackground(waterLine);
        break;
      default:
        console.log('Drawing DEFAULT daytime background');
        drawDaytimeBackground(waterLine);
    }
  };

  const drawDaytimeBackground = (waterLine) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, waterLine);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, waterLine);
    
    // Sun
    const sunX = canvas.width * 0.85;
    const sunY = canvas.height * 0.15;
    const sunRadius = 30;
    
    ctx.fillStyle = '#FFE55C';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds
    drawClouds('#FFFFFF', 1);
    
    // Hills
    drawHills('#228B22');
    
    // Water
    drawWater(waterLine, ['#4682B4', '#36648B', '#2F4F4F', '#1C3333']);
  };

  const drawSunsetBackground = (waterLine) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, waterLine);
    skyGradient.addColorStop(0, '#FF6B6B');
    skyGradient.addColorStop(0.3, '#FF8E53');
    skyGradient.addColorStop(0.7, '#FF6B9D');
    skyGradient.addColorStop(1, '#C44569');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, waterLine);
    
    // Sunset sun
    const sunX = canvas.width * 0.2;
    const sunY = canvas.height * 0.4;
    const sunRadius = 40;
    
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds
    drawClouds('#FFB347', 0.8);
    
    // Hills
    drawHills('#8B4513');
    
    // Water
    drawWater(waterLine, ['#FF6B6B', '#FF8E53', '#C44569', '#8B2635']);
  };

  const drawNightBackground = (waterLine) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, waterLine);
    skyGradient.addColorStop(0, '#0F0F23');
    skyGradient.addColorStop(0.5, '#1a1a2e');
    skyGradient.addColorStop(1, '#16213e');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, waterLine);
    
    // Moon
    const moonX = canvas.width * 0.8;
    const moonY = canvas.height * 0.2;
    const moonRadius = 35;
    
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Stars
    drawStars();
    
    // Clouds
    drawClouds('#2C2C54', 0.6);
    
    // Hills
    drawHills('#191919');
    
    // Water
    drawWater(waterLine, ['#2C3E50', '#1B2631', '#0F1419', '#000000']);
  };

  const drawClouds = (color, opacity) => {
    const ctx = ctxRef.current;
    if (!ctx || !gameRefs.current.clouds) return;
    
    gameRefs.current.clouds.forEach(cloud => {
      ctx.save();
      ctx.globalAlpha = cloud.opacity * opacity;
      ctx.fillStyle = color;
      
      // Cloud shape
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.3, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
      ctx.arc(cloud.x - cloud.size * 0.3, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
      ctx.arc(cloud.x, cloud.y - cloud.size * 0.2, cloud.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  };

  const drawStars = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    const stars = [
      {x: 0.1, y: 0.1}, {x: 0.3, y: 0.15}, {x: 0.5, y: 0.08},
      {x: 0.7, y: 0.12}, {x: 0.9, y: 0.18}, {x: 0.15, y: 0.25},
      {x: 0.4, y: 0.3}, {x: 0.6, y: 0.22}, {x: 0.85, y: 0.35}
    ];
    
    ctx.fillStyle = '#FFFFFF';
    stars.forEach((star, index) => {
      const x = star.x * canvas.width;
      const y = star.y * canvas.height;
      const twinkle = Math.sin(gameRefs.current.animationTime * 3 + index) * 0.3 + 0.7;
      
      ctx.save();
      ctx.globalAlpha = twinkle;
      
      // Star shape
      ctx.beginPath();
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x + 1, y - 1);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x + 1, y + 1);
      ctx.lineTo(x, y + 3);
      ctx.lineTo(x - 1, y + 1);
      ctx.lineTo(x - 3, y);
      ctx.lineTo(x - 1, y - 1);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });
  };

  const drawHills = (color) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.55);
    
    for (let x = 0; x <= canvas.width; x += 50) {
      const y = canvas.height * 0.55 + Math.sin(x * 0.01) * 20;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height * 0.65);
    ctx.lineTo(0, canvas.height * 0.65);
    ctx.closePath();
    ctx.fill();
  };

  const drawWater = (waterLine, colors) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    const waterGradient = ctx.createLinearGradient(0, waterLine, 0, canvas.height);
    waterGradient.addColorStop(0, colors[0]);
    waterGradient.addColorStop(0.3, colors[1]);
    waterGradient.addColorStop(0.7, colors[2]);
    waterGradient.addColorStop(1, colors[3]);
    
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, waterLine, canvas.width, canvas.height - waterLine);
    
    // Water ripples
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - i * 0.02})`;
      ctx.lineWidth = 1 + i * 0.5;
      ctx.beginPath();
      
      const y = waterLine + 20 + i * 25;
      for (let x = 0; x < canvas.width; x += 10) {
        const waveHeight = 3 + i;
        const yPos = y + Math.sin(x * 0.02 + gameRefs.current.animationTime * 2 + i * 0.5) * waveHeight;
        if (x === 0) {
          ctx.moveTo(x, yPos);
        } else {
          ctx.lineTo(x, yPos);
        }
      }
      ctx.stroke();
    }
  };

  const drawDuck = (duck) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.save();
    ctx.translate(duck.x, duck.y);
    ctx.rotate(duck.rotation);
    
    if (duck.hit) {
      ctx.globalAlpha = 0.5;
    }
    
    // Flash effect for armored duck when hit
    if (duck.armorHit) {
      ctx.globalAlpha = 0.7;
      // Add red tint for armor hit
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(-duck.size/2, -duck.size/2, duck.size, duck.size);
    }
    
    // Draw special effects
    if (duck.type === 'golden') {
      drawGoldenDuckRadiance(duck);
    } else if (duck.type === 'armored') {
      drawArmoredDuckShield(duck);
    }
    
    // Use loaded image if available
    if (gameRefs.current.imageLoaded && gameRefs.current.duckImage.complete) {
      ctx.drawImage(gameRefs.current.duckImage, -duck.size/2, -duck.size/2, duck.size, duck.size);
    } else {
      // Fallback: simple duck shape
      drawSimpleDuck(duck);
    }
    
    // Draw armor indicator for armored ducks
    if (duck.type === 'armored' && duck.hits > 0) {
      drawArmorIndicator(duck);
    }
    
    ctx.restore();
  };

  const drawArmoredDuckShield = (duck) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.save();
    
    const pulseIntensity = Math.sin(gameRefs.current.animationTime * 4) * 0.2 + 0.8;
    const shieldRadius = duck.size * 0.6 * pulseIntensity;
    
    // Shield glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldRadius);
    gradient.addColorStop(0, 'rgba(135, 206, 250, 0.1)'); // Light blue
    gradient.addColorStop(0.7, 'rgba(70, 130, 180, 0.3)'); // Steel blue
    gradient.addColorStop(1, 'rgba(70, 130, 180, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Shield outline
    ctx.strokeStyle = `rgba(135, 206, 250, ${0.5 * pulseIntensity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, duck.size * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawArmorIndicator = (duck) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Draw armor pips (remaining hits)
    const pipSize = 3;
    const pipSpacing = 8;
    const totalWidth = (duck.maxHits - 1) * pipSpacing;
    const startX = -totalWidth / 2;
    const y = -duck.size * 0.4; // Above the duck
    
    for (let i = 0; i < duck.maxHits; i++) {
      const x = startX + i * pipSpacing;
      
      if (i < duck.hits) {
        // Active armor pip
        ctx.fillStyle = '#87CEEB'; // Light blue
        ctx.strokeStyle = '#4682B4'; // Steel blue
      } else {
        // Depleted armor pip
        ctx.fillStyle = '#696969'; // Dim gray
        ctx.strokeStyle = '#2F4F4F'; // Dark gray
      }
      
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, pipSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawSimpleDuck = (duck) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    let bodyColor, beakColor;
    
    switch(duck.type) {
      case 'golden':
        bodyColor = '#FFD700';
        beakColor = '#FF8C00';
        break;
      case 'tiny':
        bodyColor = '#87CEEB';
        beakColor = '#4682B4';
        break;
      case 'armored':
        bodyColor = '#708090'; // Steel gray
        beakColor = '#2F4F4F'; // Dark slate gray
        break;
      default:
        bodyColor = '#FFD700';
        beakColor = '#FF8C00';
    }
    
    // Duck body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, duck.size * 0.3, duck.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Duck head
    ctx.beginPath();
    ctx.ellipse(duck.size * 0.15, -duck.size * 0.1, duck.size * 0.15, duck.size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Duck beak
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.ellipse(duck.size * 0.25, -duck.size * 0.1, duck.size * 0.08, duck.size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Duck eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(duck.size * 0.18, -duck.size * 0.15, duck.size * 0.03, duck.size * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawGoldenDuckRadiance = (duck) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.save();
    
    const pulseIntensity = Math.sin(gameRefs.current.animationTime * 6) * 0.3 + 0.7;
    const glowRadius = duck.size * 0.6 * pulseIntensity;
    
    // Outer glow
    for (let i = 3; i >= 1; i--) {
      const radius = glowRadius * i * 0.4;
      const alpha = (0.15 / i) * pulseIntensity;
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Sparkle effects
    for (let i = 0; i < 6; i++) {
      const angle = (gameRefs.current.animationTime * 2 + i * Math.PI / 3) % (Math.PI * 2);
      const distance = duck.size * 0.5;
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      const sparkleAlpha = Math.sin(gameRefs.current.animationTime * 4 + i) * 0.5 + 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawGameUI = () => {
    // Draw hit streak counter
    if (gameRefs.current.hitStreak >= 3) {
      drawHitStreakCounter();
    }
    
    // Draw feedback messages
    drawActiveFeedback();
  };

  const drawHitStreakCounter = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    const x = 80;
    const y = 50;
    const animationPulse = Math.sin(gameRefs.current.animationTime * 4) * 0.1 + 1;
    
    ctx.save();
    
    // Background
    const bgGradient = ctx.createLinearGradient(x - 50, y - 15, x + 50, y + 15);
    if (gameRefs.current.hitStreak >= 5) {
      bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
      bgGradient.addColorStop(1, 'rgba(255, 165, 0, 0.9)');
    } else {
      bgGradient.addColorStop(0, 'rgba(76, 175, 80, 0.9)');
      bgGradient.addColorStop(1, 'rgba(56, 142, 60, 0.9)');
    }
    
    ctx.scale(animationPulse, animationPulse);
    ctx.fillStyle = bgGradient;
    ctx.fillRect((x - 45) / animationPulse, (y - 12) / animationPulse, 90, 24);
    
    ctx.restore();
    
    // Text
    const streakText = gameRefs.current.hitStreak >= 5 ? 
      `AMAZING ${gameRefs.current.hitStreak} HITS` : 
      `GREAT ${gameRefs.current.hitStreak} HITS`;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(streakText, x + 1, y + 4);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(streakText, x, y + 3);
  };

  const drawActiveFeedback = () => {
    const ctx = ctxRef.current;
    if (!ctx || !gameRefs.current.feedbackMessages) return;
    
    for (let i = gameRefs.current.feedbackMessages.length - 1; i >= 0; i--) {
      const feedback = gameRefs.current.feedbackMessages[i];
      const alpha = feedback.life / feedback.startLife;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (feedback.type === 'miss') {
        // Red X for miss
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(feedback.x - 15, feedback.y - 15);
        ctx.lineTo(feedback.x + 15, feedback.y + 15);
        ctx.moveTo(feedback.x + 15, feedback.y - 15);
        ctx.lineTo(feedback.x - 15, feedback.y + 15);
        ctx.stroke();
      } else {
        // Points text for hits
        let color = '#00FF00';
        let text = `+${feedback.points}`;
        
        if (feedback.type === 'golden') {
          color = '#FFD700';
          text = `+${feedback.points} GOLD!`;
        } else if (feedback.type === 'tiny') {
          color = '#87CEEB';
          text = `+${feedback.points} TINY!`;
        } else if (feedback.type === 'armored') {
          color = '#708090';
          text = `+${feedback.points} ARMOR!`;
        } else if (feedback.type === 'armor_hit') {
          color = '#87CEEB';
          text = `+${feedback.points} HIT!`;
        }
        
        ctx.fillStyle = color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, feedback.x, feedback.y - feedback.startLife + feedback.life);
      }
      
      ctx.restore();
    }
  };

  // Update UI elements
  useEffect(() => {
    const scoreElement = document.getElementById('score');
    const roundElement = document.getElementById('round');
    const timerElement = document.getElementById('timer');
    
    if (scoreElement) scoreElement.textContent = score;
    if (roundElement) roundElement.textContent = currentRound;
    if (timerElement) timerElement.textContent = timeLeft;
  }, [score, currentRound, timeLeft]);

  // FIX: Force background redraw when round changes
  useEffect(() => {
    console.log('Round changed to:', currentRound, '- redrawing background');
    if (canvasRef.current && ctxRef.current) {
      drawBackground();
    }
  }, [currentRound]);

  return (
    <div className="game-area">
      {/* Temporary Debug Panel */}
      <DebugPanel gameRefs={gameRefs} gameState={gameState} currentRound={currentRound} />
      
      <canvas 
        ref={canvasRef}
        id="gameCanvas"
        onClick={handleCanvasClick}
        style={{ cursor: gameState === 'playing' ? 'crosshair' : 'default' }}
      />
      
      {/* Game UI Overlays */}
      {gameState === 'start' && (
        <div id="startScreen" className="game-overlay">
          <div className="overlay-content">
            <h2>Ready to Hunt?</h2>
            <p>Click the ducks to score points!</p>
            <p>3 rounds â€¢ 30 seconds each</p>
            <button onClick={startGame} className="game-button">
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'roundEnd' && (
        <div id="roundEndScreen" className="game-overlay">
          <div className="overlay-content">
            <h2>Round {currentRound} Complete!</h2>
            <p>Score: {score} points. Get ready for round {currentRound + 1}!</p>
            <button onClick={startNextRound} className="game-button">
              Next Round
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameEnd' && (
        <div id="gameEndScreen" className="game-overlay">
          <div className="overlay-content">
            <h2>Game Complete!</h2>
            <p>Final Score: <span id="finalScore">{score}</span></p>
            <div id="authPrompt" className="auth-prompt">
              <p id="scoreSubmissionText">ðŸ† Score submitted to Monad Games leaderboard!</p>
              <button 
                id="gameEndLoginButton" 
                onClick={onLoginRequest}
                className="auth-button hidden"
              >
                Sign in with Monad Games ID
              </button>
            </div>
            <button onClick={resetGame} className="game-button">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;