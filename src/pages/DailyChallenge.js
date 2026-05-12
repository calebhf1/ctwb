import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";

const MODES = [
  { key: "driving",   label: "Car",     emoji: "🚗" },
  { key: "transit",   label: "Transit", emoji: "🚌" },
  { key: "walking",   label: "Walk",    emoji: "🚶" },
  { key: "bicycling", label: "Bike",    emoji: "🚲" },
];

const DAILY_ROUTES = [
  { date: "2026-05-12", city: "New York", origin: "Times Square, New York", destination: "Brooklyn Bridge, New York" },
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

function getScoreMessage(score) {
  if (score <= 20)  return "🏆 Local Legend";
  if (score <= 50)  return "🗺️ City Slicker";
  if (score <= 90)  return "🚶 Regular Commuter";
  if (score <= 140) return "🧭 Getting Oriented";
  if (score <= 200) return "📸 Day Tripper";
  return "🧳 Tourist";
}

function ScoreScale({ score }) {
  const max = 120;
  const capped = Math.min(score, max);
  const pct = (capped / max) * 100;
  return (
    <div style={{ margin: "8px 0 4px" }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #1a7a4a, #f0c040, #b03030)" }}>
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)", width: 14, height: 14,
          borderRadius: "50%", background: "#3b82f6", border: "2px solid white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: 4 }}>
        <span>🎯 perfect</span><span>ok</span><span>way off</span>
      </div>
    </div>
  );
}

function RouteMap({ origin, destination }) {
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  const markers = `markers=color:red%7Clabel:A%7C${encodeURIComponent(origin)}&markers=color:blue%7Clabel:B%7C${encodeURIComponent(destination)}`;
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=480x200&maptype=roadmap&${markers}&key=${key}`;
  return <img src={url} alt="Route map" style={{ width: "100%", borderRadius: 8, marginBottom: 16 }} />;
}

function ResultsCard({ route, score, actuals, guesses, today }) {
  const [copied, setCopied] = useState(false);

  function getModeEmoji(modeScore) {
    if (modeScore === null) return "⬜";
    if (modeScore <= 15) return "🟩";
    if (modeScore <= 50) return "🟨";
    return "🟥";
  }

  const modeLines = MODES.map(m => {
    const actual = actuals[m.key];
    const guess = toMinutes(guesses[m.key].h, guesses[m.key].m);
    const modeScore = actual === null ? null : calcScore(guess, actual);
    return `${m.emoji} ${modeScore === null ? "N/A" : modeScore + " pts"}`;
  });

  const modeEmojis = MODES.map(m => {
    const actual = actuals[m.key];
    const guess = toMinutes(guesses[m.key].h, guesses[m.key].m);
    const modeScore = actual === null ? null : calcScore(guess, actual);
    return getModeEmoji(modeScore);
  });

  const lines = [
    `CTWB Daily Challenge 📅`,
    `${today} · ${route.city}`,
    "",
    `${modeEmojis[0]}${modeEmojis[1]}${modeEmojis[2]}${modeEmojis[3]}`,
    `${modeLines[0]}  ${modeLines[1]}`,
    `${modeLines[2]}  ${modeLines[3]}`,
    "",
    `${score} pts — ${getScoreMessage(score)}`,
    "playctwb.vercel.app/daily",
  ];

  const text = lines.join("\n");

  return (
    <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Share your results</p>
      <div style={{
        background: "#fff", borderRadius: 8, padding: "16px",
        fontFamily: "monospace", fontSize: 14, lineHeight: 1.9,
        marginBottom: 12, whiteSpace: "pre", color: "#111", overflowX: "auto",
      }}>
        {text}
      </div>
      <button onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }} style={{
        width: "100%", padding: "10px", fontSize: 14, fontWeight: 600,
        background: copied ? "#1a7a4a" : "#111", color: "#fff",
        border: "none", borderRadius: 6, cursor: "pointer",
      }}>
        {copied ? "✓ Copied!" : "Copy results"}
      </button>
    </div>
  );
}

function getTodayRoute() {
  const today = new Date().toISOString().slice(0, 10);
  return DAILY_ROUTES.find(r => r.date === today) || DAILY_ROUTES[DAILY_ROUTES.length - 1];
}

function getTodayKey() {
  return `ctwb_daily_${new Date().toISOString().slice(0, 10)}`;
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const route = getTodayRoute();
  const storageKey = getTodayKey();
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const todayDate = new Date().toISOString().slice(0, 10);

  const savedResult = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
  })();

  const [username, setUsername] = useState(localStorage.getItem("ctwb_daily_username") || "");
  const [usernameInput, setUsernameInput] = useState("");
  const [guesses, setGuesses] = useState(savedResult?.guesses || {
    driving:   { h: "", m: "" },
    transit:   { h: "", m: "" },
    walking:   { h: "", m: "" },
    bicycling: { h: "", m: "" },
  });
  const [actuals, setActuals] = useState(savedResult?.actuals || null);
  const [totalScore, setTotalScore] = useState(savedResult?.totalScore ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    if (actuals) loadLeaderboard();
  }, [actuals]);

  async function loadLeaderboard() {
    setLoadingBoard(true);
    const { data } = await supabase
      .from("daily_scores")
      .select("username, total_score, created_at")
      .eq("date", todayDate)
      .order("total_score", { ascending: true })
      .limit(10);
    setLeaderboard(data || []);
    setLoadingBoard(false);
  }

  function handleSetUsername() {
    if (!usernameInput.trim()) return setError("Please enter a username.");
    localStorage.setItem("ctwb_daily_username", usernameInput.trim());
    setUsername(usernameInput.trim());
    setError("");
  }

  async function handleSubmit() {
    for (const m of MODES) {
      const total = toMinutes(guesses[m.key].h, guesses[m.key].m);
      if (total === 0) return setError(`Enter a guess for ${m.label}.`);
    }
    setError("");
    setSubmitting(true);

    try {
      const results = await fetchAllModes(route.origin, route.destination);
      const score = MODES.reduce((sum, m) => {
        if (results[m.key] === null) return sum;
        return sum + calcScore(toMinutes(guesses[m.key].h, guesses[m.key].m), results[m.key]);
      }, 0);

      await supabase.from("daily_scores").insert({
        username,
        date: todayDate,
        city: route.city,
        origin: route.origin,
        destination: route.destination,
        driving_guess:  toMinutes(guesses.driving.h,   guesses.driving.m),
        transit_guess:  toMinutes(guesses.transit.h,   guesses.transit.m),
        walking_guess:  toMinutes(guesses.walking.h,   guesses.walking.m),
        cycling_guess:  toMinutes(guesses.bicycling.h, guesses.bicycling.m),
        driving_actual:  results.driving,
        transit_actual:  results.transit,
        walking_actual:  results.walking,
        cycling_actual:  results.bicycling,
        total_score: score,
      });

      setActuals(results);
      setTotalScore(score);
      localStorage.setItem(storageKey, JSON.stringify({
        guesses, actuals: results, totalScore: score,
      }));
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  const medals = ["🥇", "🥈", "🥉"];

  if (!username) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Daily Challenge</h1>
        </div>
        <p style={{ color: "#666", marginBottom: 24 }}>{today}</p>

        <div style={{ background: "#f0f9f4", border: "1px solid #c3e6d4", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#1a7a4a", fontWeight: 500 }}>
            📅 One route. One shot. Come back tomorrow for a new challenge.
          </p>
        </div>

        <p style={{ fontWeight: 500, marginBottom: 8 }}>Enter a username to join the leaderboard</p>
        <input
          placeholder="e.g. caleb"
          value={usernameInput}
          onChange={e => setUsernameInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSetUsername()}
          style={inputStyle}
        />
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
        <button onClick={handleSetUsername} style={btnStyle}>Let's play →</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Daily Challenge</h1>
        </div>
        <span style={{ fontSize: 13, color: "#999" }}>{username}</span>
      </div>
      <p style={{ color: "#666", marginBottom: 16 }}>{today}</p>

      {!actuals && (
        <div style={{ background: "#f0f9f4", border: "1px solid #c3e6d4", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#1a7a4a", fontWeight: 500 }}>
            📅 One route. One shot. Come back tomorrow for a new challenge.
          </p>
        </div>
      )}

      <p style={{ fontWeight: 500, marginBottom: 4 }}>Today's route</p>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{route.city}</p>
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>{route.origin} → {route.destination}</p>
      <RouteMap origin={route.origin} destination={route.destination} />

      {!actuals ? (
        <>
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
          <button onClick={handleSubmit} disabled={submitting} style={btnStyle}>
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
            <div style={{ fontSize: 13, marginBottom: 4, color: "#aaa" }}>Today's score</div>
            <div style={{ fontSize: 48, fontWeight: 600 }}>{totalScore}</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 6 }}>{getScoreMessage(totalScore)}</div>
          </div>

          <ResultsCard
            route={route}
            score={totalScore}
            actuals={actuals}
            guesses={guesses}
            today={today}
          />

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Today's leaderboard</p>
            {loadingBoard && <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>}
            {!loadingBoard && leaderboard.map((s, i) => (
              <div key={s.username + i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: s.username === username ? "#f0f9f4" : "#f5f5f5",
                border: s.username === username ? "1px solid #c3e6d4" : "none",
                borderRadius: 8, padding: "12px 16px", marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{medals[i] || `${i + 1}.`}</span>
                  <span style={{ fontWeight: 600 }}>{s.username}</span>
                  {s.username === username && <span style={{ fontSize: 12, color: "#1a7a4a" }}>you</span>}
                </div>
                <span style={{ fontWeight: 600, fontSize: 18 }}>{s.total_score}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/')} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd" }}>
            ← Back to home
          </button>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px", fontSize: 15,
  border: "1px solid #ddd", borderRadius: 6, marginBottom: 12, boxSizing: "border-box",
};

const btnStyle = {
  width: "100%", padding: "12px", fontSize: 16, fontWeight: 500,
  background: "#111", color: "#fff", border: "none", borderRadius: 6,
  cursor: "pointer", marginTop: 8,
};