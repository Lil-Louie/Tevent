import React from "react";
import Slideshow from "../components/Slideshow";

const Home = () => {
  console.log("Auth0 domain:", process.env.REACT_APP_AUTH0_DOMAIN);
  console.log("Auth0 clientId:", process.env.REACT_APP_AUTH0_CLIENT_ID);
  console.log("Origin:", window.location.origin);

  return (
    <div>
      <Slideshow /> 
      
    </div>
  );
};

export default Home;


