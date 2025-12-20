import { useEffect, useState } from "react";
import "./App.css";

const cuisines = ["indian", "italian", "chinese", "mexican"];

export default function App() {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  const [cuisine, setCuisine] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

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

  async function fetchRestaurants(selectedCuisine) {
    if (!location) return;

    setCuisine(selectedCuisine);
    setLoading(true);

    const url = `${import.meta.env.VITE_API_BASE}/api/restaurants?lat=${
      location.lat
    }&lng=${location.lng}&cuisine=${selectedCuisine}`;
    const res = await fetch(url);
    const data = await res.json();

    setRestaurants(data);
    setLoading(false);
  }
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({ lat, lng });
        setAccuracy(pos.coords.accuracy);
        fetchLocationName(lat, lng);
      },
      () => alert("Location permission required"),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="app">
      {/* HERO */}
      <header className="hero">
        <h1>Food Finder</h1>
        <p className="subtitle">Discover top-rated places near you</p>

        {locationLabel && (
          <div className="location-pill">
            📍 {locationLabel}
            {accuracy && <span> · ±{Math.round(accuracy / 1000)} km</span>}
          </div>
        )}
      </header>

      {/* CUISINES */}
      <div className="cuisine-row">
        {cuisines.map((c) => (
          <button
            key={c}
            className={`chip ${cuisine === c ? "active" : ""}`}
            onClick={() => fetchRestaurants(c)}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* STATES */}
      {loading && <p className="status">Finding best places…</p>}

      {!loading && cuisine && restaurants.length === 0 && (
        <p className="status">No restaurants found nearby.</p>
      )}

      {/* CARDS */}
      <div className="cards">
        {restaurants.map((r, i) => (
          <div className="card" key={i}>
            <div className="card-top">
              <h3>{r.name}</h3>
              <span className="rating-badge">⭐ {r.rating}</span>
            </div>

            <p className="reviews">{r.reviews} reviews</p>
            <p className="address">{r.address}</p>

            {r.website && (
              <a
                href={r.website}
                target="_blank"
                rel="noreferrer"
                className="cta"
              >
                View Website →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
