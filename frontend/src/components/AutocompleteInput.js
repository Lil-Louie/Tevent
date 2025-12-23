// src/components/AutocompleteInput.js
import React, { useRef, useEffect } from "react";

const AutocompleteInput = ({
  value,
  onChange,
  placeholder,
  onPlaceSelected,
  onKeyDown,
  isLoaded,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !window.google || !inputRef.current) return;
  
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],
      componentRestrictions: { country: "us" },
      fields: ["geometry", "formatted_address", "address_components"],
    });
  
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      onPlaceSelected?.(place);
    });
  
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, onPlaceSelected]);
  

  return (
    <input
      type="text"
      className="form-control me-2"
      placeholder={isLoaded ? placeholder : "Loading location..."}
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoComplete="off"
      disabled={!isLoaded}
    />
  );
};

export default AutocompleteInput;
