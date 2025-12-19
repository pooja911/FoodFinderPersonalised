import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.get("/", (req, res) => {
  res.send("Food finder backend is working");
});

app.get("/api/restaurants", async (req, res) => {
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
          radius: 10000, // 10 km
        },
      },
    };

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!data.places) {
      return res.json([]);
    }

    const places = data.places
      .map((p) => ({
        name: p.displayName?.text || "Unknown",
        address: p.formattedAddress || "Address not available",
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? 0,
        website: p.websiteUri || null,
      }))
      // 🔥 Sort best to worst
      .sort((a, b) => {
        if ((b.rating || 0) !== (a.rating || 0)) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return (b.reviews || 0) - (a.reviews || 0);
      });

    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch restaurants from Google Places",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
