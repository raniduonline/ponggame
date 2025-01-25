import React, { useRef, useEffect, useState } from "react";

const Scoreboard = ({ score }) => (
  <div className="scoreboard" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '30px',
    padding: '20px 40px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '15px',
    margin: '20px 0',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
    border: '3px solid yellow'
  }}>
    <div className="score-container player" style={{
      textAlign: 'center',
      padding: '10px 30px',
      background: 'rgba(255, 255, 0, 0.1)',
      borderRadius: '10px'
    }}>
      <h2 style={{ 
        color: "#ffff00",
        margin: '0 0 10px 0',
        textShadow: '0 0 10px rgba(255, 255, 0, 0.5)'
      }}>Player</h2>
      <div className="score" style={{ 
        color: "#ffff00",
        fontSize: '2.5em',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(255, 255, 0, 0.5)'
      }}>{score.player}</div>
    </div>
    
    <div style={{
      width: '100px',
      height: '100px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '50px'
    }}>
      👻
    </div>
    
    <div className="score-container ai" style={{
      textAlign: 'center',
      padding: '10px 30px',
      background: 'rgba(255, 105, 180, 0.1)',
      borderRadius: '10px'
    }}>
      <h2 style={{ 
        color: "#ff69b4",
        margin: '0 0 10px 0',
        textShadow: '0 0 10px rgba(255, 105, 180, 0.5)'
      }}>AI</h2>
      <div className="score" style={{ 
        color: "#ff69b4",
        fontSize: '2.5em',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(255, 105, 180, 0.5)'
      }}>{score.ai}</div>
    </div>
  </div>
);

const Leaderboard = ({ scores }) => (
  <div style={{
    border: '3px solid yellow',
    borderRadius: '15px',
    padding: '20px',
    margin: '20px auto',
    maxWidth: '500px',
    background: 'rgba(0, 0, 0, 0.7)',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
  }}>
    <h2 style={{
      color: '#ffffff',
      textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
      marginBottom: '20px'
    }}>🏆 High Scores 🏆</h2>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {scores.map((score, index) => (
        <div key={index} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          background: index === 0 ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          color: index === 0 ? '#ffff00' : '#ffffff'
        }}>
          <span>{score.name || 'Anonymous'}</span>
          <span>{score.score} points</span>
        </div>
      ))}
    </div>
  </div>
);

const Pong = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Add sound effects
  const paddleHitSound = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
  const scoreSound = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');

  // Oscillator function for sound effects
  const playSound = (frequency, duration) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, duration);
  };

  // Load high scores from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem('pongHighScores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  }, []);

  // Save score to leaderboard when game ends
  const saveScore = () => {
    const newScore = {
      name: playerName || 'Anonymous',
      score: score.player
    };
    
    const newHighScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep only top 10 scores
    
    setHighScores(newHighScores);
    localStorage.setItem('pongHighScores', JSON.stringify(newHighScores));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    // Make canvas responsive
    const updateCanvasSize = () => {
      const containerWidth = Math.min(window.innerWidth - 20, 800);
      const aspectRatio = 2; // width/height ratio
      canvas.width = containerWidth;
      canvas.height = containerWidth / aspectRatio;
    };

    // Initial size setup
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Game settings
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballSize = 20;
    const playerX = 10;
    const aiX = canvas.width - paddleWidth - 10;
    const paddleSpeed = 5;
    const aiPaddleSpeed = 3; // Slower than before
    const aiReactionDelay = 0.3; // More delay
    let aiTargetY = canvas.height / 2 - paddleHeight / 2;

    // Player and ball state
    let playerY = canvas.height / 2 - paddleHeight / 2;
    let aiY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2 - ballSize / 2;
    let ballY = canvas.height / 2 - ballSize / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 4;

    // Add ghost drawing function
    const drawGhost = (x, y, size) => {
      ctx.save();
      ctx.fillStyle = "#FFFF00"; // Snapchat yellow
      
      // Main ghost body
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, Math.PI, 0, false);
      ctx.lineTo(x + size, y + size);
      
      // Ghost feet
      const feetWidth = size/3;
      for(let i = 0; i < 3; i++) {
        ctx.lineTo(x + size - (i * feetWidth), y + size);
        ctx.arc(x + size - (i * feetWidth) - feetWidth/2, y + size,
                feetWidth/2, 0, Math.PI, true);
      }
      
      ctx.lineTo(x, y + size/2);
      ctx.fill();
      
      // Ghost eyes
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(x + size/3, y + size/2, size/8, 0, Math.PI * 2);
      ctx.arc(x + (size/3 * 2), y + size/2, size/8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const resetBall = () => {
      ballX = canvas.width / 2 - ballSize / 2;
      ballY = canvas.height / 2 - ballSize / 2;
      ballSpeedX = 4 * (Math.random() < 0.5 ? 1 : -1);
      ballSpeedY = 4 * (Math.random() < 0.5 ? 1 : -1);
      playSound(220, 100);
    };

    const gameLoop = () => {
      if (!isGameRunning) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      ctx.fillStyle = "#ffff00";  // Yellow paddle
      ctx.fillRect(playerX, playerY, paddleWidth, paddleHeight);
      
      ctx.fillStyle = "#ff69b4";  // Pink paddle
      ctx.fillRect(aiX, aiY, paddleWidth, paddleHeight);

      // Draw ghost instead of ball
      drawGhost(ballX - ballSize/2, ballY - ballSize/2, ballSize * 2);

      // Ball movement
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Ball collision with top and bottom
      if (ballY <= 0 || ballY + ballSize >= canvas.height) {
        ballSpeedY *= -1;
        playSound(300, 50); // Play bounce sound
      }

      // Ball collision with paddles
      if (
        (ballX <= playerX + paddleWidth &&
          ballY + ballSize >= playerY &&
          ballY <= playerY + paddleHeight) ||
        (ballX + ballSize >= aiX &&
          ballY + ballSize >= aiY &&
          ballY <= aiY + paddleHeight)
      ) {
        ballSpeedX *= -1;
        playSound(400, 50); // Play paddle hit sound
      }

      // Ball out of bounds
      if (ballX <= 0) {
        setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
        resetBall();
      } else if (ballX + ballSize >= canvas.width) {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }));
        resetBall();
      }

      // Modified AI paddle movement with more randomness and mistakes
      const aiMakesMistake = Math.random() < 0.2; // 20% chance to make a mistake
      
      if (!aiMakesMistake) {
        // Add random offset to make AI less perfect
        const randomOffset = (Math.random() - 0.5) * 50;
        aiTargetY = ballY - paddleHeight / 2 + randomOffset;
        
        // Add reaction delay and sometimes move in wrong direction
        const distanceToTarget = aiTargetY - aiY;
        
        // Occasionally move in wrong direction
        const moveWrongDirection = Math.random() < 0.1;
        const direction = moveWrongDirection ? -1 : 1;
        
        // Move AI paddle with limited speed
        if (Math.abs(distanceToTarget) > aiPaddleSpeed) {
          if (distanceToTarget > 0) {
            aiY += aiPaddleSpeed * direction;
          } else {
            aiY -= aiPaddleSpeed * direction;
          }
        }
      }

      // Keep AI paddle within bounds
      aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));

      // Score text in yellow
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Player: ${score.player}`, 20, 30);
      ctx.fillText(`AI: ${score.ai}`, canvas.width - 100, 30);

      animationId = requestAnimationFrame(gameLoop);
    };

    // Handle both mouse and touch movement
    const handleMovement = (e) => {
      if (!isGameRunning) return;
      const rect = canvas.getBoundingClientRect();
      const clientY = e.type.includes('touch') 
        ? e.touches[0].clientY 
        : e.clientY;
      playerY = clientY - rect.top - paddleHeight / 2;
      
      // Constrain paddle position
      if (playerY < 0) playerY = 0;
      if (playerY + paddleHeight > canvas.height)
        playerY = canvas.height - paddleHeight;
    };

    // Add touch event listeners
    canvas.addEventListener("mousemove", handleMovement);
    canvas.addEventListener("touchmove", handleMovement);
    canvas.addEventListener("touchstart", handleMovement);

    // Prevent scrolling while touching the canvas
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Start the game loop
    animationId = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handleMovement);
      canvas.removeEventListener("touchmove", handleMovement);
      canvas.removeEventListener("touchstart", handleMovement);
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [isGameRunning, score.player, score.ai]);

  const handleStartReset = () => {
    if (isGameRunning) {
      // Save score when resetting during game
      saveScore();
    }
    setIsGameRunning(!isGameRunning);
    setScore({ player: 0, ai: 0 });
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div style={{ 
      textAlign: "center",
      padding: "10px",
      maxWidth: "100vw",
      overflow: "hidden"
    }}>
      <h1 style={{ 
        fontSize: "calc(2rem + 2vw)",
        color: "#ffffff",
        textShadow: "0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 0, 0.4)",
        fontWeight: "bold",
        letterSpacing: "4px",
        marginBottom: "30px"
      }}>👻 GHOST PONG 👻</h1>
      
      <Scoreboard score={score} />
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {!isGameRunning && (
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            style={{
              padding: '10px',
              borderRadius: '25px',
              border: '2px solid yellow',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              textAlign: 'center',
              fontSize: '16px',
              width: '200px'
            }}
          />
        )}
        
        <button 
          onClick={() => {
            if (!isGameRunning && !playerName.trim()) {
              alert('Please enter your name before starting the game!');
              return;
            }
            handleStartReset();
          }}
          style={{
            padding: "10px 20px",
            fontSize: "calc(0.8rem + 1vw)",
            backgroundColor: isGameRunning ? "#ff69b4" : "#ffff00",
            color: isGameRunning ? "white" : "black",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(255,255,255,0.3)",
            transition: "all 0.3s ease"
          }}
        >
          {isGameRunning ? "End Game" : "Start Game"}
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        style={{
          border: "3px solid yellow",
          background: "rgba(0,0,0,0.8)",
          display: "block",
          margin: "0 auto",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(255,255,255,0.3)",
          maxWidth: "100%",
          touchAction: "none"
        }}
      />
      
      <Leaderboard scores={highScores} />
    </div>
  );
};

export default Pong;