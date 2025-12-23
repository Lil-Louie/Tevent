import React, { useState, useEffect } from "react";
import { FaSearch, FaHeart, FaRegHeart } from "react-icons/fa";
import { getDistanceFromLatLng } from "../utils/distanceUtils";
import { fetchCoordinates } from "../utils/locationUtils";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from 'react-toastify';
import { filterByDate } from "../utils/dateUtils";
import Fuse from "fuse.js";
import "bootstrap/dist/css/bootstrap.min.css";
import '../styles/EventSearch.css'; 


import AutocompleteInput from "../components/AutocompleteInput";
import Modal from "../components/Modal";
import MapWithMarkers from "../components/MapWithMarkers";
import { filterByAudience } from "../utils/audienceUtils";
import fakeEvents from "../Fakedata/fakeEvents";


function formatDisplayDate(isoString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(isoString).toLocaleDateString(undefined, options);
}


const EventSearch = ({ isLoaded }) => {
  const { user, isAuthenticated } = useAuth0(); // Make sure to destructure `user` from useAuth0

  const [coordinates, setCoordinates] = useState({ lat: 38.4404, lng: -122.7141 });
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [category, setCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  // Replace distanceFilter default with 0 or a string:
  // Let's use 0 to represent "no limit."
  const [distanceFilter, setDistanceFilter] = useState(0);
  const [locationInput, setLocationInput] = useState("");
  const [activeEvent, setActiveEvent] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [allEvents, setAllEvents] = useState([]);


  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFilteredEvents([]);
      setFavorites([]);
      setShowOnlyFavorites(false);
      setSearchInput("");
      setCategory("");
      setDateFilter("");
      setDistanceFilter(0);
      setAudienceFilter("");
      setActiveEvent(null);
      setHasSearched(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/events`
        );
        if (!response.ok) throw new Error("Failed to fetch events");
  
        const data = await response.json();
  
        // ✅ Normalize Mongo _id → id (strings)
        const normalized = data.map((event) => ({
          ...event,
          id: String(event._id),
        }));
  
        setAllEvents(normalized);
        setFilteredEvents(normalized);
      } catch (err) {
        console.error("Error loading events:", err);
        toast.error("Failed to load events from server.");
      }
    };
  
    fetchEvents();
  }, []);
  

  const toggleFavorite = async (eventId) => {
    if (!isAuthenticated) {
      toast.error("Must be signed in to favorite events");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth0Id: user.sub, 
          eventId,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to toggle favorite");
  
      const result = await response.json();
  
      setFavorites(result.updatedFavorites);
      toast.success(result.message);
  
    } catch (err) {
      console.error("Toggle favorite error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) return;
  
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites?auth0Id=${user.sub}`);
        if (!response.ok) throw new Error("Failed to fetch favorites");
        const data = await response.json();
        setFavorites(data.favorites.map(fav => fav._id || fav)); // depends if your API returns full event or IDs
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };
  
    fetchFavorites();
  }, [isAuthenticated, user]);
  
  

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          handleSearch({
            newCoordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error(error);
          toast.error("Unable to retrieve your location.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = async ({ newCoordinates } = {}) => {
    let filtered = allEvents;

    // 1) Title/Location text search:
    if (searchInput) {
      const fuse = new Fuse(fakeEvents, {
        keys: ["title", "location"],
        threshold: 0.3,
      });
      const results = fuse.search(searchInput);
      filtered = results.map((result) => result.item);
    }

    // 2) Category filter:
    if (category) {
      filtered = filtered.filter(
        (event) => (event.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    // 3) Date filter:
    if (dateFilter) {
      filtered = filterByDate(filtered, dateFilter);
    }

    // 4) Audience filter:
    if (audienceFilter) {
      filtered = filtered.filter((event) => event.audience === audienceFilter);
    }
    // or use your "filterByAudience" helper:
    filtered = filterByAudience(filtered, audienceFilter);

    // 5) Distance filter:
    const userCoords = newCoordinates || coordinates;
    // If distanceFilter === 0, treat as "no distance limit"
    const maxDistance = distanceFilter > 0 ? distanceFilter : null;

    // If there's text in locationInput, fetch coordinates:
    if (locationInput.trim().length) {
      const coords = await fetchCoordinates(locationInput);
      if (coords) {
        userCoords.lat = coords.lat;
        userCoords.lng = coords.lng;
        setCoordinates(coords);
      } else {
        // If we couldn't get coords, fallback to text-based filtering
        filtered = filtered.filter((event) =>
          event.location.toLowerCase().includes(locationInput.toLowerCase())
        );
      }
    }

    // Actually filter if maxDistance is set:
    if (maxDistance) {
      filtered = filtered.filter((event) => {
        const distance = getDistanceFromLatLng(
          userCoords.lat,
          userCoords.lng,
          event.lat,
          event.lng
        );
        return distance <= maxDistance;
      });
    }

    setFilteredEvents(filtered);
    setHasSearched(true);
  };

  // Re-run search if any filter changes:
  useEffect(() => {
    handleSearch();
  }, [category, dateFilter, distanceFilter, audienceFilter]);

  const eventsToDisplay = showOnlyFavorites
    ? filteredEvents.filter((event) => favorites.includes(event.id))
    : filteredEvents;

  if (!isLoaded) return <p>Loading Google Maps...</p>;

  return (
    <div className="container mt-4">
      <div className="row">
        {/* LEFT SIDE */}
        <div className="col-md-8">
          <h1>Upcoming Events</h1>

          {/* SEARCH BAR */}
          <div className="d-flex align-items-center mb-3 search-bar-container">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Search events..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <AutocompleteInput
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city or zip code..."
              onPlaceSelected={(place) => {
                const coords = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                };
                setCoordinates(coords);
                setLocationInput(place.formatted_address);
              }}
              onKeyDown={handleKeyDown}
            />

            <button className="btn btn-danger" onClick={() => handleSearch()}>
              <FaSearch />
            </button>

            <button className="btn btn-secondary ms-2" onClick={handleUseMyLocation}>
              Use My Location
            </button>
          </div>

          {/* FILTERS */}
          <div className="d-flex mb-4 gap-3">
            {/* Date Filter */}
            <select
              className="form-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">Any Day</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this week">This Week</option>
              <option value="this weekend">This Weekend</option>
              <option value="next week">Next Week</option>
            </select>

            {/* Category Filter */}
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Any Category</option>
              <option value="Music">Music</option>
              <option value="Business">Business</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Health & Fitness">Health & Fitness</option>
            </select>

            {/* Audience Filter */}
            <select
              className="form-select"
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
            >
              <option value="">Any Audience</option>
              <option value="Everyone">Everyone</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
            {/* Distance Slider */}
            
          </div>
          <div className="distance-slider-wrapper">
              <label htmlFor="distanceSlider" className="form-label">
                <h5>Event Search Distance:{" "}
                {distanceFilter === 0
                  ? "Any"
                  : `${distanceFilter} miles`}
                  </h5>
              </label>
              <input
                id="distanceSlider"
                type="range"
                className="form-range"
                min="0"
                max="100"  // or whatever max you want
                value={distanceFilter}
                onChange={(e) => {
                  // Convert string -> number
                  const val = parseInt(e.target.value, 10);
                  setDistanceFilter(val);
                }}
              />
            </div>

          {/* Favorites toggle */}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="favoriteToggle"
              checked={showOnlyFavorites}
              onChange={(e) => setShowOnlyFavorites(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="favoriteToggle">
              Show only favorites
            </label>
          </div>

          {/* EVENT LIST */}
          <div className="row">
            {eventsToDisplay.map((event) => (
              <div
                key={event.id}
                className="col-md-6 mb-4"
                onClick={() => setActiveEvent(event)}
              >
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5
                        className="card-title"
                        style={{ cursor: "pointer" }}
                      >
                        {event.title}
                      </h5>
                      <button
                        className="btn btn-link text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(event.id);
                        }}
                        title={
                          favorites.includes(event.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {favorites.includes(event.id) ? <FaHeart /> : <FaRegHeart />}
                      </button>
                    </div>
                    <p className="card-text">
                      <strong>Date:</strong> {formatDisplayDate(event.date)}
                    </p>
                    <p className="card-text">
                      <strong>Location:</strong> {event.location}
                    </p>
                    <p className="card-text">
                      <strong>Audience:</strong> {event.audience || "Everyone"}
                    </p>
                    <p className="card-text">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {eventsToDisplay.length === 0 && <p>No events found.</p>}
          </div>
        </div>

        {/* RIGHT SIDE - Map */}
        <div className="col-md-4">
          <div className="map-wrapper">
          <MapWithMarkers
          center={coordinates}
          isLoaded={isLoaded}
          events={filteredEvents.filter(
            (event) =>
              typeof event.lat === "number" &&
              typeof event.lng === "number" &&
              !isNaN(event.lat) &&
              !isNaN(event.lng)
          )}
        />         
        </div>
        </div>
      </div>

      <Modal event={activeEvent} onClose={() => setActiveEvent(null)} />
    </div>
  );
};

export default EventSearch;
