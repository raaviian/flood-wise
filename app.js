const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const express = require("express");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Basic route for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const MAX_LEVEL = 200; // Maximum water level in cm

// PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iot-floodwise",
  port: process.env.DB_PORT || 5432,
});

// Set the pool object on the app
app.set("pool", pool);

// Define route to add phone number
app.post("/add-phone-number", (req, res) => {
  const { number } = req.body;
  if (!number) {
    console.error("Invalid phone number received");
    return res.status(400).json({ error: "Invalid phone number" });
  }

  const sql = `INSERT INTO phone_numbers (number) VALUES ($1)`;

  pool.query(sql, [number], (err, result) => {
    if (err) {
      console.error("Error adding phone number to database: " + err.message);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Phone number added to database:", number);
      res
        .status(200)
        .json({ message: "Phone number registered to alert subscription!" });
    }
  });
});

// Define route to get all phone numbers
app.get("/phone-numbers", (req, res) => {
  console.log("GET /phone-numbers called");
  const sql = "SELECT * FROM phone_numbers";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching phone numbers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results.rows);
    }
  });
});

// Define route to delete a phone number
app.delete("/phone-numbers/:id", (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /phone-numbers/${id} called`);
  const sql = "DELETE FROM phone_numbers WHERE id = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting phone number:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json({ message: "Phone number removed!" });
    }
  });
});

// Define route to store sensor data
app.post("/store-data", (req, res) => {
  const { ultrasonic_reading, water_level_reading } = req.body;
  if (!ultrasonic_reading || !water_level_reading) {
    console.error("Invalid data received");
    return res.status(400).json({ error: "Invalid data" });
  }

  const sql = `INSERT INTO sensor_data (ultrasonic_reading, water_level_reading, timestamp) VALUES ($1, $2, NOW())`;

  pool.query(sql, [ultrasonic_reading, water_level_reading], (err, result) => {
    if (err) {
      console.error("Error storing data in database: " + err.message);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json({ message: "Device is collecting data..." });
    }
  });
});

// Route to get realtime sensor data
app.get("/realtime-data", (req, res) => {
  console.log("GET /realtime-data called");
  const sql = "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching realtime data:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.rows.length > 0) {
        const data = results.rows[0];
        data.progressUltrasonic = (data.ultrasonic_reading / MAX_LEVEL) * 100;
        data.progressWaterLevel = (data.water_level_reading / MAX_LEVEL) * 100;
        res.json(data);
      } else {
        res.status(404).json({ error: "No data found" });
      }
    }
  });
});

// Route to toggle data display
let displayData = true;

app.post("/toggle-display", (req, res) => {
  displayData = !displayData;
  const activity = `Display turned ${displayData ? "ON" : "OFF"}`;
  console.log(activity); // Log the activity for debugging

  const sql =
    "INSERT INTO button_logs (activity, timestamp) VALUES ($1, NOW())";
  pool.query(sql, [activity], (err) => {
    if (err) {
      console.error("Error logging button activity:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(activity);
    res.status(200).json({ message: "Display status updated", displayData });
  });
});

// Route to get display status
app.get("/display-status", (req, res) => {
  console.log("GET /display-status called");
  res.status(200).json({ displayData });
});

// Route to get the latest 15 water level readings
app.get("/latest-water-levels", (req, res) => {
  console.log("GET /latest-water-levels called");
  const sql = "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 15";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching water level data:", err);
      res.status(500).send("Error fetching water level data");
    } else {
      const processedResults = results.rows.map((entry) => ({
        ...entry,
        progressUltrasonic: (entry.ultrasonic_reading / MAX_LEVEL) * 100,
        progressWaterLevel: (entry.water_level_reading / MAX_LEVEL) * 100,
      }));
      res.json(processedResults);
    }
  });
});

// Fetch all posts
app.get("/api/posts", (req, res) => {
  console.log("GET /api/posts called");
  const sql = "SELECT * FROM posts ORDER BY created_at DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results.rows);
    }
  });
});

// Create a new post
app.post("/api/posts", (req, res) => {
  const { text } = req.body;
  console.log("POST /api/posts called, text:", text);
  if (!text) {
    return res.status(400).json({ error: "Post text is required" });
  }

  const sql =
    "INSERT INTO posts (text, likes, created_at) VALUES ($1, 0, NOW())";
  pool.query(sql, [text], (err, result) => {
    if (err) {
      console.error("Error creating post:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Like a post
app.post("/api/posts/:id/like", (req, res) => {
  const postId = req.params.id;
  console.log(`POST /api/posts/${postId}/like called`);
  const sql = "UPDATE posts SET likes = likes + 1 WHERE id = $1";
  pool.query(sql, [postId], (err, result) => {
    if (err) {
      console.error("Error liking the post:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Add this block to handle flood reports
app.post("/api/flood-report", (req, res) => {
  const { name, location, contact } = req.body;
  console.log("POST /api/flood-report called, data:", req.body);
  if (!name || !location || !contact) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql =
    "INSERT INTO flood_reports (name, location, contact, report_time) VALUES ($1, $2, $3, NOW())";
  pool.query(sql, [name, location, contact], (err, result) => {
    if (err) {
      console.error("Error creating flood report:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Define route to get button logs
app.get("/button-logs", (req, res) => {
  console.log("GET /button-logs called");
  const sql = "SELECT * FROM button_logs ORDER BY timestamp DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching button activity logs:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results.rows);
    }
  });
});

app.get("/flood-reports", (req, res) => {
  const sql = "SELECT * FROM flood_reports ORDER BY report_time DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching flood reports:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results.rows);
    }
  });
});

module.exports = app;
