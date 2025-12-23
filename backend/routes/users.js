const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");

const router = express.Router();

router.post("/favorites", async (req, res) => {
  const { auth0Id, eventId } = req.body;

  try {
    let user = await User.findOne({ auth0Id });

    if (!user) {
      const base = (auth0Id || "user").split("|").pop().slice(0, 8);
      const username = `user_${base}_${Math.floor(Math.random() * 10000)}`;

      user = await User.create({
        auth0Id,
        username,
        favorites: [],
      });
    }

    const alreadyFavorited = user.favorites.some(
      (id) => id.toString() === eventId
    );

    if (alreadyFavorited) {
      user.favorites = user.favorites.filter((id) => id.toString() !== eventId);
    } else {
      user.favorites.push(eventId);
    }

    await user.save();

    res.json({
      updatedFavorites: user.favorites.map((id) => id.toString()),
      message: alreadyFavorited ? "Removed from favorites!" : "Added to favorites!",
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/favorites", async (req, res) => {
  const { auth0Id } = req.query;
  try {
    const user = await User.findOne({ auth0Id }).populate("favorites").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
