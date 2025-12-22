// ProtectedRoute.js
import React, { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, error } = useAuth0();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // 🚨 VERY IMPORTANT: do nothing during Auth0 callback
    const params = new URLSearchParams(window.location.search);
    const isAuthCallback = params.has("code") && params.has("state");
    if (isAuthCallback) return;

    if (isLoading) return;

    if (error) {
      console.error("Auth0 error:", error);
      toast.error("Auth0 login error. Check console.");
      return;
    }

    const loggedIn = isAuthenticated || !!user;
    if (loggedIn) return;

    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    toast.error("⚠️ You must be logged in to access this page.");
    toast.info("Redirecting to Log-In...");

    loginWithRedirect({
      appState: {
        returnTo: location.pathname + location.search,
      },
    });
  }, [isLoading, isAuthenticated, user, error, loginWithRedirect, location]);

  if (isLoading) return <div>Loading...</div>;

  return isAuthenticated || user ? children : null;
}
