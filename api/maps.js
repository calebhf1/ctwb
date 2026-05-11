export default async function handler(req, res) {
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  if (!key) return res.status(500).json({ error: "Missing API key" });
  const params = new URLSearchParams(req.query);
  params.set("key", key);
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}