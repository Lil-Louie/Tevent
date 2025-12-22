require("dotenv").config({ path: ".env" }); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
import cors from "cors";
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const authRoutes = require("./routes/auth");


const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors({
  origin: [
    "http://localhost:3001",
    "https://tevent.00flacco.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.get('/', (req, res) => {
    res.send(`Server running on port ${PORT}`);
  });

// Middleware
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);
app.use("/api", eventRoutes); 
app.use('/api/users', userRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


app.listen(PORT, () => console.log(`Server running on port ${"https://tevent-1.onrender.com"}`));