import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase";

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
  "St Croix, USVI": "America/St_Thomas",
  "Geneva": "Europe/Zurich",
  "Lausanne": "Europe/Zurich",
  "Bern": "Europe/Zurich",
  "Zurich": "Europe/Zurich",
  "Basel": "Europe/Zurich",
};

function Leaderboard() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (!gameData) {
        setLoading(false);
        return;
      }

      const { data: allGames } = await supabase
        .from("games")
        .select("id")
        .eq("city", gameData.city);

      const gameIds = allGames.map(g => g.id);

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .in("game_id", gameIds);

      const { data: guesses } = await supabase
        .from("guesses")
        .select("*")
        .in("game_id", gameIds);

      const { data: dailyScores } = await supabase
        .from("daily_scores")
        .select("*")
        .eq("city", gameData.city);

      const timezone = CITY_TIMEZONES[gameData.city] || "America/Chicago";
      const playerBest = {};

      players.forEach(player => {
        const playerGuesses = guesses.filter(g => g.player_id === player.id);
        if (playerGuesses.length === 0) return;

        playerGuesses.forEach(g => {
          const username = player.username;
          const playedAt = new Date(g.created_at + "Z").toLocaleString("en-US", {
            timeZone: timezone,
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          if (!playerBest[username] || g.round_score < playerBest[username].total) {
            playerBest[username] = { username, total: g.round_score, playedAt };
          }
        });
      });

      (dailyScores || []).forEach(g => {
        const username = g.username;
        const playedAt = new Date(g.created_at + "Z").toLocaleString("en-US", {
          timeZone: timezone,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        if (!playerBest[username] || g.total_score < playerBest[username].total) {
          playerBest[username] = { username, total: g.total_score, playedAt };
        }
      });

      const sorted = Object.values(playerBest).sort((a, b) => a.total - b.total);

      setGame(gameData);
      setScores(sorted);
      setLoading(false);
    }
    loadLeaderboard();
  }, [gameId]);

  if (loading) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading leaderboard…</div>;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Leaderboard</h1>
      <p style={{ color: "#666", marginBottom: 4 }}>{game?.city} · Best single round</p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>Best round score per player across all {game?.city} games including daily challenges</p>

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
              <div style={{ fontSize: 12, opacity: 0.6 }}>{s.playedAt}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{s.total}</div>
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