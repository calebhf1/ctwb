export default async function handler(req, res) {
  const params = new URLSearchParams(req.query).toString();
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}