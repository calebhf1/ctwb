import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import CITIES from "../cities";

function generateGameId(city) {
  const prefix = city.replace(/\s/g, "").slice(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function CreateGame() {
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleCreate() {
    if (!city) return setError("Please select a city.");
    if (!username.trim()) return setError("Please enter a username.");
    setError("");
    setLoading(true);

    try {
      const gameId = generateGameId(city);
      const allRoutes = CITIES[city];
      const shuffled = [...allRoutes].sort(() => Math.random() - 0.5);
      const routes = shuffled.slice(0, 3);

      const { error: gameError } = await supabase
        .from("games")
        .insert({ id: gameId, city });

      if (gameError) throw gameError;

      const routeRows = routes.map((r, i) => ({
        game_id: gameId,
        round_number: i + 1,
        origin: r.origin,
        destination: r.destination,
      }));

      const { error: routeError } = await supabase
        .from("routes")
        .insert(routeRows);

      if (routeError) throw routeError;

      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({ game_id: gameId, username: username.trim() })
        .select()
        .single();

      if (playerError) throw playerError;

      localStorage.setItem("ctwb_player_id", player.id);
      localStorage.setItem("ctwb_username", username.trim());

      navigate(`/game/${gameId}`);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Create a game</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Pick a city and share the link with friends.</p>

      <p style={{ fontWeight: 500, marginBottom: 8 }}>Your username</p>
      <input
        placeholder="e.g. caleb"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={inputStyle}
      />

      <p style={{ fontWeight: 500, marginBottom: 8 }}>Select a city</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {Object.keys(CITIES).map(c => (
          <button
            key={c}
            onClick={() => setCity(c)}
            style={{
              padding: "12px",
              fontSize: 14,
              borderRadius: 8,
              border: city === c ? "2px solid #111" : "1px solid #ddd",
              background: city === c ? "#111" : "#fff",
              color: city === c ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: city === c ? 600 : 400,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button onClick={handleCreate} disabled={loading} style={btnStyle}>
        {loading ? "Creating…" : "Create game →"}
      </button>
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
  marginBottom: 16,
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
};

export default CreateGame;