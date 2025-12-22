// ProtectedRoute.js
import React, { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, error } = useAuth0();
  const location = useLocation();

  // prevents multiple toasts / multiple redirects
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // wait until Auth0 finishes initializing
    if (isLoading) return;

    // if Auth0 threw an error, don't spam redirects; surface it
    if (error) {
      console.error("Auth0 error:", error);
      toast.error("Auth0 login error. Check console.");
      return;
    }

    // If we have a user, treat it as logged in even if isAuthenticated momentarily lags
    const loggedIn = isAuthenticated || !!user;
    if (loggedIn) return;

    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    toast.error("⚠️ You must be logged in to access this page.");
    toast.info("Redirecting to Log-In...");

    const timer = setTimeout(() => {
      loginWithRedirect({
        appState: { returnTo: location.pathname },
      });
    }, 800); // keep this short; 3s feels like “broken”

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user, error, loginWithRedirect, location.pathname]);

  if (isLoading) return <div>Loading...</div>;

  // render if authenticated OR user exists
  if (isAuthenticated || user) return children;

  // while redirecting
  return null;
}
