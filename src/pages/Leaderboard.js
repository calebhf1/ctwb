import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase";

function Leaderboard() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
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
};

  useEffect(() => {
    async function loadLeaderboard() {
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
      };
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId);

      const { data: guesses } = await supabase
        .from("guesses")
        .select("*")
        .eq("game_id", gameId);

      const totals = players.map(player => {
        const playerGuesses = guesses.filter(g => g.player_id === player.id);
        const total = playerGuesses.reduce((sum, g) => sum + g.round_score, 0);
        const lastGuess = playerGuesses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const timezone = CITY_TIMEZONES[gameData.city] || "America/Chicago";
        const playedAt = lastGuess ? new Date(lastGuess.created_at).toLocaleString("en-US", {
        timeZone: timezone,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        }) : null;
        return { username: player.username, total, rounds: playerGuesses.length, playedAt };
      });

      totals.sort((a, b) => a.total - b.total);

      setGame(gameData);
      setScores(totals);
      setLoading(false);
    }
    loadLeaderboard();
  }, [gameId]);

  if (loading) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading leaderboard…</div>;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Leaderboard</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>{game?.city} · {gameId}</p>

      {scores.map((s, i) => (
        <div key={s.username} style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: i === 0 ? "#111" : "#f5f5f5",
          color: i === 0 ? "#fff" : "#111",
          borderRadius: 8,
          padding: "14px 16px",
          marginBottom: 10,
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

      {scores.length === 0 && (
        <p style={{ color: "#999" }}>No scores yet — be the first to finish!</p>
      )}

      <button
        onClick={() => navigate("/")}
        style={{ width: "100%", padding: "12px", fontSize: 16, fontWeight: 500, background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 16 }}
      >
        Play again
      </button>
    </div>
  );
}

export default Leaderboard;