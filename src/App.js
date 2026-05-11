import { useState } from "react";

const MODES = [
  { key: "driving",   label: "Driving",  emoji: "🚗" },
  { key: "walking",   label: "Walking",  emoji: "🚶" },
  { key: "bicycling", label: "Cycling",  emoji: "🚲" },
  { key: "transit",   label: "Transit",  emoji: "🚌" },
];

async function fetchTravelTime(origin, destination, mode) {
  const params = new URLSearchParams({ origins: origin, destinations: destination, mode });
  const response = await fetch(`/api/maps?${params}`);
  const data = await response.json();
  const seconds = data.rows[0].elements[0].duration.value;
  return Math.round(seconds / 60);
}

async function fetchAllModes(origin, destination) {
  const results = {};
  for (const mode of MODES) {
    results[mode.key] = await fetchTravelTime(origin, destination, mode.key);
  }
  return results;
}

function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [guesses, setGuesses] = useState({ driving: "", walking: "", bicycling: "", transit: "" });
  const [actuals, setActuals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 function calcScore(guess, actual) {
  if (guess === actual) return 0;
  const ratio = Math.abs(guess - actual) / actual;
  return Math.round(ratio * 100);
}

  async function handleSubmit() {
    if (!origin || !destination) return setError("Enter both locations.");
    for (const m of MODES) {
      if (!guesses[m.key] || isNaN(guesses[m.key])) return setError(`Enter a guess for ${m.label}.`);
    }
    setError("");
    setLoading(true);
    try {
      const results = await fetchAllModes(origin, destination);
      setActuals(results);
    } catch (e) {
      setError("Something went wrong fetching travel times. Check your API key.");
    }
    setLoading(false);
  }

  function handleReset() {
    setOrigin("");
    setDestination("");
    setGuesses({ driving: "", walking: "", bicycling: "", transit: "" });
    setActuals(null);
    setError("");
  }

  const totalScore = actuals
    ? MODES.reduce((sum, m) => sum + calcScore(Number(guesses[m.key]), actuals[m.key]), 0)
    : 0;

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>CTWB</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Guess the travel time between two places.</p>

      {!actuals ? (
        <>
          <input
            placeholder="Origin (e.g. 215 E Chestnut St Chicago)"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Destination (e.g. Lincoln Park Zoo Chicago)"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            style={inputStyle}
          />

          <p style={{ fontWeight: 500, marginBottom: 12 }}>Your guesses (minutes):</p>
          {MODES.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 12 }}>
              <span style={{ width: 90 }}>{m.emoji} {m.label}</span>
              <input
                type="number"
                min="1"
                placeholder="?"
                value={guesses[m.key]}
                onChange={e => setGuesses({ ...guesses, [m.key]: e.target.value })}
                style={{ ...inputStyle, width: 80, marginBottom: 0 }}
              />
              <span style={{ color: "#999", fontSize: 13 }}>min</span>
            </div>
          ))}

          {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
            {loading ? "Looking up times…" : "Submit guesses"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontWeight: 500, marginBottom: 16 }}>
            {origin} → {destination}
          </p>
          {MODES.map(m => {
            const actual = actuals[m.key];
            const guess = Number(guesses[m.key]);
            const score = calcScore(guess, actual);
            return (
              <div key={m.key} style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{m.emoji} {m.label}</span>
                  <span style={{ fontWeight: 500, color: scoreColor(score) }}>{score} pts</span>
                </div>
                <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#444" }}>
                  <span>Your guess: <strong>{guess} min</strong></span>
                  <span>Actual: <strong>{actual} min</strong></span>
                </div>
              </div>
            );
          })}

          <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "16px", textAlign: "center", margin: "20px 0" }}>
            <div style={{ fontSize: 13, marginBottom: 4, color: "#aaa" }}>Total score</div>
            <div style={{ fontSize: 48, fontWeight: 600 }}>{totalScore}</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>lower is better</div>
          </div>

          <button onClick={handleReset} style={btnStyle}>Play again</button>
        </>
      )}
    </div>
  );
}

function scoreColor(score) {
  if (score <= 10) return "#1a7a4a";
  if (score <= 30) return "#b07d00";
  return "#b03030";
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  border: "1px solid #ddd",
  borderRadius: 6,
  marginBottom: 12,
  boxSizing: "border-box",
};

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
  marginTop: 8,
};

export default App;