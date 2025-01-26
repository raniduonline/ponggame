import React, { useEffect } from "react";
import Pong from "./Pong.jsx";
import './index.css';

function App() {
  useEffect(() => {
    console.log("App component mounted");
  }, []);

  return (
    <div className="App" style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '20px'
    }}>
      <h1>Ghost Pong</h1>
      <Pong />
    </div>
  );
}

export default App;
