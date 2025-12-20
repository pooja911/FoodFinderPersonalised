import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/restaurants", async (req, res) => {
  const { lat, lng, cuisine } = req.query;

  if (!lat || !lng || !cuisine) {
    return res.status(400).json({
      error: "lat, lng and cuisine are required",
    });
  }

  try {
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
        body: JSON.stringify({
          textQuery: `${cuisine} restaurant`,
          locationBias: {
            circle: {
              center: {
                latitude: Number(lat),
                longitude: Number(lng),
              },
              radius: 10000, // ✅ 10 km
            },
          },
        }),
      }
    );

    const data = await response.json();

    const places = (data.places || [])
      .map((p) => ({
        name: p.displayName?.text || "Unknown",
        address: p.formattedAddress || "Address not available",
        rating: p.rating ?? 0,
        reviews: p.userRatingCount ?? 0,
        website: p.websiteUri || null,
      }))
      // ✅ sort by rating, then reviews
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviews - a.reviews;
      });

    res.status(200).json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch restaurants  from Google Places",
    });
  }
});

export default app;
