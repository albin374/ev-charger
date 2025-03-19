import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
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
  const [selectedStation, setSelectedStation] = useState(null);
  const [error, setError] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Fetch additional details of a station
  const getStationDetails = (placeId, map) => {
    const service = new window.google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
      service.getDetails({ placeId }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve({
            id: place.place_id,
            name: place.name,
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            address: place.formatted_address,
            rating: place.rating || "N/A",
            openingHours: place.opening_hours
              ? place.opening_hours.weekday_text
              : [],
          });
        } else {
          reject("Failed to fetch station details.");
        }
      });
    });
  };

  // Fetch nearby EV charging stations
  const fetchEVStations = async (map) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: defaultCenter,
        radius: 50000, // 50 km radius
        type: "electric_vehicle_charging_station",
      };

      service.nearbySearch(request, async (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Fetch details for each station
          const detailedLocations = await Promise.all(
            results.map((place) => getStationDetails(place.place_id, map))
          );
          setLocations(detailedLocations);
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
        {locations.map((station) => (
          <Marker
            key={station.id}
            position={station.position}
            title={station.name}
            onClick={() => setSelectedStation(station)}
          />
        ))}

        {/* Show Info Window when marker is clicked */}
        {selectedStation && (
          <InfoWindow
            position={selectedStation.position}
            onCloseClick={() => setSelectedStation(null)}
          >
            <div className="text-sm p-2">
              <h3 className="font-bold text-lg">{selectedStation.name}</h3>
              <p>{selectedStation.address}</p>
              <p>⭐ Rating: {selectedStation.rating}</p>
              <div className="mt-2">
                <strong>Opening Hours:</strong>
                {selectedStation.openingHours.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedStation.openingHours.map((hour, index) => (
                      <li key={index}>{hour}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Not available</p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default Map;
