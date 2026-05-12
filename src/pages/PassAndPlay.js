import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CITIES from "../cities";

const MODES = [
  { key: "driving",   label: "Car",     emoji: "🚗" },
  { key: "transit",   label: "Transit", emoji: "🚌" },
  { key: "walking",   label: "Walk",    emoji: "🚶" },
  { key: "bicycling", label: "Bike",    emoji: "🚲" },
];

const COUNTRIES = {
  "🇺🇸 United States": ["Chicago", "New York", "Los Angeles", "San Francisco", "San Diego", "Houston", "Philadelphia", "Washington DC", "Boston", "Miami"],
  "🇨🇭 Switzerland": ["Geneva", "Lausanne", "Bern", "Zurich", "Basel"],
};

const PLAYER_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

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
  return Math.round(Math.abs(guess - actual) / actual * 100);
}

function scoreColor(score) {
  if (score <= 10) return "#1a7a4a";
  if (score <= 40) return "#b07d00";
  return "#b03030";
}

function MultiScoreScale({ players }) {
  const max = 120;
  return (
    <div style={{ margin: "8px 0 4px" }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #1a7a4a, #f0c040, #b03030)" }}>
        {players.map((p, i) => {
          const capped = Math.min(p.score, max);
          const pct = (capped / max) * 100;
          return (
            <div key={p.name} style={{
              position: "absolute",
              top: "50%",
              left: `${pct}%`,
              transform: "translate(-50%, -50%)",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: p.color,
              border: "2px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              zIndex: i + 1,
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: 4 }}>
        <span>🎯 perfect</span>
        <span>ok</span>
        <span>way off</span>
      </div>
    </div>
  );
}

function RouteMap({ origin, destination }) {
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  const markers = `markers=color:red%7Clabel:A%7C${encodeURIComponent(origin)}&markers=color:blue%7Clabel:B%7C${encodeURIComponent(destination)}`;
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=480x200&maptype=roadmap&${markers}&key=${key}`;
  return (
    <img src={url} alt="Route map" style={{ width: "100%", borderRadius: 8, marginBottom: 16 }} />
  );
}

const PHASES = {
  SETUP: "setup",
  GUESSING: "guessing",
  ROUND_REVEAL: "round_reveal",
  FINAL: "final",
  HANDOFF: "handoff",
};

export default function PassAndPlay() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState(PHASES.SETUP);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [routes, setRoutes] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [guesses, setGuesses] = useState({
    driving:   { h: "", m: "" },
    transit:   { h: "", m: "" },
    walking:   { h: "", m: "" },
    bicycling: { h: "", m: "" },
  });
  const [actuals, setActuals] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [roundResults, setRoundResults] = useState([]);
  const [allScores, setAllScores] = useState({});

  function handleStartGame() {
    if (!country) return setError("Please select a country.");
    if (!city) return setError("Please select a city.");
    if (playerNames.some(n => !n.trim())) return setError("Please enter all player names.");
    setError("");
    const allRoutes = CITIES[city];
    const shuffled = [...allRoutes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setRoutes(selected);
    const initialScores = {};
    playerNames.forEach(n => { initialScores[n.trim()] = 0; });
    setAllScores(initialScores);
    setPhase(PHASES.GUESSING);
  }

  async function handleSubmitGuesses() {
    for (const m of MODES) {
      const total = toMinutes(guesses[m.key].h, guesses[m.key].m);
      if (total === 0) return setError(`Enter a guess for ${m.label}.`);
    }
    setError("");
    setSubmitting(true);

    try {
      const route = routes[currentRound];
      const results = actuals || await fetchAllModes(route.origin, route.destination);
      if (!actuals) setActuals(results);

      const roundScore = MODES.reduce((sum, m) => {
        if (results[m.key] === null) return sum;
        return sum + calcScore(toMinutes(guesses[m.key].h, guesses[m.key].m), results[m.key]);
      }, 0);

      const playerName = playerNames[currentPlayerIndex].trim();
      const newRoundResults = [...roundResults, { player: playerName, guesses: { ...guesses }, score: roundScore, actuals: results }];
      setRoundResults(newRoundResults);
      setAllScores(prev => ({ ...prev, [playerName]: (prev[playerName] || 0) + roundScore }));

      const isLastPlayer = currentPlayerIndex === playerNames.length - 1;
      if (isLastPlayer) {
        setPhase(PHASES.ROUND_REVEAL);
      } else {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setGuesses({ driving: { h: "", m: "" }, transit: { h: "", m: "" }, walking: { h: "", m: "" }, bicycling: { h: "", m: "" } });
        setPhase(PHASES.HANDOFF);
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  function handleNextPlayer() { setPhase(PHASES.GUESSING); }

  function handleNextRound() {
    const isLastRound = currentRound === routes.length - 1;
    if (isLastRound) {
      setPhase(PHASES.FINAL);
    } else {
      setCurrentRound(currentRound + 1);
      setCurrentPlayerIndex(0);
      setRoundResults([]);
      setActuals(null);
      setGuesses({ driving: { h: "", m: "" }, transit: { h: "", m: "" }, walking: { h: "", m: "" }, bicycling: { h: "", m: "" } });
      setPhase(PHASES.HANDOFF);
    }
  }

  const availableCities = country ? COUNTRIES[country] : [];
  const route = routes[currentRound];

  if (phase === PHASES.SETUP) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Pass & play</h1>
        </div>
        <p style={{ color: "#666", marginBottom: 24 }}>Take turns on the same device.</p>

        <p style={{ fontWeight: 500, marginBottom: 8 }}>Player names</p>
        {playerNames.map((name, i) => (
          <input key={i} placeholder={`Player ${i + 1} name`} value={name}
            onChange={e => { const updated = [...playerNames]; updated[i] = e.target.value; setPlayerNames(updated); }}
            style={inputStyle} />
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {playerNames.length < 4 && (
            <button onClick={() => setPlayerNames([...playerNames, ""])} style={{ ...outlineBtn, flex: 1 }}>+ Add player</button>
          )}
          {playerNames.length > 2 && (
            <button onClick={() => setPlayerNames(playerNames.slice(0, -1))} style={{ ...outlineBtn, flex: 1 }}>− Remove player</button>
          )}
        </div>

        <p style={{ fontWeight: 500, marginBottom: 8 }}>Select a country</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {Object.keys(COUNTRIES).map(c => (
            <button key={c} onClick={() => { setCountry(c); setCity(""); }}
              style={{ padding: "12px", fontSize: 14, borderRadius: 8, border: country === c ? "2px solid #111" : "1px solid #ddd", background: country === c ? "#111" : "#fff", color: country === c ? "#fff" : "#111", cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>

        {country && (
          <>
            <p style={{ fontWeight: 500, marginBottom: 8 }}>Select a city</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {availableCities.map(c => (
                <button key={c} onClick={() => setCity(c)}
                  style={{ padding: "12px", fontSize: 14, borderRadius: 8, border: city === c ? "2px solid #111" : "1px solid #ddd", background: city === c ? "#111" : "#fff", color: city === c ? "#fff" : "#111", cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {error && <p style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleStartGame} style={btnStyle}>Start game →</button>
      </div>
    );
  }

  if (phase === PHASES.HANDOFF) {
    const nextPlayer = playerNames[currentPlayerIndex].trim();
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: "#111", color: "#fff", borderRadius: 12, padding: "40px 24px", marginTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
          <h2 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>Pass the device</h2>
          <p style={{ color: "#aaa", marginBottom: 24 }}>Hand it to <strong style={{ color: "#fff" }}>{nextPlayer}</strong></p>
          <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>Round {currentRound + 1} of {routes.length} · {city}</p>
          <button onClick={handleNextPlayer} style={{ ...btnStyle, background: "#fff", color: "#111" }}>I'm ready →</button>
        </div>
      </div>
    );
  }

  if (phase === PHASES.GUESSING) {
    const currentPlayer = playerNames[currentPlayerIndex].trim();
    const playerColor = PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length];
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>CTWB</h1>
          <span style={{ fontSize: 13, fontWeight: 600, color: playerColor }}>{currentPlayer}'s turn</span>
        </div>
        <p style={{ color: "#666", marginBottom: 16 }}>{city} · Round {currentRound + 1} of {routes.length}</p>

        <p style={{ fontWeight: 500, marginBottom: 4 }}>Route</p>
        <p style={{ marginBottom: 12, fontSize: 15 }}>{route.origin} → {route.destination}</p>
        <RouteMap origin={route.origin} destination={route.destination} />

        <p style={{ fontWeight: 500, marginBottom: 12 }}>Your guesses:</p>
        {MODES.map(m => (
          <div key={m.key} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
            <span style={{ width: 90 }}>{m.emoji} {m.label}</span>
            <input type="number" min="0" placeholder="0" value={guesses[m.key].h}
              onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], h: e.target.value } })}
              style={{ ...inputStyle, width: 55, marginBottom: 0 }} />
            <span style={{ color: "#999", fontSize: 13 }}>hr</span>
            <input type="number" min="0" max="59" placeholder="0" value={guesses[m.key].m}
              onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], m: e.target.value } })}
              style={{ ...inputStyle, width: 55, marginBottom: 0 }} />
            <span style={{ color: "#999", fontSize: 13 }}>min</span>
          </div>
        ))}
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
        <button onClick={handleSubmitGuesses} disabled={submitting} style={btnStyle}>
          {submitting ? "Looking up times…" : "Submit guesses"}
        </button>
      </div>
    );
  }

  if (phase === PHASES.ROUND_REVEAL) {
    const roundActuals = roundResults[0]?.actuals;
    const roundWinner = [...roundResults].sort((a, b) => a.score - b.score)[0];

    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Round {currentRound + 1} results</h1>
        <p style={{ color: "#666", marginBottom: 16 }}>{route.origin} → {route.destination}</p>

        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{roundWinner.player} wins this round</span>
          <span style={{ fontSize: 13, color: scoreColor(roundWinner.score), marginLeft: "auto" }}>{roundWinner.score} pts</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {roundResults.map((r, i) => (
            <div key={r.player} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f5", borderRadius: 20, padding: "4px 12px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{r.player}</span>
              <span style={{ fontSize: 13, color: scoreColor(r.score) }}>{r.score} pts</span>
            </div>
          ))}
        </div>

        {MODES.map(m => {
          const actual = roundActuals?.[m.key];
          const playerScores = roundResults.map((r, i) => {
            const guess = toMinutes(r.guesses[m.key].h, r.guesses[m.key].m);
            const score = actual === null ? null : calcScore(guess, actual);
            return { name: r.player, guess, score: score ?? 0, color: PLAYER_COLORS[i % PLAYER_COLORS.length] };
          });

          return (
            <div key={m.key} style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{m.emoji} {m.label}</span>
                <span style={{ fontSize: 13, color: "#999" }}>
                  actual: <strong style={{ color: "#111" }}>{actual === null ? "No route" : `${actual} min`}</strong>
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                {playerScores.map(p => (
                  <span key={p.name} style={{ fontSize: 13 }}>
                    <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: "#666" }}>: {p.guess} min </span>
                    <span style={{ color: scoreColor(p.score), fontSize: 12 }}>(+{p.score})</span>
                  </span>
                ))}
              </div>
              {actual !== null && <MultiScoreScale players={playerScores} />}
            </div>
          );
        })}

        <button onClick={handleNextRound} style={btnStyle}>
          {currentRound === routes.length - 1 ? "See final scores →" : "Next round →"}
        </button>
      </div>
    );
  }

  if (phase === PHASES.FINAL) {
    const sorted = Object.entries(allScores).sort((a, b) => a[1] - b[1]);
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Final scores</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>{city} · {routes.length} rounds</p>

        {sorted.map(([name, score], i) => (
          <div key={name} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: i === 0 ? "#111" : "#f5f5f5",
            color: i === 0 ? "#fff" : "#111",
            borderRadius: 8, padding: "14px 16px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{medals[i] || `${i + 1}.`}</span>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{name}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{score}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>lower is better</div>
            </div>
          </div>
        ))}

        <button onClick={() => navigate('/')} style={{ ...btnStyle, marginTop: 8 }}>Back to home</button>
        <button onClick={() => window.location.reload()} style={{ ...outlineBtn, width: "100%", marginTop: 8 }}>Play again</button>
      </div>
    );
  }

  return null;
}

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px", fontSize: 15,
  border: "1px solid #ddd", borderRadius: 6, marginBottom: 12, boxSizing: "border-box",
};

const btnStyle = {
  width: "100%", padding: "12px", fontSize: 16, fontWeight: 500,
  background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 8,
};

const outlineBtn = {
  padding: "12px", fontSize: 15, fontWeight: 500, background: "#fff",
  color: "#111", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer",
};