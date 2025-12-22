import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

console.log("Auth0 domain:", domain);
console.log("Auth0 clientId:", clientId);
console.log("Origin:", window.location.origin);

if (!domain || !clientId) {
  throw new Error("Missing Auth0 env vars: REACT_APP_AUTH0_DOMAIN / REACT_APP_AUTH0_CLIENT_ID");
}


const onRedirectCallback = (appState) => {
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
    onRedirectCallback={onRedirectCallback}
  >
    <App />
  </Auth0Provider>
);
