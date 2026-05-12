import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>CTWB</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Guess the travel time between two places.</p>

      <img
        src="/og-image.png"
        alt="CTWB"
        style={{ width: "100%", borderRadius: 12, marginBottom: 24 }}
      />

      <button onClick={() => navigate('/create')} style={btnStyle}>
        🎮 Classic Mode
      </button>
      <button onClick={() => navigate('/pass-and-play')} style={{ ...btnStyle, background: "#444" }}>
        🤝 Pass and play
      </button>
      <button onClick={() => navigate('/free')} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd" }}>
        🗺️ Free mode — pick your own route
      </button>
    </div>
  );
}

const btnStyle = {
  width: "100%",
  padding: "12px",
  fontSize: 16,
  fontWeight: 500,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 12,
};

export default Home;