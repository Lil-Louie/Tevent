const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");

const router = express.Router();

/**
 * @route   POST /api/events
 * @desc    Create a new event
 */
router.post("/events", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body); // 👈 ADD THIS
    const {
      title,
      description,
      location,
      audience,
      category,
      lat,
      lng,
      date,
      startTime,
      endTime,
    } = req.body;

    if (!title || !location || !date) {
      return res.status(400).json({ error: "Title, location, and date are required." });
    }

    const newEvent = new Event({
      title,
      description,
      location,
      date: new Date(date),
      audience,
      category,
      lat,
      lng,
      startTime,
      endTime,
    });

    const savedEvent = await newEvent.save();
    console.log("Saved to DB:", savedEvent); // 👈 ADD THIS
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Server error creating event." });
  }
});

/**
 * @route   POST /api/events/:id/attend
 * @desc    Mark a user as attending an event
 */
router.post("/events/:id/attend", async (req, res) => {
  try {
    const { auth0Id } = req.body; // Expecting Auth0 ID from frontend

    // 1. Find the User by Auth0 ID
    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ message: "User not found" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 2. Add user's MongoDB _id to the attendees array if not already added
    if (!event.attendees.includes(user._id)) {
      event.attendees.push(user._id);
      await event.save();

      // 3. Also add the event to the user's 'eventsGoing' array
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { eventsGoing: event._id },
      });
    }

    res.json({ message: "Marked as going", event });
  } catch (err) {
    console.error("Error marking as attending:", err);
    res.status(500).json({ error: err.message });
  }
});



/**
 * @route   GET /api/events
 * @desc    Fetch all events
 */
router.get("/events", async (req, res) => {
  console.time("events_total");
  try {
    console.time("events_db");
    const events = await Event.find().lean();
    console.timeEnd("events_db");

    res.json(events);
  } finally {
    console.timeEnd("events_total");
  }
});


router.get('/users/favorites', async (req, res) => {
  const { auth0Id } = req.query; // assuming you pass auth0Id as a query param

  try {
    const user = await User.findOne({ auth0Id }).populate('favorites'); // populate if favorites are event refs

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ favorites: user.favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});




const getOrCreateUser = async (auth0User) => {
  const auth0Id = auth0User.sub;

  let user = await User.findOne({ auth0Id });
  if (!user) {
    user = await User.create({
      auth0Id,
      name: auth0User.name || "",
      email: auth0User.email || ""
    });
    console.log("🆕 New user created in MongoDB:", user);
  }

  return user;
};

router.getOrCreateUser = getOrCreateUser;
module.exports = router;