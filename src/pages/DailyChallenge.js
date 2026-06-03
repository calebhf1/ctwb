import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import React from "react";
import NotificationSignup from "../components/NotificationSignup";

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
  {
    date: "2026-05-14",
    city: "Paris, France",
    origin: "Eiffel Tower, Paris, France",
    destination: "Louvre Museum, Paris, France",
  },
  {
  date: "2026-05-15",
  city: "London, UK",
  origin: "Buckingham Palace, London, UK",
  destination: "London Bridge, London, UK",
},
{
  date: "2026-05-16",
  city: "Tokyo, Japan",
  origin: "Tokyo Tower, Tokyo, Japan",
  destination: "Senso-ji Temple, Tokyo, Japan",
  },
  {
  date: "2026-05-17",
  city: "Singapore",
  origin: "Singapore Changi Airport, Singapore",
  destination: "Gardens by the Bay, Singapore",
},
  {
  date: "2026-05-18",
  city: "Miami",
  origin: "Miami Children's Museum, Miami",
  destination: "LIV Nightclub, Miami",
},
 {
  date: "2026-05-20",
  city: "São Paulo, Brazil",
  origin: "Sé Cathedral, São Paulo, Brazil",
  destination: "São Paulo Museum of Art, São Paulo, Brazil",
},
{
  date: "2026-05-21",
  city: "Montreal, Canada",
  origin: "Old Port of Montreal, Montreal, Canada",
  destination: "Mont Royal Park, Montreal, Canada",
},
{
  date: "2026-05-22",
  city: "Copenhagen, Denmark",
  origin: "Rosenborg Castle, Copenhagen, Denmark",
  destination: "Copenhagen Contemporary, Copenhagen, Denmark",
},
{
  date: "2026-05-23",
  city: "Sydney, Australia",
  origin: "Sydney Opera House, Sydney, Australia",
  destination: "Bondi Beach, Sydney, Australia",
},
{
  date: "2026-05-24",
  city: "Berlin, Germany",
  origin: "Brandenburg Gate, Berlin, Germany",
  destination: "East Side Gallery, Berlin, Germany",
},
{
  date: "2026-05-25",
  city: "Mexico City, Mexico",
  origin: "Zócalo, Mexico City, Mexico",
  destination: "Chapultepec Castle, Mexico City, Mexico",
},
{
  date: "2026-05-26",
  city: "Seattle, WA",
  origin: "Pike Place Market, Seattle, WA",
  destination: "Capitol Hill Station, Seattle, WA",
},
{
  date: "2026-05-27",
  city: "Istanbul, Turkey",
  origin: "Hagia Sophia, Istanbul, Turkey",
  destination: "Galata Tower, Istanbul, Turkey",
},
{
  date: "2026-05-28",
  city: "Buenos Aires, Argentina",
  origin: "Plaza de Mayo, Buenos Aires, Argentina",
  destination: "La Bombonera Stadium, Buenos Aires, Argentina",
},
{
  date: "2026-05-29",
  city: "Chicago",
  origin: "Daley Plaza, Chicago",
  destination: "Wrigley Field, Chicago",
},
{
  date: "2026-06-01",
  city: "Rome, Italy",
  origin: "Trevi Fountain, Rome, Italy",
  destination: "Colosseum, Rome, Italy",
},
{
  date: "2026-06-02",
  city: "Denver",
  origin: "Colorado State Capitol, Denver",
  destination: "Denver Zoo, Denver",
},
{
  date: "2026-06-03",
  city: "Washington DC",
  origin: "Lincoln Memorial, Washington DC",
  destination: "U.S. Capitol, Washington DC",
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
  "Paris, France": "Europe/Paris",
  "London, UK": "Europe/London",
  "Tokyo, Japan": "Asia/Tokyo",
  "Singapore": "Asia/Singapore",
  "São Paulo, Brazil": "America/Sao_Paulo",
  "Montreal, Canada": "America/Toronto",
  "Copenhagen, Denmark": "Europe/Copenhagen",
  "Sydney, Australia": "Australia/Sydney",
  "Berlin, Germany": "Europe/Berlin",
  "Mexico City, Mexico": "America/Mexico_City",
  "Seattle, WA": "America/Los_Angeles",
  "Istanbul, Turkey": "Europe/Istanbul",
  "Buenos Aires, Argentina": "America/Argentina/Buenos_Aires",
  "Rome, Italy": "Europe/Rome",
  "Denver": "America/Denver",
};

function IOSInstallBanner() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
  const isStandalone = window.navigator.standalone === true;
  const [dismissed, setDismissed] = useState(localStorage.getItem("ctwb_ios_banner_dismissed") === "true");

  if (!isIOS || isStandalone || dismissed) return null;

  return (
    <div style={{ background: "#f0f4ff", border: "1px solid #c0d0ff", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ fontWeight: 600, marginBottom: 6, color: "#1a3a8a" }}>📱 Get daily notifications on iPhone</p>
        <button onClick={() => { localStorage.setItem("ctwb_ios_banner_dismissed", "true"); setDismissed(true); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#999", padding: 0, marginLeft: 8 }}>✕</button>
      </div>
      <p style={{ color: "#444", marginBottom: 0, lineHeight: 1.5 }}>
        Tap <strong>⋯</strong> → <strong>Share</strong> → scroll down → <strong>"Add to Home Screen"</strong>. Then open CTWB from your home screen and after playing today's challenge tap "Notify me tomorrow".
      </p>
    </div>
  );
}

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

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTodayRoute() {
  const today = getTodayDate();
  const exact = DAILY_ROUTES.find(r => r.date === today);
  if (exact) return exact;
  const past = DAILY_ROUTES.filter(r => r.date <= today);
  return past[past.length - 1] || DAILY_ROUTES[0];
}

async function fetchTravelTime(origin, destination, mode, departureTime) {
  const params = new URLSearchParams({ origins: origin, destinations: destination, mode });
  if (departureTime && mode === "driving") {
    const now = Math.floor(Date.now() / 1000);
    const time = departureTime > now ? departureTime : now;
    params.set("departure_time", time);
  }
  const response = await fetch(`/api/maps?${params}`);
  const data = await response.json();
  const element = data?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;
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
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translateY(-50%)", width: 2, height: "100%", background: "rgba(255,255,255,0.5)" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: "#3b82f6", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", zIndex: 1 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: 4 }}>
        <span>too low</span><span>🎯 perfect</span><span>too high</span>
      </div>
    </div>
  );
}

function RouteMap({ origin, destination }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const boundsRef = React.useRef(null);
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  React.useEffect(() => {
    if (!mapRef.current) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = async function () {
      const geocoder = new window.google.maps.Geocoder();
      const geocode = (address) => new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK") resolve(results[0].geometry.location);
          else resolve(null);
        });
      });

      const [originLatLng, destLatLng] = await Promise.all([geocode(origin), geocode(destination)]);
      if (!originLatLng || !destLatLng) return;

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(originLatLng);
      bounds.extend(destLatLng);
      boundsRef.current = bounds;

      const map = new window.google.maps.Map(mapRef.current, {
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        scaleControl: true,
      });

      mapInstanceRef.current = map;
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      new window.google.maps.Marker({ position: originLatLng, map, label: { text: "A", color: "white" }, title: origin });
      new window.google.maps.Marker({ position: destLatLng, map, label: { text: "B", color: "white" }, title: destination });
    };

    document.head.appendChild(script);
    return () => { document.head.removeChild(script); delete window.initMap; };
  }, [origin, destination, key]);

  function handleReset() {
    if (mapInstanceRef.current && boundsRef.current) {
      mapInstanceRef.current.fitBounds(boundsRef.current, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div ref={mapRef} style={{ width: "100%", height: 350, borderRadius: "8px 8px 0 0", background: "#f0f0f0" }} />
      <button onClick={handleReset} style={{ width: "100%", padding: "8px", fontSize: 13, fontWeight: 500, background: "#f5f5f5", color: "#444", border: "1px solid #ddd", borderTop: "none", borderRadius: "0 0 8px 8px", cursor: "pointer" }}>
        ↩ Reset view
      </button>
    </div>
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
      <div style={{ background: "#fff", borderRadius: 8, padding: "16px", fontFamily: "monospace", fontSize: 14, lineHeight: 1.9, marginBottom: 12, whiteSpace: "pre", color: "#111", overflowX: "auto" }}>
        {text}
      </div>
      <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{ width: "100%", padding: "10px", fontSize: 14, fontWeight: 600, background: copied ? "#1a7a4a" : "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
        {copied ? "✓ Copied!" : "Copy results"}
      </button>
    </div>
  );
}

async function generateLocalRoute(lat, lng, city) {
  const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary("places");
  const request = {
    fields: ["displayName", "location"],
    locationRestriction: { center: { lat, lng }, radius: 15000 },
    includedPrimaryTypes: ["tourist_attraction"],
    maxResultCount: 20,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
  };
  const { places } = await Place.searchNearby(request);
  if (!places || places.length < 2) return null;
  const shuffledFirst = places.slice(0, 10).sort(() => Math.random() - 0.5);
  const shuffledSecond = places.slice(10).sort(() => Math.random() - 0.5);
  const origin = shuffledFirst[0];
  const destination = shuffledSecond[0] || shuffledFirst[1];
  return {
    origin: origin.displayName + ", " + city,
    destination: destination.displayName + ", " + city,
  };
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const route = getTodayRoute();
  const todayDate = getTodayDate();
  const storageKey = `ctwb_daily_${todayDate}_${route.city.replace(/[^a-z]/gi, '')}`;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const savedResult = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
  })();

  const [username, setUsername] = useState(localStorage.getItem("ctwb_daily_username") || "");
  const [usernameInput, setUsernameInput] = useState("");
  const [guesses, setGuesses] = useState(savedResult?.guesses || {
    driving: { h: "", m: "" }, transit: { h: "", m: "" },
    walking: { h: "", m: "" }, bicycling: { h: "", m: "" },
  });
  const [actuals, setActuals] = useState(savedResult?.actuals || null);
  const [totalScore, setTotalScore] = useState(savedResult?.totalScore ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoursWarning, setHoursWarning] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [viewingBoard, setViewingBoard] = useState(false);

  const [detectedCity, setDetectedCity] = useState(null);
  const [detectedLat, setDetectedLat] = useState(null);
  const [detectedLng, setDetectedLng] = useState(null);

  const [localChallenge, setLocalChallenge] = useState(null);
  const [showLocalPrompt, setShowLocalPrompt] = useState(!!savedResult?.actuals);
  const [playingLocal, setPlayingLocal] = useState(false);
  const [localGuesses, setLocalGuesses] = useState({
    driving: { h: "", m: "" }, transit: { h: "", m: "" },
    walking: { h: "", m: "" }, bicycling: { h: "", m: "" },
  });
  const [localActuals, setLocalActuals] = useState(null);
  const [localScore, setLocalScore] = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localLeaderboard, setLocalLeaderboard] = useState([]);

  useEffect(() => {
    loadLeaderboard();
    detectLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function detectLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      console.log("Detected city:", data.city);
      setDetectedCity(data.city);
      setDetectedLat(data.latitude);
      setDetectedLng(data.longitude);
    } catch (e) {
      console.error("Could not detect location", e);
    }
  }

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

  async function loadLocalLeaderboard(city) {
    const { data } = await supabase
      .from("local_scores")
      .select("username, total_score")
      .eq("date", todayDate)
      .eq("city", city)
      .order("total_score", { ascending: true })
      .limit(10);
    setLocalLeaderboard(data || []);
  }

  async function handleStartLocal() {
    if (!detectedCity || !detectedLat || !detectedLng) return;

    const { data: existing } = await supabase
      .from("local_challenges")
      .select("*")
      .eq("date", todayDate)
      .eq("city", detectedCity)
      .maybeSingle();

    if (existing) {
      setLocalChallenge(existing);
      await loadLocalLeaderboard(detectedCity);
      setPlayingLocal(true);
      return;
    }

    const generated = await generateLocalRoute(detectedLat, detectedLng, detectedCity);
    if (!generated) {
      alert("Couldn't find landmarks in your city. Try again later!");
      return;
    }

    const { data: created } = await supabase
      .from("local_challenges")
      .insert({
        date: todayDate,
        city: detectedCity,
        origin: generated.origin,
        destination: generated.destination,
        lat: detectedLat,
        lng: detectedLng,
      })
      .select()
      .single();

    setLocalChallenge(created);
    await loadLocalLeaderboard(detectedCity);
    setPlayingLocal(true);
  }

  async function handleSubmitLocal() {
    for (const m of MODES) {
      const total = toMinutes(localGuesses[m.key].h, localGuesses[m.key].m);
      if (total === 0) return setLocalError(`Enter a guess for ${m.label}.`);
    }
    setLocalError("");
    setLocalSubmitting(true);

    try {
      const results = await fetchAllModes(localChallenge.origin, localChallenge.destination);
      const score = MODES.reduce((sum, m) => {
        if (results[m.key] === null) return sum;
        return sum + calcScore(toMinutes(localGuesses[m.key].h, localGuesses[m.key].m), results[m.key]);
      }, 0);

      await supabase.from("local_scores").insert({
        username, date: todayDate, city: detectedCity,
        origin: localChallenge.origin, destination: localChallenge.destination,
        driving_guess:  toMinutes(localGuesses.driving.h,   localGuesses.driving.m),
        transit_guess:  toMinutes(localGuesses.transit.h,   localGuesses.transit.m),
        walking_guess:  toMinutes(localGuesses.walking.h,   localGuesses.walking.m),
        cycling_guess:  toMinutes(localGuesses.bicycling.h, localGuesses.bicycling.m),
        driving_actual: results.driving, transit_actual: results.transit,
        walking_actual: results.walking, cycling_actual: results.bicycling,
        total_score: score,
      });

      setLocalActuals(results);
      setLocalScore(score);
      await loadLocalLeaderboard(detectedCity);
    } catch (e) {
      console.error(e);
      setLocalError("Something went wrong. Please try again.");
    }
    setLocalSubmitting(false);
  }

  function handleSetUsername() {
    if (!usernameInput.trim()) return setError("Please enter a username.");
    localStorage.setItem("ctwb_daily_username", usernameInput.trim());
    setUsername(usernameInput.trim());
    setError("");
  }

  async function handleSubmit() {
    const highHours = MODES.some(m => parseInt(guesses[m.key].h) > 10);
    if (highHours && !hoursWarning) {
      setHoursWarning(true);
      return;
    }
    setHoursWarning(false);

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
        username, date: todayDate, city: route.city,
        origin: route.origin, destination: route.destination,
        driving_guess:  toMinutes(guesses.driving.h,   guesses.driving.m),
        transit_guess:  toMinutes(guesses.transit.h,   guesses.transit.m),
        walking_guess:  toMinutes(guesses.walking.h,   guesses.walking.m),
        cycling_guess:  toMinutes(guesses.bicycling.h, guesses.bicycling.m),
        driving_actual: results.driving, transit_actual: results.transit,
        walking_actual: results.walking, cycling_actual: results.bicycling,
        total_score: score,
      });

      setActuals(results);
      setTotalScore(score);
      localStorage.setItem(storageKey, JSON.stringify({ guesses, actuals: results, totalScore: score }));
      await loadLeaderboard();
      setShowLocalPrompt(true);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (playingLocal && localChallenge) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => setPlayingLocal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Play in {detectedCity}</h1>
        </div>
        <p style={{ color: "#666", marginBottom: 16 }}>{today} · Local challenge</p>

        <p style={{ fontWeight: 500, marginBottom: 4 }}>Route</p>
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>{localChallenge.origin} → {localChallenge.destination}</p>
        <RouteMap origin={localChallenge.origin} destination={localChallenge.destination} />

        {!localActuals ? (
          <>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
              <span>🕐</span>
              <span>Local time in {detectedCity}: <strong style={{ color: "#111" }}>{getCityTime(detectedCity)}</strong></span>
            </div>
            <p style={{ fontWeight: 500, marginBottom: 12 }}>Your guesses:</p>
            {MODES.map(m => (
              <div key={m.key} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
                <span style={{ width: 90 }}>{m.emoji} {m.label}</span>
                <input type="number" min="0" placeholder="0" value={localGuesses[m.key].h}
                  onChange={e => setLocalGuesses({ ...localGuesses, [m.key]: { ...localGuesses[m.key], h: e.target.value } })}
                  style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
                <span style={{ color: "#999", fontSize: 13 }}>hr</span>
                <input type="number" min="0" max="59" placeholder="0" value={localGuesses[m.key].m}
                  onChange={e => setLocalGuesses({ ...localGuesses, [m.key]: { ...localGuesses[m.key], m: e.target.value } })}
                  style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
                <span style={{ color: "#999", fontSize: 13 }}>min</span>
              </div>
            ))}
            {localError && <p style={{ color: "red", fontSize: 13 }}>{localError}</p>}
            <button onClick={handleSubmitLocal} disabled={localSubmitting} style={btnStyle}>
              {localSubmitting ? "Looking up times…" : "Submit guesses"}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 500, marginBottom: 16 }}>{localChallenge.origin} → {localChallenge.destination}</p>
            {MODES.map(m => {
              const actual = localActuals[m.key];
              const guess = toMinutes(localGuesses[m.key].h, localGuesses[m.key].m);
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
              <div style={{ fontSize: 13, marginBottom: 4, color: "#aaa" }}>{detectedCity} score</div>
              <div style={{ fontSize: 48, fontWeight: 600 }}>{localScore}</div>
              <div style={{ fontSize: 14, color: "#aaa", marginTop: 6 }}>{getScoreMessage(localScore)}</div>
            </div>

            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{detectedCity} leaderboard today</p>
            {localLeaderboard.map((s, i) => (
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
            {localLeaderboard.length === 0 && <p style={{ color: "#999" }}>You're the first to play in {detectedCity} today!</p>}

            <button onClick={() => navigate('/')} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 8 }}>
              ← Back to home
            </button>
          </>
        )}
      </div>
    );
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
        {!loadingBoard && leaderboard.length === 0 && <p style={{ color: "#999" }}>No scores yet today — be the first!</p>}
        {!loadingBoard && leaderboard.map((s, i) => (
          <div key={s.username + i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{medals[i] || `${i + 1}.`}</span>
              <span style={{ fontWeight: 600 }}>{s.username}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{s.total_score}</span>
          </div>
        ))}
        <button onClick={() => setViewingBoard(false)} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 16 }}>← Back</button>
      </div>
    );
  }

  if (!username) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "'Georgia', serif", padding: "0 20px", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 20, borderBottom: "1px solid #e0e0e0", marginBottom: 24 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "#999", marginBottom: 8, fontFamily: "sans-serif" }}>Daily Challenge</div>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { emoji: "🗺️", label: "See the route" },
            { emoji: "⏱️", label: "Guess the times" },
            { emoji: "📊", label: "Get your score" },
            { emoji: "🏆", label: "Beat the leaderboard" },
          ].map(s => (
            <div key={s.label} style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px", display: "flex", alignItems: "center", gap: 10, fontFamily: "sans-serif", fontSize: 13, color: "#444" }}>
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
        <input placeholder="e.g. Lily" value={usernameInput}
          onChange={e => setUsernameInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSetUsername()}
          style={inputStyle} />
        {error && <p style={{ color: "red", fontSize: 13, fontFamily: "sans-serif" }}>{error}</p>}
        <button onClick={handleSetUsername} style={{ ...btnStyle, fontSize: 17, padding: "14px" }}>Let's play →</button>
        <button onClick={() => setViewingBoard(true)} style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #ddd", marginTop: 8, fontFamily: "sans-serif" }}>
          📊 View today's leaderboard
        </button>
      </div>
    );
  }

  const localPromptCity = detectedCity && detectedCity !== route.city ? detectedCity : null;

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
      <IOSInstallBanner />

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
        <div style={{ background: "#fff8e6", border: "1px solid #f0d060", borderRadius: 8, padding: "10px 16px", marginBottom: 12, fontSize: 13, color: "#7a5a00", display: "flex", alignItems: "center", gap: 8 }}>
          <span>⏰</span>
          <span>Today's times are fixed at <strong>8:30am local time</strong> — think rush hour!</span>
        </div>
      )}
      <RouteMap origin={route.origin} destination={route.destination} />

      {!actuals ? (
        <>
          <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
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

          {hoursWarning && (
            <div style={{ background: "#fff8e6", border: "1px solid #f0d060", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#7a5a00" }}>
                ⚠️ Did you mean minutes?
              </p>
              <p style={{ fontSize: 13, color: "#7a5a00", marginBottom: 12 }}>
                One of your guesses is over 10 hours — that seems high! Did you accidentally enter minutes in the hours box?
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setHoursWarning(false); handleSubmit(); }}
                  style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 600, background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  No, it's correct
                </button>
                <button onClick={() => setHoursWarning(false)}
                  style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 600, background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>
                  Let me fix it
                </button>
              </div>
            </div>
          )}

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

          <ResultsCard route={route} score={totalScore} actuals={actuals} guesses={guesses} today={today} />
          <IOSInstallBanner />
          <NotificationSignup username={username} />

          {showLocalPrompt && (
            <div style={{ background: "#f0f9f4", border: "1px solid #c3e6d4", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>🌆 Now play in your city!</p>
              {localPromptCity ? (
                <>
                  <p style={{ fontSize: 14, color: "#444", marginBottom: 16 }}>
                    We detected you're in <strong>{localPromptCity}</strong>. Want to try a local route and compete with others there today?
                  </p>
                  <button onClick={handleStartLocal} style={{ ...btnStyle, background: "#1a7a4a", marginTop: 0 }}>
                    Play in {localPromptCity} →
                  </button>
                  <p style={{ fontSize: 13, color: "#999", marginTop: 8, marginBottom: 4 }}>Not your city?</p>
                  <input
                    placeholder="Enter your city (e.g. Portland, Maine)"
                    style={{ ...inputStyle, marginBottom: 8 }}
                    onChange={e => setDetectedCity(e.target.value)}
                  />
                  <button onClick={handleStartLocal} style={{ ...btnStyle, background: "#1a7a4a", marginTop: 0 }}>
                    Play here instead →
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: "#444", marginBottom: 12 }}>
                    Play a route in your city and compete with locals today!
                  </p>
                  <input
                    placeholder="Enter your city (e.g. Portland, Maine)"
                    style={{ ...inputStyle, marginBottom: 8 }}
                    onChange={e => setDetectedCity(e.target.value)}
                  />
                  <button onClick={handleStartLocal} style={{ ...btnStyle, background: "#1a7a4a", marginTop: 0 }}>
                    Play in my city →
                  </button>
                </>
              )}
              <button onClick={() => setShowLocalPrompt(false)} style={{ ...btnStyle, background: "#fff", color: "#999", border: "none", marginTop: 4, fontSize: 13 }}>
                No thanks
              </button>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>Today's leaderboard</p>
              <button onClick={loadLeaderboard} style={{ fontSize: 12, color: "#666", background: "none", border: "none", cursor: "pointer" }}>Refresh</button>
            </div>
            {loadingBoard && <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>}
            {!loadingBoard && leaderboard.length === 0 && <p style={{ color: "#999" }}>No scores yet — you're the first!</p>}
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