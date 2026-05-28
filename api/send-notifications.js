import { createClient } from "@supabase/supabase-js";
import { GoogleAuth } from "google-auth-library";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: subscribers } = await supabase
    .from("push_subscribers")
    .select("token");

  if (!subscribers || subscribers.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  const accessToken = await getAccessToken();

  const message = {
    notification: {
      title: "CTWB Daily Challenge 📅",
      body: "Today's challenge is live — can you top the leaderboard?",
    },
    webpush: {
      fcm_options: {
        link: "https://playctwb.vercel.app/daily",
      },
    },
    tokens: subscribers.map(s => s.token),
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:sendEachForMulticast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    }
  );

  const data = await response.json();
  console.log("FCM response:", JSON.stringify(data));
  res.status(200).json({ sent: data.successCount || 0 });
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