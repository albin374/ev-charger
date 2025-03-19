import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

// Map Container Style
const containerStyle = {
  width: "100%",
  height: "500px", // Fixed height to avoid empty space
};

// Center coordinates in Kerala, India (Thiruvananthapuram)
const defaultCenter = {
  lat: 8.5241,
  lng: 76.9366,
};

const Map = () => {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Fetch nearby EV charging stations
  const fetchEVStations = (map) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: defaultCenter,
        radius: 50000, // 50 km radius
        type: "electric_vehicle_charging_station", // Correct type for EV stations
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setLocations(results);
        } else {
          setError("Failed to fetch EV stations.");
        }
      });
    } else {
      setError("Google Places API is not available.");
    }
  };

  useEffect(() => {
    if (isLoaded) {
      // Create a temporary map to run the Places API
      const map = new window.google.maps.Map(document.createElement("div"), {
        center: defaultCenter,
        zoom: 12,
      });
      fetchEVStations(map);
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return <div className="text-center mt-10">Loading map...</div>;
  }

  return (
    <div className="flex justify-center mt-5">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
      >
        {/* Show EV Station Markers */}
        {locations.map((place) => (
          <Marker
            key={place.place_id}
            position={{
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            }}
            title={place.name}
          />
        ))}
      </GoogleMap>

      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default Map;
