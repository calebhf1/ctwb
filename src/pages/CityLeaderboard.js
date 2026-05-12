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

function CityLeaderboard() {
  const { city: cityParam } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState(cityParam === "pick" ? "" : cityParam);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city || city === "pick") return;
    loadScores(city);
  }, [city]);

  async function loadScores(selectedCity) {
    setLoading(true);

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

    const playerTotals = {};
    players.forEach(player => {
      const playerGuesses = guesses.filter(g => g.player_id === player.id);
      if (playerGuesses.length === 0) return;
      const total = playerGuesses.reduce((sum, g) => sum + g.round_score, 0);
      const lastGuess = [...playerGuesses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const timezone = CITY_TIMEZONES[selectedCity] || "America/Chicago";
      const playedAt = lastGuess ? new Date(lastGuess.created_at).toLocaleString("en-US", {
        timeZone: timezone,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) : null;
      const username = player.username;
      if (!playerTotals[username] || total < playerTotals[username].total) {
        playerTotals[username] = { username, total, rounds: playerGuesses.length, playedAt };
      }
    });

    setScores(Object.values(playerTotals).sort((a, b) => a.total - b.total));
    setLoading(false);
  }

  const medals = ["🥇", "🥈", "🥉"];
  const availableCities = country ? COUNTRIES[country] : [];

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 28, margin: 0 }}>Leaderboards</h1>
      </div>
      <p style={{ color: "#666", marginBottom: 24 }}>Best scores by city — all time.</p>

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
          <p style={{ fontWeight: 500, marginBottom: 12 }}>{city} · All time</p>
          {scores.map((s, i) => (
            <div key={s.username} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: i === 0 ? "#111" : "#f5f5f5",
              color: i === 0 ? "#fff" : "#111",
              borderRadius: 8, padding: "14px 16px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{medals[i] || `${i + 1}.`}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{s.username}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {s.rounds} round{s.rounds !== 1 ? "s" : ""} · {s.playedAt}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{s.total}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>lower is better</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default CityLeaderboard;