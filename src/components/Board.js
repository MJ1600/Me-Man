import React, { useState, useEffect, useRef } from "react";
import Cell from "./Cell";
import { supabase } from "../supabaseClient";

const width = 15;
const victorySound = new Audio("/victory.mp3");
const deathSound = new Audio("/death.mp3");

const levels = [
  // LEVEL 1
  {
    layout: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,3,0,0,0,0,0,0,0,0,0,0,0,3,1,
      1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ],
    colors: { wall:'#001d3d', wallShadow:'#00b4ff', dot:'white', power:'yellow' }
  },
  // LEVEL 2
  {
    layout: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,0,3,0,1,0,0,0,0,0,1,0,3,0,1,
      1,0,1,0,1,1,0,1,1,0,1,1,0,0,1,
      1,3,0,0,0,0,0,0,0,0,0,0,0,3,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ],
    colors: { wall:'#2b1b17', wallShadow:'#ff4500', dot:'#00ffff', power:'#ff69b4' }
  },
  // LEVEL 3
  {
    layout: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,3,0,1,0,0,0,1,0,0,0,1,0,3,1,
      1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,
      1,0,0,0,0,3,0,0,0,3,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ],
    colors: { wall:'#003300', wallShadow:'#00ff00', dot:'#ffff00', power:'#ff00ff' }
  },
  // LEVEL 4 – THE FINALE
  {
    layout: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,3,0,0,1,0,1,0,1,0,0,0,3,0,1,
      1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
      1,0,0,0,0,3,0,0,0,3,0,0,0,0,1,
      1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
      1,3,0,0,1,0,0,0,0,0,1,0,0,3,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ],
    colors: { 
      wall:'#14001f', 
      wallShadow:'#ff00ff', 
      dot:'#ffffff', 
      power:'#ff0000' 
    }
  }
];

function Board() {
  const startSoundRef = useRef(null);
const eatSoundRef = useRef(null);
const chompSoundRef = useRef(null);
  const [playerName, setPlayerName] = useState("");
const [leaderboard, setLeaderboard] = useState([]);
const [showLeaderboard, setShowLeaderboard] = useState(false);
  const overlayRef = useRef(null);

  const [currentLevel, setCurrentLevel] = useState(0);
  const [cells, setCells] = useState(levels[0].layout);
  const [pacmanIndex, setPacmanIndex] = useState(width + 1);
  const [ghostIndex, setGhostIndex] = useState(width*2+7);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isFrightened, setIsFrightened] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelStarting, setLevelStarting] = useState(true);
  const [showFinalScore, setShowFinalScore] = useState(false);

  const [floatingScores, setFloatingScores] = useState([]);
  const [lifeLostMessages, setLifeLostMessages] = useState([]);

  const pacmanStart = width + 1;
  const ghostStart = width*2+7;

  // --- Floating Score ---
  const showFloatingScore = (value, index) => {
    const id = Date.now();
    setFloatingScores(fs => [...fs, { id, value, index }]);
    setTimeout(() => setFloatingScores(fs => fs.filter(f => f.id !== id)), 1000);
  };

  // --- Life Lost Popup ---
  const showLifeLost = (index) => {
    const id = Date.now();
    setLifeLostMessages(ls => [...ls, { id, index }]);
    setTimeout(() => setLifeLostMessages(ls => ls.filter(l => l.id !== id)), 1000);
  };

  const resetPositions = () => {
    setPacmanIndex(pacmanStart);
    setGhostIndex(ghostStart);
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setCells(levels[0].layout);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setShowFinalScore(false);
    setIsFrightened(false);
    setGameStarted(false);
    setLevelStarting(true);
    setFloatingScores([]);
    setLifeLostMessages([]);
    resetPositions();
  };

  const startLevel = () => {
    setLevelStarting(false);
    setGameStarted(true);
  };

  const movePacman = (e) => {
    if(gameOver || levelStarting) return;

    let newIndex = pacmanIndex;
    switch(e.key){
      case "ArrowLeft": if(cells[pacmanIndex-1]!==1) newIndex=pacmanIndex-1; break;
      case "ArrowRight": if(cells[pacmanIndex+1]!==1) newIndex=pacmanIndex+1; break;
      case "ArrowUp": if(cells[pacmanIndex-width]!==1) newIndex=pacmanIndex-width; break;
      case "ArrowDown": if(cells[pacmanIndex+width]!==1) newIndex=pacmanIndex+width; break;
      default: break;
    }

    // --- SCORING ---
    if(cells[newIndex]===0){
      const nc=[...cells]; nc[newIndex]=2; setCells(nc);
      setScore(s=>{
        showFloatingScore('+10', newIndex);
          eatSoundRef.current.currentTime = 0;
          eatSoundRef.current.play();
        return s + 10;
      
      });
    }
    if(cells[newIndex]===3){
      const nc=[...cells]; nc[newIndex]=2; setCells(nc);
      setScore(s=>{
        showFloatingScore('+50', newIndex);
           eatSoundRef.current.currentTime = 0;
           eatSoundRef.current.play();
        return s + 50;
     
      });
      activateFrightenedMode();
    }

    setPacmanIndex(newIndex);
  };

  const activateFrightenedMode = () => {
    setIsFrightened(true);
    setTimeout(()=>setIsFrightened(false),6000);
  };

  const moveGhost = () => {
    if(!gameStarted) return;
    const dirs=[-1,1,-width,width];
    const possible = dirs.filter(d=>cells[ghostIndex+d]!==1);

    if(isFrightened){
      const r = possible[Math.floor(Math.random()*possible.length)];
      setGhostIndex(g=>g+r);
    } else {
      let best=ghostIndex; let min=Infinity;
      possible.forEach(d=>{
        const next=ghostIndex+d;
        const dist=Math.abs(next-pacmanIndex);
        if(dist<min){ min=dist; best=next;}
      });
      setGhostIndex(best);
    }
  };

  const checkCollision = () => {
    if(pacmanIndex === ghostIndex){
      if(isFrightened){
        setScore(s=>{
          showFloatingScore('+200', ghostIndex);
           chompSoundRef.current.currentTime = 0;
           chompSoundRef.current.play();
          return s + 200;
         
        });
        setGhostIndex(ghostStart);
      } else {
        setLives(l => l - 1);
        deathSound.play();
        showLifeLost(pacmanIndex);
        resetPositions();
        if(lives - 1 <= 0) setGameOver(true);
      }
    }
  };

    const checkWin = () => {
  if (showFinalScore) return;
    if(!cells.includes(0) && !cells.includes(3)){
      if(currentLevel < levels.length - 1){
        victorySound.play();
        setScore(s=>{
          showFloatingScore('+500', pacmanIndex);
          return s + 500;
        });
        const nextLevel = currentLevel + 1;
        setCurrentLevel(nextLevel);
        setCells(levels[nextLevel].layout);
        resetPositions();
        setLevelStarting(true);
        setGameStarted(false);
      } else {
        victorySound.play();
        setShowFinalScore(true);
      }
    }
  };
  useEffect(() => {
  const handleEnter = (e) => {
    if (e.key === "Enter" && levelStarting && !gameOver) {
      startLevel();
    }
  };

  window.addEventListener("keydown", handleEnter);
  return () => window.removeEventListener("keydown", handleEnter);
}, [levelStarting, gameOver]);

  // --- Effects ---
  useEffect(()=>{ 
    window.addEventListener("keydown", movePacman); 
    return ()=>window.removeEventListener("keydown", movePacman); 
  }, [pacmanIndex, gameOver, levelStarting]);

useEffect(() => {
  startSoundRef.current = new Audio("/start.mp3");
  eatSoundRef.current = new Audio("/eat.mp3");
  chompSoundRef.current = new Audio("/chomp.mp3");

  startSoundRef.current.loop = true; // 🔥 important
  eatSoundRef.current.volume = 0.4;
}, []);

useEffect(() => {
  if (!startSoundRef.current) return;

  if (levelStarting && !gameOver) {
    startSoundRef.current.currentTime = 0;
    startSoundRef.current.play().catch(() => {});
  } else {
    startSoundRef.current.pause();
    startSoundRef.current.currentTime = 0;
  }
}, [levelStarting, gameOver]);

  useEffect(()=>{
    if(gameOver || !gameStarted) return;
    const ghostSpeed = currentLevel === 3 ? 250 : 600;
    const t = setInterval(moveGhost, ghostSpeed);
    return ()=>clearInterval(t);
  }, [gameStarted, ghostIndex, gameOver, isFrightened, currentLevel]);

  useEffect(()=>{ checkCollision(); checkWin(); }, [pacmanIndex, ghostIndex]);
  useEffect(()=>{ if(levelStarting && overlayRef.current) overlayRef.current.focus(); }, [levelStarting]);
// --- LOAD LEADERBOARD ---
const loadLeaderboard = async () => {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  console.log("Leaderboard data:", data);
  console.log("Leaderboard error:", error);

  if (!error && data) {
    setLeaderboard(data);
  }
};

// --- SUBMIT SCORE ON GAME OVER ---
 useEffect(() => {
  const handleGameOver = async () => {
    if (gameOver && playerName) {
      await submitScore(playerName, score);
      await loadLeaderboard();
      setShowLeaderboard(true);
    }
  };

  handleGameOver();
}, [gameOver]);

  return (
    <div className={`game-container ${currentLevel===3?"final-level":""}`}>
      <div className="score">SCORE: {score} | LIVES: {lives} | LEVEL: {currentLevel+1}</div>

      <div className="grid">
        {lifeLostMessages.map(l => (
  <div
    key={l.id}
    className="life-lost"
  >
    LIFE LOST
  </div>
))}
       
        
        {floatingScores.map(f => (
          <div
            key={f.id}
            className="floating-score"
            style={{
              top: `${Math.floor(f.index / width) * 32}px`,
              left: `${(f.index % width) * 32}px`
            }}
          >
            {f.value}
          </div>
        ))}

        {cells.map((c,i)=>(
          <Cell key={i} type={c} 
                isPacman={i===pacmanIndex} 
                isGhost={i===ghostIndex} 
                isFrightened={isFrightened} 
                colors={levels[currentLevel].colors}/>
        ))}
      </div>
      {levelStarting && !gameOver && !showFinalScore && (
  <div className="overlay start-level" ref={overlayRef} tabIndex="0">
    <div className="overlay-content glitch">
      {currentLevel === 0 ? (
        <>
        <h1 className="glitch-text" data-text="ENTER YOUR NAME">
  ENTER YOUR NAME
</h1>
          <input
            type="text"
            maxLength={12}
            value={playerName}
            placeholder="Your name"
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            disabled={!playerName.trim()}
            onClick={startLevel}
          >
            START GAME
          </button>
        </>
      ) : (
        <>
          <h1>
            {currentLevel===3
              ? "LEVEL 4 – THE FINALE"
              : `LEVEL ${currentLevel+1}`}
          </h1>
          <p>Press ENTER to start</p>
        </>
      )}
    </div>
  </div>
)}

{gameOver && (
  <div className="overlay game-over crt">
    <div className="scanlines"></div>

    <div className="overlay-content glitch">
      <h1 data-text="GAME OVER">GAME OVER</h1>
      <p>Your Score: {score}</p>

      {showLeaderboard && (
        <>
          <h2>🏆 Leaderboard</h2>
          <div className="leaderboard">
           {leaderboard.map((entry, index) => (
  <div key={entry.id} className={`leader-row rank-${index}`}>
    <span className="rank">
      {index === 0 ? "🥇" :
       index === 1 ? "🥈" :
       index === 2 ? "🥉" :
       `#${index + 1}`}
    </span>
    <span className="player-name">{entry.name}</span>
    <span className="player-score">{entry.score}</span>
  </div>
))}
          </div>
        </>
      )}

      <button onClick={restartGame}>RESTART</button>
    </div>
  </div>
)}
      {/* --- Final Score Overlay with Confetti --- */}
      {showFinalScore && (
        <div className="overlay final-score">
          <div className="confetti-container">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  background: ['#ff0','#0ff','#f0f','#fff','#ff00ff'][Math.floor(Math.random()*5)],
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          <div className="overlay-content">
              <div className="scanlines">
            <h1>CONGRATULATIONS!</h1>
            <p>Your total score: {score}</p>
            <button onClick={restartGame}>PLAY AGAIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  return data
}
const submitScore = async (name, score) => {
  const { data, error } = await supabase
    .from("scores")
    .insert([{ name, score }])
    .select();

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Inserted:", data);
  }
};
export default Board;