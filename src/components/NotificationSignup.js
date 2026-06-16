import { useState } from "react";
import { messaging, getToken, VAPID_KEY } from "../firebase";
import supabase from "../supabase";

export default function NotificationSignup({ username }) {
  const [status, setStatus] = useState("idle");

  async function handleEnable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await supabase.from("push_subscribers").upsert({ token, username });
        setStatus("granted");
      }
    } catch (e) {
      console.error(e);
      setStatus("unsupported");
    }
  }

  if (status === "granted") {
    return (
      <div style={{ background: "#f0f9f4", border: "1px solid #c3e6d4", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#1a7a4a" }}>
        ✓ You'll get a notification tomorrow at 9am!
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#b03030" }}>
        Notifications blocked — enable them in your browser settings.
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#666" }}>
        Push notifications aren't supported on this device. Try adding CTWB to your home screen first!
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "16px", marginBottom: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, margin: 0 }}>🔔 Get tomorrow's challenge delivered</p>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12, marginTop: 6 }}>
        We'll notify you at 9am when the new route drops.
        {" "}<strong>iPhone users:</strong> add CTWB to your home screen first.
      </p>
      <button
        onClick={handleEnable}
        disabled={status === "loading"}
        style={{ width: "100%", padding: "10px", fontSize: 14, fontWeight: 600, background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
      >
        {status === "loading" ? "Setting up…" : "🔔 Notify me tomorrow"}
      </button>
    </div>
  );
}