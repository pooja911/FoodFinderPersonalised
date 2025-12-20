import { useEffect, useState } from "react";

const cuisines = ["indian", "italian", "chinese", "mexican"];

function App() {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  // const [accuracy, setAccuracy] = useState(null);

  const [cuisine, setCuisine] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // setAccuracy(pos.coords.accuracy); // meters
        setLocation({ lat, lng });

        fetchLocationName(lat, lng);
      },
      () => {
        setError("Location access denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  async function fetchLocationName(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const a = data.address || {};

      const area =
        // a.house_number ||
        a.road ||
        
        a.neighbourhood ||
        a.quarter ||
        a.residential ||
        "";

      const city = a.city || a.town || a.village || "";
      const state = a.state || "";
      const country = a.country || "";

      const label = `Near ${area || city}, ${city || state}, ${country}`;
      setLocationLabel(label);
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  }

  async function fetchRestaurants(selectedCuisine) {
    if (!location) return;

    setLoading(true);
    setError("");

    try {
      const url = `${import.meta.env.VITE_API_BASE}/api/restaurants?lat=${
        location.lat
      }&lng=${location.lng}&cuisine=${selectedCuisine}`;

      const res = await fetch(url);
      const data = await res.json();

      setRestaurants(data);
    } catch (err) {
      console.log(err);
      setError("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        maxWidth: "720px",
        margin: "auto",
      }}
    >
      <h1>🍽️ Food Finder</h1>

      {/* Location */}
      {!location && !error && <p>Detecting your location…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {location && (
        <>
          <p style={{ color: "#555", marginBottom: "4px" }}>
            📍 <strong>{locationLabel}</strong>
          </p>

          {/* {accuracy && (
            <p style={{ fontSize: "0.9em", color: "#777" }}>
              Location accuracy: ±{Math.round(accuracy)} meters
            </p>
          )} */}
        </>
      )}

      {/* Cuisine selector */}
      {location && (
        <select
          value={cuisine}
          onChange={(e) => {
            setCuisine(e.target.value);
            fetchRestaurants(e.target.value);
          }}
          style={{ padding: "8px", marginTop: "12px" }}
        >
          <option value="">Select Cuisine</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>
      )}

      {/* Loading / results */}
      {loading && <p>Loading restaurants…</p>}

      {!loading && cuisine && restaurants.length === 0 && (
        <p>No restaurants found nearby.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {restaurants.map((r, i) => (
          <li
            key={i}
            style={{
              background: "#fff",
              padding: "14px",
              marginTop: "12px",
              borderRadius: "8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <strong>{r.name}</strong>
            <br />⭐ {r.rating} ({r.reviews} reviews)
            <br />
            <span style={{ color: "#555" }}>{r.address}</span>
            <br />
            {r.website && (
              <a href={r.website} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
