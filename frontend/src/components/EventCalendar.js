import React, { useState, useEffect, useRef } from 'react';
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import { createViewWeek, createViewMonthGrid } from "@schedule-x/calendar";
import { toast } from 'react-toastify';
import AutocompleteInput from "./AutocompleteInput"; 

import useUserProfile from "../hooks/useUserProfile";

import "@schedule-x/theme-default/dist/calendar.css";
import { useTheme } from '../context/ThemeContext'; // ✅ adjust path as needed


function EventCalendar({ isLoaded }) {
    const { isAuthenticated } = useUserProfile();
    const { theme } = useTheme(); // will be 'light' or 'dark'
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [audience, setAudience] = useState('');
    const [category, setCategory] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [end, setEnd] = useState('');
    const [events, setEvents] = useState([]);
    const currentDate = new Date().toLocaleDateString('en-CA');
    const defaultStartTimeF = '09:00';
    const defaultEndTimeF = '17:00';
  
    const formatForScheduleX = (dateStr, timeStr = '09:00') => {
        const datePart = new Date(dateStr).toLocaleDateString('en-CA');
        return `${datePart} ${timeStr}`; 
      };
      
      const formatToYMD = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-CA'); 
      };

    const fetchEvents = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events`);
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();
        console.log("✅ Raw events from backend:", data);
        const formattedEvents = data.map(event => {
            console.log("📅 Formatting event:", event);
            return {
              id: event._id,
              title: event.title,
              start: formatForScheduleX(event.date, event.startTime || defaultStartTimeF),
              end: formatForScheduleX(event.date, event.endTime || defaultEndTimeF),
              metadata: {
                description: event.description
              }
            };
          });

        calendar.events.set(formattedEvents);
    } catch (err) {
        console.error("❌ Error loading or formatting events:", err);
        toast.error("Failed to load calendar events.");
    }
    };
      
      const calendar = useCalendarApp({
        views: [createViewWeek(), createViewMonthGrid()],
        events: events,
        selectedDate: currentDate,
        eventTooltipRenderer: ({ events }) => {
          return `<div style="padding: 6px; max-width: 200px;">
                    <strong>${events.title}</strong><br/>
                    <span>${events.metadata?.description || 'No description'}</span>
                  </div>`;
        }
      });



    // ✅ React to theme changes and set the calendar theme dynamically
  useEffect(() => {
    if (calendar?.setTheme) {
      calendar.setTheme(theme); // 👈 this is the key
      console.log("🌓 ScheduleX theme set to:", theme);
    }
  }, [theme, calendar]);
           

      useEffect(() => {
        if (!calendar?.events?.set) return;
      
        console.log("📅 Fetching events on mount...");
        fetchEvents();
      }, [calendar]);
      






  const handleAddEvent = async () => {
    if (!title || !start || !end || !location || !lat || !lng) {
      return alert("Please fill out all required fields including location.");
    }
  
    const newEvent = {
      title,
      description,
      location,
      audience,
      category,
      lat,
      lng,
      date: formatToYMD(start),
      startTime,
      endTime,
    };
  

    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events`, {
        method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEvent)
        });
  
      if (!response.ok) throw new Error("Failed to save event");
  
      const savedEvent = await response.json();
  
      // Add the event to the calendar view
      await fetchEvents(); // refresh the entire calendar
  
      toast.success("Event successfully added!");
  
      // Reset form
      setTitle('');
      setStart('');
      setEnd('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setLat('');
      setLng('');
      setAudience('');
      setCategory('');
      setDescription('');
      setShowAddEvent(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event. Try again.");
    }
  };
  

  const handleButtonClick = () => {
    setShowAddEvent(true);
  };



  return (
    <div>
      <h1>Events Calendar</h1>

      {isAuthenticated && (
        <button className="add-event-btn" onClick={handleButtonClick}>➕ Add Event</button>
      )}

      {showAddEvent && (
        <div className="event-form-container">
          <h3>Add New Event</h3>

          <div className="form-group">
            <input
              type="text"
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

            <AutocompleteInput
            className="form-group"
            placeholder="Enter address"
            onPlaceSelected={(place) => {
                if (!place.geometry) return;

                setLocation(place.formatted_address);
                setLat(place.geometry.location.lat());
                setLng(place.geometry.location.lng());
            }}
            />

          <div className="form-group-row">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <select
              className="form-select"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="">Any Audience</option>
              <option value="Everyone">Everyone</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>

        <div className="form-group-row">
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
              <option value="N/A">N/A</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              className="event-description-input"
              placeholder="Event Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="button-row">
            <button className="add-event-btn" onClick={handleAddEvent}> Submit Event</button>
            <button className="cancel-event-btn" onClick={() => setShowAddEvent(false)}>Cancel</button>
          </div>
        </div>
      )}


        <ScheduleXCalendar
        calendarApp={calendar}    

        />
    </div>
  );
}

export default EventCalendar;
