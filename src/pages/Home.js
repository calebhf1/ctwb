import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      fontFamily: "'Georgia', serif",
      padding: "0 20px",
      minHeight: "100vh",
    }}>

      <div style={{
        textAlign: "center",
        paddingTop: 40,
        paddingBottom: 16,
        borderBottom: "1px solid #e0e0e0",
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#999", marginBottom: 8, fontFamily: "sans-serif" }}>
        Think you know your city?
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: -1 }}>CTWB</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 10 }}>
        {[
            { letter: "C", word: "Car" },
            { letter: "T", word: "Transit" },
            { letter: "W", word: "Walk" },
            { letter: "B", word: "Bike" },
        ].map(({ letter, word }) => (
            <div key={letter} style={{ textAlign: "center", width: 72 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "sans-serif" }}>{letter}</div>
            <div style={{ fontSize: 11, color: "#999", fontFamily: "sans-serif", letterSpacing: 1 }}>{word.toUpperCase()}</div>
            </div>
        ))}
        </div>
      </div>

      <img
        src="/og-image.png"
        alt="CTWB"
        style={{ width: "100%", borderRadius: 12, marginBottom: 24 }}
      />

      <p style={{
        textAlign: "center",
        fontSize: 18,
        lineHeight: 1.5,
        color: "#222",
        marginBottom: 8,
        fontWeight: 400,
      }}>
        Guess how long it takes to get between two real places — by car, transit, walking, and biking.
      </p>
      <p style={{
        textAlign: "center",
        fontSize: 14,
        color: "#999",
        marginBottom: 28,
      }}>
        Lower is better — 0 is perfect. Can you beat your friends?
      </p>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginBottom: 32,
        padding: "16px 0",
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
      }}>
        {[
          { emoji: "🗺️", label: "Pick a route" },
          { emoji: "⏱️", label: "Guess the time" },
          { emoji: "🏆", label: "See your score" },
        ].map(step => (
          <div key={step.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{step.emoji}</div>
            <div style={{ fontSize: 12, color: "#666", fontFamily: "sans-serif" }}>{step.label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/daily')} style={{
      ...btnStyle,
      background: "#1a7a4a",
      color: "#fff",
      fontSize: 17,
      padding: "14px",
      marginBottom: 10,
    }}>
      📅 Daily Challenge
    </button>

      <button onClick={() => navigate('/create')} style={{
        ...btnStyle,
        background: "#111",
        color: "#fff",
        fontSize: 17,
        padding: "14px",
        marginBottom: 10,
      }}>
        🎮 Classic mode
      </button>

      <button onClick={() => navigate('/pass-and-play')} style={{
        ...btnStyle,
        background: "#fff",
        color: "#111",
        border: "1px solid #222",
        marginBottom: 10,
      }}>
        🤝 Pass & play
      </button>

      <button onClick={() => navigate('/city-leaderboard/pick')} style={{
        ...btnStyle,
        background: "#fff",
        color: "#111",
        border: "1px solid #ddd",
        marginBottom: 10,
        }}>
        🏆 Leaderboards
        </button>

      <button onClick={() => navigate('/free')} style={{
        ...btnStyle,
        background: "#fff",
        color: "#999",
        border: "1px solid #ddd",
        marginBottom: 32,
      }}>
        🗺️ Practice mode
      </button>
    </div>
  );
}

const btnStyle = {
  width: "100%",
  padding: "13px",
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 6,
  cursor: "pointer",
  border: "none",
  fontFamily: "sans-serif",
  display: "block",
};

export default Home;