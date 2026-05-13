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
  { 
    date: "2026-05-12", 
    city: "New York", 
    origin: "Times Square, New York", 
    destination: "Brooklyn Bridge, New York",
  },
  { 
    date: "2026-05-13", 
    city: "Chicago", 
    origin: "Saieh Hall for Economics, University of Chicago, Chicago", 
    destination: "Department of Economics, Northwestern University, Evanston",
  },
];

const medals = ["🥇", "🥈", "🥉"];

const CITY_TIMEZONES = {
  "New York": "America/New_York",
  "Chicago": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "San Francisco": "America/Los_Angeles",
  "San Diego": "America/Los_Angeles",
  "Houston": "America/Chicago",
  "Philadelphia": "America/New_York",
  "Washington DC": "America/New_York",
  "Boston": "America/New_York",
  "Miami": "America/New_York",
  "St Croix, USVI": "America/St_Thomas",
  "Geneva": "Europe/Zurich",
  "Lausanne": "Europe/Zurich",
  "Bern": "Europe/Zurich",
  "Zurich": "Europe/Zurich",
  "Basel": "Europe/Zurich",
};

function getCityTime(city) {
  const tz = CITY_TIMEZONES[city] || "America/New_York";
  return new Date().toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
  });
}

async function fetchTravelTime(origin, destination, mode, departureTime) {
  const params = new URLSearchParams({ origins: origin, destinations: destination, mode });
  if (departureTime && mode === "driving") {
    params.set("departure_time", departureTime);
  }
  const response = await fetch(`/api/maps?${params}`);
  const data = await response.json();
  const element = data.rows[0].elements[0];
  if (element.status !== "OK") return null;
  const seconds = element.duration_in_traffic
    ? element.duration_in_traffic.value
    : element.duration.value;
  return Math.round(seconds / 60);
}

async function fetchAllModes(origin, destination, departureTime) {
  const results = {};
  for (const mode of MODES) {
    results[mode.key] = await fetchTravelTime(origin, destination, mode.key, departureTime);
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

function getScoreMessage(score) {
  if (score <= 20)  return "🏆 Local Legend";
  if (score <= 50)  return "🗺️ City Slicker";
  if (score <= 90)  return "🚶 Regular Commuter";
  if (score <= 140) return "🧭 Getting Oriented";
  if (score <= 200) return "📸 Day Tripper";
  return "🧳 Tourist";
}

function ScoreScale({ guess, actual }) {
  const ratio = guess / actual;
  const pct = Math.min(Math.max(ratio, 0), 2) / 2 * 100;

  return (
    <div style={{ margin: "8px 0 4px" }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #b03030, #e07020, #f0c040, #1a7a4a, #f0c040, #e07020, #b03030)" }}>
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

function RouteMap({ origin, destination }) {
  const q = encodeURIComponent(`${origin} ${destination}`);
  const src = `https://www.google.com/maps/embed/v1/search?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&q=${q}`;

  return (
    <iframe
      title="Map"
      src={src}
      width="100%"
      height="300"
      style={{ border: 0, borderRadius: 8, marginBottom: 16 }}
      allowFullScreen
      loading="lazy"
    />
  );
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
    "https://playctwb.vercel.app/daily",
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
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const exact = DAILY_ROUTES.find(r => r.date === today);
  if (exact) return exact;
  const past = DAILY_ROUTES.filter(r => r.date <= today);
  return past[past.length - 1] || DAILY_ROUTES[0];
}

function getTodayKey() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `ctwb_daily_${today}`;
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const route = getTodayRoute();
  const storageKey = getTodayKey();
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [viewingBoard, setViewingBoard] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const results = await fetchAllModes(route.origin, route.destination, route.departureTime);
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
      await loadLeaderboard();
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (viewingBoard) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => setViewingBoard(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Daily Leaderboard</h1>
        </div>
        <p style={{ color: "#666", marginBottom: 24 }}>{today} · {route.city}</p>
        {loadingBoard && <p style={{ color: "#999" }}>Loading…</p>}
        {!loadingBoard && leaderboard.length === 0 && (
          <p style={{ color: "#999" }}>No scores yet today — be the first!</p>
        )}
        {!loadingBoard && leaderboard.map((s, i) => (
          <div key={s.username + i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{medals[i] || `${i + 1}.`}</span>
              <span style={{ fontWeight: 600 }}>{s.username}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{s.total_score}</span>
          </div>
        ))}
        <button onClick={() => setViewingBoard(false)} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 16 }}>
          ← Back
        </button>
      </div>
    );
  }

 if (!username) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "'Georgia', serif", padding: "0 20px", minHeight: "100vh" }}>
      <div style={{
        textAlign: "center", paddingTop: 40, paddingBottom: 20,
        borderBottom: "1px solid #e0e0e0", marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#999", marginBottom: 8, fontFamily: "sans-serif" }}>
          Daily Challenge
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, letterSpacing: -1 }}>CTWB</h1>
        <div style={{ fontSize: 13, color: "#999", fontFamily: "sans-serif", marginTop: 6 }}>{today}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#222", marginBottom: 12, fontFamily: "sans-serif" }}>
          Every day, one route. Guess how long it takes to travel between two real places — by <strong>car</strong>, <strong>transit</strong>, <strong>walking</strong>, and <strong>bike</strong>.
        </p>
        <p style={{ fontSize: 14, color: "#666", fontFamily: "sans-serif", lineHeight: 1.6 }}>
          The closer your guess, the lower your score. <strong>0 is perfect.</strong> Compete with everyone on the daily leaderboard.
        </p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, marginBottom: 24,
      }}>
        {[
          { emoji: "🗺️", label: "See the route" },
          { emoji: "⏱️", label: "Guess the times" },
          { emoji: "📊", label: "Get your score" },
          { emoji: "🏆", label: "Beat the leaderboard" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#f5f5f5", borderRadius: 8, padding: "12px",
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "sans-serif", fontSize: 13, color: "#444",
          }}>
            <span style={{ fontSize: 20 }}>{s.emoji}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#f0f9f4", border: "1px solid #c3e6d4", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#1a7a4a", fontWeight: 500, fontFamily: "sans-serif" }}>
          📅 One route. One shot. Come back tomorrow for a new challenge.
        </p>
      </div>

      <p style={{ fontWeight: 600, marginBottom: 8, fontFamily: "sans-serif", fontSize: 15 }}>Pick a username to join the leaderboard</p>
      <input
        placeholder="e.g. Lily"
        value={usernameInput}
        onChange={e => setUsernameInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSetUsername()}
        style={inputStyle}
      />
      {error && <p style={{ color: "red", fontSize: 13, fontFamily: "sans-serif" }}>{error}</p>}
      <button onClick={handleSetUsername} style={{ ...btnStyle, fontSize: 17, padding: "14px" }}>
        Let's play →
      </button>
      <button onClick={() => setViewingBoard(true)} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 8, fontFamily: "sans-serif" }}>
        📊 View today's leaderboard
      </button>
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
      {route.departureTime && Math.floor(Date.now() / 1000) < route.departureTime && (
        <div style={{
            background: "#fff8e6",
            border: "1px solid #f0d060",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 12,
            fontSize: 13,
            color: "#7a5a00",
            display: "flex",
            alignItems: "center",
            gap: 8,
        }}>
            <span>⏰</span>
            <span>Today's times are fixed at <strong>8:30am local time</strong> — think rush hour!</span>
        </div>
        )}
      <RouteMap origin={route.origin} destination={route.destination} />

      {!actuals ? (
        <>
          <div style={{
            background: "#f5f5f5", borderRadius: 8, padding: "10px 16px",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: "#666",
          }}>
            <span>🕐</span>
            <span>Local time in {route.city}: <strong style={{ color: "#111" }}>{getCityTime(route.city)}</strong></span>
          </div>

          <p style={{ fontWeight: 500, marginBottom: 12 }}>Your guesses:</p>
          {MODES.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
              <span style={{ width: 90 }}>{m.emoji} {m.label}</span>
              <input type="number" min="0" placeholder="0" value={guesses[m.key].h}
                onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], h: e.target.value } })}
                style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
              <span style={{ color: "#999", fontSize: 13 }}>hr</span>
              <input type="number" min="0" max="59" placeholder="0" value={guesses[m.key].m}
                onChange={e => setGuesses({ ...guesses, [m.key]: { ...guesses[m.key], m: e.target.value } })}
                style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
              <span style={{ color: "#999", fontSize: 13 }}>min</span>
            </div>
          ))}
          {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
          <button onClick={handleSubmit} disabled={submitting} style={btnStyle}>
            {submitting ? "Looking up times…" : "Submit guesses"}
          </button>
          <button onClick={() => setViewingBoard(true)} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 8 }}>
            📊 Today's leaderboard
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
                {score !== null && <ScoreScale guess={guess} actual={actual} />}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>Today's leaderboard</p>
              <button onClick={loadLeaderboard} style={{ fontSize: 12, color: "#666", background: "none", border: "none", cursor: "pointer" }}>
                Refresh
              </button>
            </div>
            {loadingBoard && <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>}
            {!loadingBoard && leaderboard.length === 0 && (
              <p style={{ color: "#999" }}>No scores yet — you're the first!</p>
            )}
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