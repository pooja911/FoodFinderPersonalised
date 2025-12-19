export default async function handler(req, res) {
  const { lat, lng, cuisine } = req.query;

  if (!lat || !lng || !cuisine) {
    return res.status(400).json({
      error: "lat, lng and cuisine are required",
    });
  }

  try {
    const body = {
      includedTypes: ["restaurant"],
      locationRestriction: {
        circle: {
          center: {
            latitude: Number(lat),
            longitude: Number(lng),
          },
          radius: 10000, // ✅ strict 10 km
        },
      },
    };

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
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

    const cuisineLower = cuisine.toLowerCase();

    const places = (data.places || [])
      // 🔍 filter cuisine manually
      .filter((p) =>
        p.displayName?.text?.toLowerCase().includes(cuisineLower) ||
        p.formattedAddress?.toLowerCase().includes(cuisineLower)
      )
      // 🧹 normalize output
      .map((p) => ({
        name: p.displayName?.text || "Unknown",
        address: p.formattedAddress || "Address not available",
        rating: p.rating ?? 0,
        reviews: p.userRatingCount ?? 0,
        website: p.websiteUri || null,
      }))
      // ⭐ sort best → worst
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviews - a.reviews;
      });

    res.status(200).json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch restaurants",
    });
  }
}
