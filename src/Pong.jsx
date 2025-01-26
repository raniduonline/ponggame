import React, { useEffect, useRef, useState } from 'react';

const Scoreboard = ({ score }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: '50px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '15px',
    margin: '20px 0'
  }}>
    <div style={{ color: '#ffff00' }}>
      <h3>Player: {score.player}</h3>
    </div>
    <div style={{ color: '#ff69b4' }}>
      <h3>AI: {score.ai}</h3>
    </div>
  </div>
);

const Leaderboard = ({ scores }) => (
  <div style={{
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '15px',
    border: '2px solid yellow',
    maxHeight: '400px',
    overflowY: 'auto'
  }}>
    <h2 style={{ 
      color: '#ffff00',
      textShadow: '0 0 10px rgba(255, 255, 0, 0.5)',
      marginBottom: '20px'
    }}>
      🏆 Match History 🏆
    </h2>
    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid yellow' }}>
          <th style={{ padding: '8px' }}>Date</th>
          <th style={{ padding: '8px' }}>Player</th>
          <th style={{ padding: '8px' }}>Score</th>
          <th style={{ padding: '8px' }}>Result</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score, index) => (
          <tr key={index} style={{ 
            borderBottom: '1px solid rgba(255, 255, 0, 0.2)',
            backgroundColor: score.won ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'
          }}>
            <td style={{ padding: '8px', textAlign: 'center' }}>{new Date(score.timestamp).toLocaleString()}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>{score.playerName}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>{score.playerScore} - {score.aiScore}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {score.won ? '🏆 Won' : '💔 Lost'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PlayerStats = ({ players }) => (
  <div style={{
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '15px',
    border: '2px solid yellow',
    marginBottom: '20px'
  }}>
    <h2 style={{ 
      color: '#ffff00',
      textShadow: '0 0 10px rgba(255, 255, 0, 0.5)',
      marginBottom: '20px'
    }}>
      👑 Player Rankings 👑
    </h2>
    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid yellow' }}>
          <th style={{ padding: '8px' }}>Rank</th>
          <th style={{ padding: '8px' }}>Player</th>
          <th style={{ padding: '8px' }}>Games</th>
          <th style={{ padding: '8px' }}>Wins</th>
          <th style={{ padding: '8px' }}>Win Rate</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => (
          <tr key={player.name} style={{ 
            borderBottom: '1px solid rgba(255, 255, 0, 0.2)',
            backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
          }}>
            <td style={{ padding: '8px', textAlign: 'center' }}>#{index + 1}</td>
            <td style={{ padding: '8px' }}>{player.name}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>{player.games}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>{player.wins}</td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {(player.winRate * 100).toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pong = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  
  // Use refs for positions to avoid state updates causing re-renders
  const paddleYRef = useRef(150);
  const aiPaddleYRef = useRef(150);
  const ballRef = useRef({ 
    x: 300, 
    y: 200, 
    dx: 6, 
    dy: 6
  });
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const BALL_BASE_SPEED = 5;  // Base speed constant
  const MAX_BALL_SPEED = 7;   // Maximum speed limit
  
  const normalizeSpeed = (dx, dy, targetSpeed) => {
    const currentSpeed = Math.sqrt(dx * dx + dy * dy);
    const scale = targetSpeed / currentSpeed;
    return {
      dx: dx * scale,
      dy: dy * scale
    };
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw initial paddles
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(50, paddleYRef.current, 10, 80);
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(canvas.width - 60, aiPaddleYRef.current, 10, 80);

    // Draw ghost
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👻', ballRef.current.x, ballRef.current.y);
  };

  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
  }, []);

  // Mouse/Touch movement handler
  useEffect(() => {
    if (!isGameRunning) return;

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      paddleYRef.current = Math.min(
        Math.max(0, mouseY - 40),
        canvas.height - 80
      );
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchY = touch.clientY - rect.top;
      paddleYRef.current = Math.min(
        Math.max(0, touchY - 40),
        canvas.height - 80
      );
    };

    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isGameRunning]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isGameRunning) return;
      
      const speed = 20;
      if (e.key === 'ArrowUp') {
        paddleYRef.current = Math.max(0, paddleYRef.current - speed);
      }
      if (e.key === 'ArrowDown') {
        paddleYRef.current = Math.min(canvasRef.current.height - 80, paddleYRef.current + speed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning]);

  const animate = time => {
    if (!previousTimeRef.current) previousTimeRef.current = time;
    const deltaTime = (time - previousTimeRef.current) / 16.67; // Normalize to 60fps
    previousTimeRef.current = time;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const PADDLE_OFFSET = 15;

    // Draw paddles
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(PADDLE_OFFSET, paddleYRef.current, 10, 80);
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(canvas.width - PADDLE_OFFSET - 10, aiPaddleYRef.current, 10, 80);

    // Update ball position with consistent speed
    const ball = ballRef.current;
    ball.x += ball.dx * deltaTime;
    ball.y += ball.dy * deltaTime;

    // Update AI paddle with more human-like behavior
    const aiTarget = ball.y - 40;
    const aiSpeed = 4 * deltaTime; // Reduced speed
    
    // Add prediction error
    const predictionError = 30 * Math.sin(time / 1000); // Oscillating error
    const targetWithError = aiTarget + predictionError;
    
    // Add reaction delay and mistakes
    if (ball.dx > 0) { // Only move when ball is coming towards AI
      // Add random hesitation
      if (Math.random() > 0.1) { // 10% chance to hesitate
        // Add maximum movement range to prevent perfect tracking
        const maxMovement = aiSpeed * 0.8; // Limit maximum movement per frame
        
        if (aiPaddleYRef.current < targetWithError - 10) {
          aiPaddleYRef.current = Math.min(
            aiPaddleYRef.current + maxMovement,
            canvas.height - 80
          );
        } else if (aiPaddleYRef.current > targetWithError + 10) {
          aiPaddleYRef.current = Math.max(
            aiPaddleYRef.current - maxMovement,
            0
          );
        }
      }
    } else {
      // Return to center when ball is moving away
      const centerY = canvas.height / 2 - 40;
      if (Math.abs(aiPaddleYRef.current - centerY) > 50) {
        if (aiPaddleYRef.current > centerY) {
          aiPaddleYRef.current -= aiSpeed * 0.3;
        } else {
          aiPaddleYRef.current += aiSpeed * 0.3;
        }
      }
    }

    // Paddle collisions with normalized speed
    if (ball.x <= PADDLE_OFFSET + 20) {
      if (ball.y > paddleYRef.current && ball.y < paddleYRef.current + 80) {
        ball.x = PADDLE_OFFSET + 20;
        
        // Calculate new direction based on hit position
        const relativeIntersectY = (paddleYRef.current + 40) - ball.y;
        const normalizedIntersect = relativeIntersectY / 40;
        
        // Calculate new velocity
        let newDx = BALL_BASE_SPEED;
        let newDy = -normalizedIntersect * 5;
        
        // Normalize to maintain consistent speed
        const normalized = normalizeSpeed(newDx, newDy, BALL_BASE_SPEED);
        ball.dx = normalized.dx;
        ball.dy = normalized.dy;
        
        // Small speed increase on hit
        const speedIncrease = 1.05;
        ball.dx *= speedIncrease;
        ball.dy *= speedIncrease;
        
        // Ensure speed doesn't exceed maximum
        const finalSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (finalSpeed > MAX_BALL_SPEED) {
          const normalized = normalizeSpeed(ball.dx, ball.dy, MAX_BALL_SPEED);
          ball.dx = normalized.dx;
          ball.dy = normalized.dy;
        }
      } else if (ball.x < 0) {
        setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
        resetBall();
      }
    }

    if (ball.x >= canvas.width - PADDLE_OFFSET - 20) {
      if (ball.y > aiPaddleYRef.current && ball.y < aiPaddleYRef.current + 80) {
        ball.x = canvas.width - PADDLE_OFFSET - 20;
        
        // Calculate new direction based on hit position
        const relativeIntersectY = (aiPaddleYRef.current + 40) - ball.y;
        const normalizedIntersect = relativeIntersectY / 40;
        
        // Calculate new velocity
        let newDx = -BALL_BASE_SPEED;
        let newDy = -normalizedIntersect * 5;
        
        // Normalize to maintain consistent speed
        const normalized = normalizeSpeed(newDx, newDy, BALL_BASE_SPEED);
        ball.dx = normalized.dx;
        ball.dy = normalized.dy;
        
        // Small speed increase on hit
        const speedIncrease = 1.05;
        ball.dx *= speedIncrease;
        ball.dy *= speedIncrease;
        
        // Ensure speed doesn't exceed maximum
        const finalSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (finalSpeed > MAX_BALL_SPEED) {
          const normalized = normalizeSpeed(ball.dx, ball.dy, MAX_BALL_SPEED);
          ball.dx = normalized.dx;
          ball.dy = normalized.dy;
        }
      } else if (ball.x > canvas.width) {
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
        resetBall();
      }
    }

    // Wall collisions with speed preservation
    if (ball.y <= 12 || ball.y >= canvas.height - 12) {
      ball.dy = -ball.dy;
      ball.y = ball.y <= 12 ? 12 : canvas.height - 12;
      
      // Ensure speed remains consistent after bounce
      const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      const normalized = normalizeSpeed(ball.dx, ball.dy, currentSpeed);
      ball.dx = normalized.dx;
      ball.dy = normalized.dy;
    }

    // Simplified ghost drawing with subtle transparency
    ctx.font = '28px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Single subtle trail
    ctx.globalAlpha = 0.2;
    ctx.fillText('👻', ball.x - ball.dx/2, ball.y - ball.dy/2);
    
    // Main ghost
    ctx.globalAlpha = 1;
    ctx.fillText('👻', ball.x, ball.y);

    requestRef.current = requestAnimationFrame(animate);
  };

  const resetBall = () => {
    // Reset with consistent initial speed
    const angle = (Math.random() * 0.5 + 0.25) * Math.PI;
    const dx = BALL_BASE_SPEED * Math.cos(angle);
    const dy = BALL_BASE_SPEED * Math.sin(angle);
    
    ballRef.current = {
      x: canvasRef.current.width / 2,
      y: canvasRef.current.height / 2,
      dx: dx * (Math.random() < 0.5 ? 1 : -1),
      dy: dy
    };
  };

  useEffect(() => {
    if (isGameRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = undefined;
    };
  }, [isGameRunning]);

  const WINNING_SCORE = 10;
  const [gameStartTime, setGameStartTime] = useState(null);

  const handleStartGame = () => {
    if (isGameRunning) {
      // Don't allow stopping mid-game
      return;
    }

    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    // Reset game state
    paddleYRef.current = 150;
    aiPaddleYRef.current = 150;
    setScore({ player: 0, ai: 0 });
    setGameStartTime(Date.now());
    setIsGameRunning(true);
  };

  const updatePlayerStats = (playerName, won) => {
    setPlayerStats(prevStats => {
      const existingPlayer = prevStats.find(p => p.name === playerName);
      let newStats;

      if (existingPlayer) {
        newStats = prevStats.map(p => {
          if (p.name === playerName) {
            const newGames = p.games + 1;
            const newWins = p.wins + (won ? 1 : 0);
            return {
              ...p,
              games: newGames,
              wins: newWins,
              winRate: newWins / newGames
            };
          }
          return p;
        });
      } else {
        newStats = [...prevStats, {
          name: playerName,
          games: 1,
          wins: won ? 1 : 0,
          winRate: won ? 1 : 0
        }];
      }

      // Sort by win rate and games played
      newStats.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.games - a.games;
      });

      localStorage.setItem('pongPlayerStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  const saveScore = () => {
    const gameResult = {
      playerName,
      playerScore: score.player,
      aiScore: score.ai,
      timestamp: Date.now(),
      won: score.player >= WINNING_SCORE,
      duration: Date.now() - gameStartTime
    };

    const newScores = [gameResult, ...highScores].slice(0, 100);
    setHighScores(newScores);
    localStorage.setItem('pongScores', JSON.stringify(newScores));
    
    // Update player statistics
    updatePlayerStats(playerName, score.player >= WINNING_SCORE);
  };

  useEffect(() => {
    // Load scores and stats from localStorage on mount
    const savedScores = localStorage.getItem('pongScores');
    const savedStats = localStorage.getItem('pongPlayerStats');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    }
  }, []);

  useEffect(() => {
    // Check for game end condition
    if (isGameRunning && (score.player >= WINNING_SCORE || score.ai >= WINNING_SCORE)) {
      saveScore();
      setIsGameRunning(false);
      
      // Show game result modal
      const winner = score.player >= WINNING_SCORE ? 'You' : 'AI';
      const finalScore = `${score.player} - ${score.ai}`;
      setTimeout(() => {
        alert(`Game Over! ${winner} won! Final Score: ${finalScore}`);
      }, 100);
    }
  }, [score, isGameRunning]);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ 
        fontSize: "4rem",
        color: "#ffffff",
        textShadow: `
          0 0 7px #fff,
          0 0 10px #fff,
          0 0 21px #fff,
          0 0 42px yellow,
          0 0 82px yellow,
          0 0 92px yellow
        `,
        fontWeight: "bold",
        letterSpacing: "4px",
        marginBottom: "30px",
        fontFamily: "'Press Start 2P', system-ui"
      }}>
        👻 GHOST PONG 👻
      </h1>

      <Scoreboard score={score} />
      
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '15px',
        border: '2px solid yellow',
        boxShadow: `
          0 0 5px yellow,
          0 0 15px yellow,
          inset 0 0 5px yellow
        `
      }}>
        {!isGameRunning && (
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              padding: '10px 20px',
              marginRight: '15px',
              borderRadius: '25px',
              border: '2px solid yellow',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              fontSize: '16px',
              boxShadow: '0 0 10px yellow',
              outline: 'none'
            }}
          />
        )}
        <button
          onClick={handleStartGame}
          disabled={isGameRunning}
          style={{
            padding: '10px 30px',
            backgroundColor: isGameRunning ? '#666' : '#ffff00',
            color: isGameRunning ? '#999' : 'black',
            border: 'none',
            borderRadius: '25px',
            cursor: isGameRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: isGameRunning 
              ? 'none'
              : '0 0 10px yellow, 0 0 20px yellow',
            transition: 'all 0.3s ease',
            opacity: isGameRunning ? 0.5 : 1
          }}
        >
          {isGameRunning ? 'Game in Progress' : 'Start Game'}
        </button>
      </div>

      {/* Score display with "First to 10" reminder */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ffff00',
        textShadow: '0 0 10px rgba(255, 255, 0, 0.5)',
        textAlign: 'center'
      }}>
        {score.player} - {score.ai}
        <div style={{ 
          fontSize: '14px', 
          marginTop: '5px',
          color: isGameRunning ? '#ffff00' : 'transparent'
        }}>
          First to {WINNING_SCORE} wins!
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: '3px solid yellow',
          borderRadius: '10px',
          background: 'black',
          boxShadow: '0 0 20px yellow',
          cursor: isGameRunning ? 'none' : 'default'
        }}
      />
      
      <div style={{ 
        marginTop: '20px',
        color: '#ffff00',
        textShadow: '0 0 5px rgba(255, 255, 0, 0.5)',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Use mouse or ↑↓ arrow keys to move your paddle
      </div>

      <PlayerStats players={playerStats} />
      <Leaderboard scores={highScores} />
    </div>
  );
};

export default Pong; 