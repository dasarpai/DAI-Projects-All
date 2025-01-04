import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./styles.css";

const App = () => {
  const [issLocation, setIssLocation] = useState({ lat: 0, lng: 0 });
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [distance, setDistance] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const issMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    // Initialize map only if it hasn't been initialized
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Initialize markers
      issMarkerRef.current = L.marker([0, 0], {
        icon: L.divIcon({
          className: "custom-icon",
          html: "🛰️",
          iconSize: [24, 24]
        })
      }).addTo(mapInstanceRef.current);

      userMarkerRef.current = L.marker([0, 0], {
        icon: L.divIcon({
          className: "user-icon",
          html: "📍",
          iconSize: [24, 24]
        })
      }).addTo(mapInstanceRef.current);
    }

    // Get user location
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const newUserLocation = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(newUserLocation);
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([newUserLocation.lat, newUserLocation.lng]);
        }
      },
      (error) => console.error("Error getting user location:", error)
    );

    // Fetch ISS location
    const fetchISSLocation = () => {
      fetch("http://api.open-notify.org/iss-now.json")
        .then((res) => res.json())
        .then((data) => {
          const { latitude, longitude } = data.iss_position;
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);
          setIssLocation({ lat, lng });
          
          if (issMarkerRef.current) {
            issMarkerRef.current.setLatLng([lat, lng]);
          }

          if (userLocation.lat && userLocation.lng) {
            const dist = calculateDistance(lat, lng, userLocation.lat, userLocation.lng);
            setDistance(dist.toFixed(2));
          }
        })
        .catch(error => console.error("Error fetching ISS location:", error));
    };

    // Initial fetch
    fetchISSLocation();

    // Set up interval for updates
    const interval = setInterval(fetchISSLocation, 2000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array since we handle updates internally

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="app">
      <div ref={mapRef} id="map" style={{ height: "100vh", width: "100%" }}></div>
      <div className="overlay">
        <p>Latitude: {issLocation.lat}</p>
        <p>Longitude: {issLocation.lng}</p>
        <p>Distance: {distance} km</p>
      </div>
    </div>
  );
};

export default App;
