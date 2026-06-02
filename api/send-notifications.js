import { createClient } from "@supabase/supabase-js";
import { GoogleAuth } from "google-auth-library";

const DAILY_ROUTES = [
  { date: "2026-05-12", city: "New York" },
  { date: "2026-05-13", city: "Chicago" },
  { date: "2026-05-14", city: "Paris, France" },
  { date: "2026-05-15", city: "London, UK" },
  { date: "2026-05-16", city: "Tokyo, Japan" },
  { date: "2026-05-17", city: "Singapore" },
  { date: "2026-05-18", city: "Miami" },
  { date: "2026-05-20", city: "São Paulo, Brazil" },
  { date: "2026-05-21", city: "Montreal, Canada" },
  { date: "2026-05-22", city: "Copenhagen, Denmark" },
  { date: "2026-05-23", city: "Sydney, Australia" },
  { date: "2026-05-24", city: "Berlin, Germany" },
  { date: "2026-05-25", city: "Mexico City, Mexico" },
  { date: "2026-05-26", city: "Seattle, WA" },
  { date: "2026-05-27", city: "Istanbul, Turkey" },
  { date: "2026-05-28", city: "Buenos Aires, Argentina" },
  { date: "2026-05-29", city: "Chicago" },
  { date: "2026-06-01", city: "Rome, Italy" },
  { date: "2026-06-02", city: "Denver" },
];

function getTodayCity() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const exact = DAILY_ROUTES.find(r => r.date === today);
  if (exact) return exact.city;
  const past = DAILY_ROUTES.filter(r => r.date <= today);
  return past[past.length - 1]?.city || "your city";
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: subscribers } = await supabase
    .from("push_subscribers")
    .select("token");

  if (!subscribers || subscribers.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  const city = getTodayCity();
  const accessToken = await getAccessToken();
  let successCount = 0;

  for (const subscriber of subscribers) {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: subscriber.token,
            notification: {
              title: "CTWB Daily Challenge 📅",
              body: `Today's city is ${city} — can you top the leaderboard?`,
            },
            webpush: {
              fcm_options: {
                link: "https://playctwb.vercel.app/daily",
              },
            },
          },
        }),
      }
    );

    const data = await response.json();
    if (response.ok) successCount++;
  }

  res.status(200).json({ sent: successCount });
}

async function getAccessToken() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}