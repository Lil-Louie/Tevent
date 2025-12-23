import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useAuth0 } from "@auth0/auth0-react";
import { useJsApiLoader } from "@react-google-maps/api";



{/* Pages */}
import Home from "./pages/Home";
import Events from "./pages/Events";
import Calendar from "./pages/Calendar";
import UserProfile from "./pages/UserProfile";


{/* Components */}
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ManageEvents from "./components/ManageEvents"; 


{/* Styling */}
import './styles/EventSearch.css';
import "./styles/App.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from './context/ThemeContext'; // adjust path as needed



const App = () => {
  const { isAuthenticated, user } = useAuth0();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  //Load Google Maps API ONCE here
  const libraries = ['places'];

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });
  
  if (loadError) console.error("Google Maps load error:", loadError);
  

  useEffect(() => {
    const syncUser = async () => {
      if (!isAuthenticated || !user) return;
  
      await fetch(`${process.env.REACT_APP_API_URL}/auth/sync-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub: user.sub,
          email: user.email,
          username: user.nickname || user.name || user.email?.split("@")[0] || "user",
          picture: user.picture,
        }),
      });
    };
  
    syncUser().catch(console.error);
  }, [isAuthenticated, user]);


  

  return (
    <ThemeProvider>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Wrap UserProfile with ProtectedRoute */}
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <Events
                searchQuery={searchQuery}
                locationQuery={locationQuery}
                isLoaded={isLoaded}
              />
            }
          />
          <Route path="/calendar" element={<Calendar isLoaded={isLoaded} />} />

          {/*Added Manage Events Route here*/}
            <Route
            path="/manage-events"
            element={
              <ProtectedRoute>
                <ManageEvents />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<h2>Page Not Found</h2>} />
        </Routes>
      </Layout>

      {/* Add ToastContainer once at the root level */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  </ThemeProvider>
  );
};

export default App;
