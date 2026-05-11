import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase";

const MODES = [
  { key: "driving",   label: "Car",     emoji: "🚗" },
  { key: "walking",   label: "Walk",    emoji: "🚶" },
  { key: "bicycling", label: "Bike",    emoji: "🚲" },
  { key: "transit",   label: "Transit", emoji: "🚌" },
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
  return Math.round(Math.abs(guess - actual) / actual * 100);
}

function scoreColor(score) {
  if (score <= 10) return "#1a7a4a";
  if (score <= 40) return "#b07d00";
  return "#b03030";
}

function ScoreScale({ score }) {
  const max = 120;
  const capped = Math.min(score, max);
  const pct = (capped / max) * 100;
  return (
    <div style={{ margin: "8px 0 4px" }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #1a7a4a, #f0c040, #b03030)" }}>
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
        }} />
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
    <img
      src={url}
      alt="Route map"
      style={{ width: "100%", borderRadius: 8, marginBottom: 16 }}
    />
  );
}

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [playerId, setPlayerId] = useState(localStorage.getItem("ctwb_player_id"));
  const [username, setUsername] = useState(localStorage.getItem("ctwb_username") || "");
  const [usernameInput, setUsernameInput] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [guesses, setGuesses] = useState({
    driving:   { h: "", m: "" },
    walking:   { h: "", m: "" },
    bicycling: { h: "", m: "" },
    transit:   { h: "", m: "" },
  });
  const [actuals, setActuals] = useState(null);
  const [roundScores, setRoundScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadGame() {
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      const { data: routeData } = await supabase
        .from("routes")
        .select("*")
        .eq("game_id", gameId)
        .order("round_number");

      setGame(gameData);
      setRoutes(routeData || []);
      setLoading(false);
    }
    loadGame();
  }, [gameId]);

  async function handleJoin() {
    if (!usernameInput.trim()) return setError("Please enter a username.");
    setError("");

    const { data: player } = await supabase
      .from("players")
      .insert({ game_id: gameId, username: usernameInput.trim() })
      .select()
      .single();

    localStorage.setItem("ctwb_player_id", player.id);
    localStorage.setItem("ctwb_username", usernameInput.trim());
    setPlayerId(player.id);
    setUsername(usernameInput.trim());
  }

  async function handleSubmitRound() {
    for (const m of MODES) {
      const total = toMinutes(guesses[m.key].h, guesses[m.key].m);
      if (total === 0) return setError(`Enter a guess for ${m.label}.`);
    }
    setError("");
    setSubmitting(true);

    try {
      const route = routes[currentRound];
      const results = await fetchAllModes(route.origin, route.destination);
      const roundScore = MODES.reduce((sum, m) => {
        if (results[m.key] === null) return sum;
        return sum + calcScore(toMinutes(guesses[m.key].h, guesses[m.key].m), results[m.key]);
      }, 0);

      await supabase.from("guesses").insert({
        player_id: Number(playerId),
        game_id: gameId,
        round_number: currentRound + 1,
        driving_guess:  toMinutes(guesses.driving.h,   guesses.driving.m),
        walking_guess:  toMinutes(guesses.walking.h,   guesses.walking.m),
        cycling_guess:  toMinutes(guesses.bicycling.h, guesses.bicycling.m),
        transit_guess:  toMinutes(guesses.transit.h,   guesses.transit.m),
        driving_actual:  results.driving,
        walking_actual:  results.walking,
        cycling_actual:  results.bicycling,
        transit_actual:  results.transit,
        round_score: roundScore,
      });

      setActuals(results);
      setRoundScores([...roundScores, roundScore]);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  function handleNextRound() {
    if (currentRound + 1 >= routes.length) {
      navigate(`/leaderboard/${gameId}`);
    } else {
      setCurrentRound(currentRound + 1);
      setGuesses({
        driving:   { h: "", m: "" },
        walking:   { h: "", m: "" },
        bicycling: { h: "", m: "" },
        transit:   { h: "", m: "" },
      });
      setActuals(null);
    }
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading game…</div>;
  if (!game) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Game not found.</div>;

  if (!playerId || !username) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>CTWB</h1>
        <p style={{ color: "#666", marginBottom: 8 }}>You've been invited to play a game in</p>
        <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>{game.city}</p>
        <p style={{ fontWeight: 500, marginBottom: 8 }}>Enter a username to join</p>
        <input
          placeholder="e.g. caleb"
          value={usernameInput}
          onChange={e => setUsernameInput(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
        <button onClick={handleJoin} style={btnStyle}>Join game →</button>
      </div>
    );
  }

  const route = routes[currentRound];
  const totalScore = roundScores.reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>CTWB</h1>
        <span style={{ fontSize: 13, color: "#999" }}>Playing as {username}</span>
      </div>
      <p style={{ color: "#666", marginBottom: 8 }}>{game.city} · Round {currentRound + 1} of {routes.length}</p>

      <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#666", flex: 1, wordBreak: "break-all" }}>{window.location.href}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ padding: "6px 12px", fontSize: 13, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>

      {!actuals ? (
        <>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Route</p>
          <p style={{ marginBottom: 12, fontSize: 15 }}>{route.origin} → {route.destination}</p>
          <RouteMap origin={route.origin} destination={route.destination} />
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
          <button onClick={handleSubmitRound} disabled={submitting} style={btnStyle}>
            {submitting ? "Looking up times…" : "Submit guesses"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontWeight: 500, marginBottom: 16 }}>{route.origin} → {route.destination}</p>
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
                {score !== null && <ScoreScale score={score} />}
              </div>
            );
          })}

          <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "16px", textAlign: "center", margin: "20px 0" }}>
            <div style={{ fontSize: 13, marginBottom: 4, color: "#aaa" }}>Round {currentRound + 1} score</div>
            <div style={{ fontSize: 48, fontWeight: 600 }}>{roundScores[roundScores.length - 1]}</div>
            {roundScores.length > 1 && (
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>Running total: {totalScore}</div>
            )}
          </div>

          <button onClick={handleNextRound} style={btnStyle}>
            {currentRound + 1 >= routes.length ? "See leaderboard →" : "Next round →"}
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

export default Game;