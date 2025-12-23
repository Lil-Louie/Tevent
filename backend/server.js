require("dotenv").config({ path: ".env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const eventRoutes = require("./routes/events");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: ["http://localhost:3001", "https://tevent.00flacco.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.get("/", (req, res) => res.send(`Server running on port ${PORT}`));
app.get("/health", (req, res) => res.status(200).send("ok"));

app.use("/auth", authRoutes);
app.use("/api", eventRoutes);
app.use("/api/users", userRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo error:", err));

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
