import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase";

const COUNTRIES = {
  "🇺🇸 United States": ["Chicago", "New York", "Los Angeles", "San Francisco", "San Diego", "Houston", "Philadelphia", "Washington DC", "Boston", "Miami", "St Croix"],
  "🇨🇭 Switzerland": ["Geneva", "Lausanne", "Bern", "Zurich", "Basel"],
};

const CITY_TIMEZONES = {
  "Chicago": "America/Chicago",
  "New York": "America/New_York",
  "Los Angeles": "America/Los_Angeles",
  "San Francisco": "America/Los_Angeles",
  "San Diego": "America/Los_Angeles",
  "Houston": "America/Chicago",
  "Philadelphia": "America/New_York",
  "Washington DC": "America/New_York",
  "Boston": "America/New_York",
  "Miami": "America/New_York",
  "St Croix": "America/St_Thomas",
  "Geneva": "Europe/Zurich",
  "Lausanne": "Europe/Zurich",
  "Bern": "Europe/Zurich",
  "Zurich": "Europe/Zurich",
  "Basel": "Europe/Zurich",
};

const MODES = [
  { key: "driving", label: "Car", emoji: "🚗" },
  { key: "walking", label: "Walk", emoji: "🚶" },
  { key: "bicycling", label: "Bike", emoji: "🚲" },
  { key: "transit", label: "Transit", emoji: "🚌" },
];

function CityLeaderboard() {
  const { city: cityParam } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState(cityParam === "pick" ? "" : cityParam);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!city || city === "pick") return;
    loadScores(city);
  }, [city]);

  async function loadScores(selectedCity) {
    setLoading(true);
    setSelected(null);

    const { data: allGames } = await supabase
      .from("games")
      .select("id")
      .eq("city", selectedCity);

    if (!allGames || allGames.length === 0) {
      setScores([]);
      setLoading(false);
      return;
    }

    const gameIds = allGames.map(g => g.id);

    const { data: players } = await supabase
      .from("players")
      .select("*")
      .in("game_id", gameIds);

    const { data: guesses } = await supabase
      .from("guesses")
      .select("*")
      .in("game_id", gameIds);

    const { data: routes } = await supabase
      .from("routes")
      .select("*")
      .in("game_id", gameIds);

    const timezone = CITY_TIMEZONES[selectedCity] || "America/Chicago";
    const playerBest = {};

    players.forEach(player => {
      const playerGuesses = guesses.filter(g => g.player_id === player.id);
      if (playerGuesses.length === 0) return;

      playerGuesses.forEach(g => {
        const route = routes.find(r => r.game_id === g.game_id && r.round_number === g.round_number);
        const playedAt = new Date(g.created_at + "Z").toLocaleString("en-US", {
          timeZone: timezone,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const roundDetail = {
          round: g.round_number,
          origin: route?.origin,
          destination: route?.destination,
          score: g.round_score,
          driving_guess: g.driving_guess,
          walking_guess: g.walking_guess,
          cycling_guess: g.cycling_guess,
          transit_guess: g.transit_guess,
          driving_actual: g.driving_actual,
          walking_actual: g.walking_actual,
          cycling_actual: g.cycling_actual,
          transit_actual: g.transit_actual,
          playedAt,
        };

        const username = player.username;
        if (!playerBest[username] || g.round_score < playerBest[username].score) {
          playerBest[username] = {
            username,
            score: g.round_score,
            playedAt,
            round: roundDetail,
          };
        }
      });
    });

    setScores(Object.values(playerBest).sort((a, b) => a.score - b.score));
    setLoading(false);
  }

  const medals = ["🥇", "🥈", "🥉"];
  const availableCities = country ? COUNTRIES[country] : [];

  if (selected) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>{selected.username}</h1>
        </div>
        <p style={{ color: "#666", marginBottom: 24 }}>
          {city} · Best single round · {selected.playedAt}
        </p>

        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Round {selected.round.round}</p>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 0 }}>
            {selected.round.origin} → {selected.round.destination}
          </p>
        </div>

        {MODES.map(m => {
          const guessKey = m.key === "bicycling" ? "cycling_guess" : `${m.key}_guess`;
          const actualKey = m.key === "bicycling" ? "cycling_actual" : `${m.key}_actual`;
          const guess = selected.round[guessKey];
          const actual = selected.round[actualKey];
          if (actual === null || actual === undefined) return null;
          const diff = guess - actual;
          return (
            <div key={m.key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14,
            }}>
              <span>{m.emoji} {m.label}</span>
              <span style={{ color: "#666" }}>
                guessed <strong>{guess} min</strong> · actual <strong>{actual} min</strong>
              </span>
              <span style={{
                color: diff === 0 ? "#1a7a4a" : diff > 0 ? "#b03030" : "#b07d00",
                fontSize: 12, minWidth: 44, textAlign: "right", fontWeight: 600,
              }}>
                {diff === 0 ? "exact!" : diff > 0 ? `+${diff}` : `${diff}`}
              </span>
            </div>
          );
        })}

        <div style={{
          background: "#111", color: "#fff", borderRadius: 8,
          padding: "16px", textAlign: "center", marginTop: 20,
        }}>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}>Best round score</div>
          <div style={{ fontSize: 42, fontWeight: 600 }}>{selected.score}</div>
        </div>

        <button
          onClick={() => setSelected(null)}
          style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 500, background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", marginTop: 12 }}
        >
          ← Back to leaderboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 28, margin: 0 }}>Leaderboards</h1>
      </div>
      <p style={{ color: "#666", marginBottom: 24 }}>Best single round per player, by city.</p>

      <p style={{ fontWeight: 500, marginBottom: 8 }}>Select a country</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {Object.keys(COUNTRIES).map(c => (
          <button key={c} onClick={() => { setCountry(c); setCity(""); setScores([]); }}
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

      {loading && <p style={{ color: "#999", textAlign: "center" }}>Loading…</p>}

      {!loading && city && scores.length === 0 && (
        <p style={{ color: "#999", textAlign: "center" }}>No scores yet for {city} — be the first!</p>
      )}

      {!loading && scores.length > 0 && (
        <>
          <p style={{ fontWeight: 500, marginBottom: 12 }}>{city} · Best single round</p>
          {scores.map((s, i) => (
            <div key={s.username}
              onClick={() => setSelected(s)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: i === 0 ? "#111" : "#f5f5f5",
                color: i === 0 ? "#fff" : "#111",
                borderRadius: 8, padding: "14px 16px", marginBottom: 10,
                cursor: "pointer",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{medals[i] || `${i + 1}.`}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{s.username}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{s.playedAt}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{s.score}</div>
                <div style={{ fontSize: 16, opacity: 0.4 }}>›</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default CityLeaderboard;