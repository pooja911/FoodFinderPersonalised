export default async function handler(req, res) {
  const { lat, lng, cuisine } = req.query;

  if (!lat || !lng || !cuisine) {
    return res.status(400).json({
      error: "lat, lng and cuisine are required",
    });
  }

  try {
    const body = {
      textQuery: `${cuisine} restaurant`,
      locationBias: {
        circle: {
          center: {
            latitude: Number(lat),
            longitude: Number(lng),
          },
          radius: 10000,
        },
      },
    };

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    res.status(200).json(data.places || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
}
