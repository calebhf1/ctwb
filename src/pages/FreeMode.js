import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MODES = [
  { key: "driving",   label: "Car",     emoji: "🚗" },
  { key: "transit",   label: "Transit", emoji: "🚌" },
  { key: "walking",   label: "Walk",    emoji: "🚶" },
  { key: "bicycling", label: "Bike",    emoji: "🚲" },
];

async function fetchTravelTime(origin, destination, mode) {
  const params = new URLSearchParams({ origins: origin, destinations: destination, mode });
  const response = await fetch(`/api/maps?${params}`);
  const data = await response.json();
  const element = data.rows[0].elements[0];
  if (element.status !== "OK") return null;
  const seconds = element.duration.value;
  return Math.round(seconds / 60);
}

async function fetchAllModes(origin, destination) {
  const results = {};
  for (const mode of MODES) {
    results[mode.key] = await fetchTravelTime(origin, destination, mode.key);
  }
  return results;
}

function toMinutes(h, m) {
  return (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
}

function calcScore(guess, actual) {
  if (guess === actual) return 0;
  const denominator = Math.max(actual, 10);
  return Math.round(Math.abs(guess - actual) / denominator * 100);
}

function scoreColor(score) {
  if (score <= 10) return "#1a7a4a";
  if (score <= 40) return "#b07d00";
  return "#b03030";
}

function ScoreScale({ guess, actual }) {
  const ratio = guess / actual;
  const pct = Math.min(Math.max(ratio, 0), 2) / 2 * 100;

  return (
    <div style={{ margin: "8px 0 4px" }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #b03030, #1a7a4a, #b03030)" }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translateY(-50%)",
          width: 2,
          height: "100%",
          background: "rgba(255,255,255,0.5)",
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#3b82f6",
          border: "2px solid white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          zIndex: 1,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: 4 }}>
        <span>too low</span>
        <span>🎯 perfect</span>
        <span>too high</span>
      </div>
    </div>
  );
}

function FreeMode() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [guesses, setGuesses] = useState({
    driving:   { h: "", m: "" },
    transit:   { h: "", m: "" },
    walking:   { h: "", m: "" },
    bicycling: { h: "", m: "" },
  });
  const [actuals, setActuals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!origin || !destination) return setError("Enter both locations.");
    for (const m of MODES) {
      const total = toMinutes(guesses[m.key].h, guesses[m.key].m);
      if (total === 0) return setError(`Enter a guess for ${m.label}.`);
    }
    setError("");
    setLoading(true);
    try {
      const results = await fetchAllModes(origin, destination);
      setActuals(results);
    } catch (e) {
      setError("Something went wrong fetching travel times.");
    }
    setLoading(false);
  }

  function handleReset() {
    setOrigin("");
    setDestination("");
    setGuesses({
      driving:   { h: "", m: "" },
      transit:   { h: "", m: "" },
      walking:   { h: "", m: "" },
      bicycling: { h: "", m: "" },
    });
    setActuals(null);
    setError("");
  }

  const totalScore = actuals
    ? MODES.reduce((sum, m) => {
        const actual = actuals[m.key];
        if (actual === null) return sum;
        return sum + calcScore(toMinutes(guesses[m.key].h, guesses[m.key].m), actual);
      }, 0)
    : 0;

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 28, margin: 0 }}>Free mode</h1>
      </div>
      <p style={{ color: "#666", marginBottom: 24 }}>Enter any two places and guess the current travel times.</p>

      {!actuals ? (
        <>
          <input
            placeholder="Origin (e.g. Wrigley Field, Chicago)"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Destination (e.g. Navy Pier, Chicago)"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontWeight: 500, marginBottom: 12 }}>Your guesses:</p>
          {MODES.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
              <span style={{ width: 90 }}>{m.emoji} {m.label}</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={guesses[m.key].h}
                onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], h: e.target.value } })}
                style={{ ...inputStyle, width: 55, marginBottom: 0 }}
              />
              <span style={{ color: "#999", fontSize: 13 }}>hr</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={guesses[m.key].m}
                onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], m: e.target.value } })}
                style={{ ...inputStyle, width: 55, marginBottom: 0 }}
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
          <p style={{ fontWeight: 500, marginBottom: 16 }}>{origin} → {destination}</p>
          {MODES.map(m => {
            const actual = actuals[m.key];
            const guess = toMinutes(guesses[m.key].h, guesses[m.key].m);
            const score = actual === null ? null : calcScore(guess, actual);
            return (
              <div key={m.key} style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{m.emoji} {m.label}</span>
                  <span style={{ fontWeight: 500, color: score === null ? "#999" : scoreColor(score) }}>
                    {score === null ? "N/A" : `${score} pts`}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#444" }}>
                  <span>Your guess: <strong>{guess} min</strong></span>
                  <span>Actual: <strong>{actual === null ? "No route" : `${actual} min`}</strong></span>
                </div>
                {score !== null && <ScoreScale guess={guess} actual={actual} />}
              </div>
            );
          })}
          <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "16px", textAlign: "center", margin: "20px 0" }}>
            <div style={{ fontSize: 13, marginBottom: 4, color: "#aaa" }}>Total score</div>
            <div style={{ fontSize: 48, fontWeight: 600 }}>{totalScore}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
              {totalScore <= 20 ? "🎯 You don't need maps. Maps need you." :
               totalScore <= 50 ? "🙌 You really know your way around town!" :
               totalScore <= 80 ? "👍 Solid effort, not bad at all." :
               totalScore <= 120 ? "😐 Average — keep exploring!" :
               "😬 Time to get out more."}
            </div>
          </div>
          <button onClick={handleReset} style={btnStyle}>Try another route</button>
          <button onClick={() => navigate('/')} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 8 }}>
            Back to home
          </button>
        </>
      )}
    </div>
  );
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

export default FreeMode;