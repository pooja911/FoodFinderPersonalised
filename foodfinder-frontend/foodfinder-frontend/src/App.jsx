import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import "./App.css";

const cuisines = ["indian", "italian", "chinese", "mexican"];

/* -----------------------------
   DISTANCE (HAVERSINE FORMULA)
------------------------------ */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  // const [accuracy, setAccuracy] = useState(null);

  const [cuisine, setCuisine] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     GOOGLE MAP LOADER
  ------------------------------ */
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  function openDirections(restaurant) {
    if (!location) return;

    const origin = `${location.lat},${location.lng}`;

    // Use address if available, fallback to name
    const destination = encodeURIComponent(
      restaurant.address || restaurant.name
    );

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    window.open(url, "_blank");
  }

  /* -----------------------------
     REVERSE GEOCODING (AREA LEVEL)
  ------------------------------ */
  async function fetchLocationName(lat, lng) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    const a = data.address || {};

    const area = a.suburb || a.neighbourhood || a.city || "";
    const city = a.city || a.town || "";
    const country = a.country || "";

    setLocationLabel(`Near ${area}, ${city}, ${country}`);
  }

  /* -----------------------------
     FETCH RESTAURANTS
  ------------------------------ */
  async function fetchRestaurants(selectedCuisine, lat, lng) {
    if (!location && (!lat || !lng)) return;

    setLoading(true);
    setCuisine(selectedCuisine);

    const baseLat = lat ?? location.lat;
    const baseLng = lng ?? location.lng;

    const url = `${
      import.meta.env.VITE_API_BASE
    }/api/restaurants?lat=${baseLat}&lng=${baseLng}&cuisine=${selectedCuisine}`;

    const res = await fetch(url);
    const data = await res.json();

    // Add distance
    const enriched = data.map((r) => ({
      ...r,
      distance: getDistanceKm(baseLat, baseLng, r.lat, r.lng),
    }));

    setRestaurants(enriched);
    setLoading(false);
  }

  /* -----------------------------
     GET USER LOCATION
  ------------------------------ */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({ lat, lng });
        // setAccuracy(pos.coords.accuracy);
        fetchLocationName(lat, lng);

        // Auto-load default cuisine
        setCuisine("indian");
        fetchRestaurants("indian", lat, lng);
      },
      () => alert("Location permission required"),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="hero">
        <h1>🍽 Food Finder</h1>
        <p className="subtitle">Discover top-rated places near you</p>

        {locationLabel && (
          <div className="location-pill">
            📍 {locationLabel}
            {/* {accuracy && <span> · ±{Math.round(accuracy / 1000)} km</span>} */}
          </div>
        )}
      </header>

      {/* CUISINE CHIPS */}
      <div className="cuisine-row">
        {cuisines.map((c) => (
          <button
            key={c}
            className={`chip ${cuisine === c ? "active" : ""}`}
            onClick={() => fetchRestaurants(c, location.lat, location.lng)}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAP */}
      {isLoaded && location && (
        <div className="map-container">
          <GoogleMap
            center={{ lat: location.lat, lng: location.lng }}
            zoom={14}
            mapContainerStyle={{
              width: "100%",
              height: "360px",
            }}
          >
            {/* User marker */}
            <Marker
              position={{
                lat: location.lat,
                lng: location.lng,
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />

            {/* Restaurant markers */}
            {restaurants.map((r, i) => (
              <Marker
                key={i}
                position={{ lat: r.lat, lng: r.lng }}
                title={r.name}
              />
            ))}
          </GoogleMap>
        </div>
      )}

      {/* STATES */}
      {loading && <p className="status">Finding best places…</p>}

      {/* CARDS */}
      <div className="cards">
        {restaurants.map((r, i) => (
          <div className="card" key={i}>
            <div className="card-non-act">
              <div className="card-top">
                <h3>{r.name}</h3>
                <span className="rating-badge">⭐ {r.rating}</span>
              </div>

              <p className="reviews">
                {r.reviews} reviews · {r.distance.toFixed(1)} km away
              </p>

              <p className="address">{r.address}</p>
            </div>
            <div className="actions">
              <div className="act-btn">
                {r.website && (
                  <a href={r.website} target="_blank" rel="noreferrer">
                    Website →
                  </a>
                )}
                <button
                  onClick={() => openDirections(r)}
                  style={{
                    marginTop: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  🧭 Open Directions
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <footer className="footer">
        © {new Date().getFullYear()} Pooja Garg. All rights reserved.
      </footer>
    </div>
  );
}
