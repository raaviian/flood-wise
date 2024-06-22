const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require("fs");
const WebSocket = require("ws");

const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Use CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory

// WebSocket connection
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received:", message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Sending a welcome message as JSON
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Welcome to the WebSocket server",
    })
  );
});

function broadcastData(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "data", ...data }));
    }
  });
}

// Basic route for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const MAX_LEVEL = 200; // Maximum water level in cm
const floodThreshold = 50; // Flood threshold in cm

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send an alert email
function sendAlertEmail(subject, text, recipient) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending alert email:", error);
    } else {
      console.log("Alert email sent:", info.response);
    }
  });
}

// Function to send mass email
function sendMassEmail(subject, text) {
  const sql = "SELECT email FROM users"; // Adjust this query based on your table structure
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching emails from database:", err);
      return;
    }
    results.forEach((user) => {
      sendAlertEmail(subject, text, user.email);
    });
  });
}

// MySQL database connection pool
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10, // Connection pool limit
});

// Set the connection pool object on the app
app.set("connection", connection);

// Define route to add phone number
app.post("/add-phone-number", [body("number").isMobilePhone()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { number } = req.body;
  const sql = `INSERT INTO phone_numbers (number) VALUES (?)`;
  connection.query(sql, [number], (err, result) => {
    if (err) {
      console.error("Error adding phone number to database:", err.message);
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
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching phone numbers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// Define route to delete a phone number
app.delete("/phone-numbers/:id", (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /phone-numbers/${id} called`);
  const sql = "DELETE FROM phone_numbers WHERE id = ?";
  connection.query(sql, [id], (err, result) => {
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
  console.log(req.body); // Log the request body for debugging

  if (
    typeof ultrasonic_reading !== "number" ||
    typeof water_level_reading !== "number"
  ) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const sql = `INSERT INTO sensor_data (ultrasonic_reading, water_level_reading, timestamp) VALUES (?, ?, NOW())`;
  connection.query(
    sql,
    [ultrasonic_reading, water_level_reading],
    (err, result) => {
      if (err) {
        console.error("Error storing data in database:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.status(200).json({ message: "Data stored successfully" });
      broadcastData({ ultrasonic_reading, water_level_reading }); // Broadcast data to WebSocket clients
    }
  );
});

app.get("/realtime-data", (req, res) => {
  console.log("GET /realtime-data called");
  const sql = "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching realtime data:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length > 0) {
        const data = results[0];
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

  const sql = "INSERT INTO button_logs (activity, timestamp) VALUES (?, NOW())";
  connection.query(sql, [activity], (err) => {
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
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching water level data:", err);
      res.status(500).send("Error fetching water level data");
    } else {
      const processedResults = results.map((entry) => ({
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
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// Create a new post with image upload
app.post(
  "/api/posts",
  upload.single("image"),
  [body("text").notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { text } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    console.log("POST /api/posts called, text:", text);

    const sql =
      "INSERT INTO posts (text, image_url, likes, created_at) VALUES (?, ?, 0, NOW())";
    connection.query(sql, [text, imageUrl], (err, result) => {
      if (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json({ success: true });
      }
    });
  }
);

// Like a post
app.post("/api/posts/:id/like", (req, res) => {
  const postId = req.params.id;
  console.log(`POST /api/posts/${postId}/like called`);
  const sql = "UPDATE posts SET likes = likes + 1 WHERE id = ?";
  connection.query(sql, [postId], (err, result) => {
    if (err) {
      console.error("Error liking the post:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Add this block to handle flood reports
app.post(
  "/api/flood-report",
  [
    body("name").notEmpty(),
    body("location").notEmpty(),
    body("contact").isMobilePhone(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, location, contact } = req.body;
    console.log("POST /api/flood-report called, data:", req.body);

    const sql =
      "INSERT INTO flood_reports (name, location, contact, report_time) VALUES (?, ?, ?, NOW())";
    connection.query(sql, [name, location, contact], (err, result) => {
      if (err) {
        console.error("Error creating flood report:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json({ success: true });
      }
    });
  }
);

// Define route to get button logs
app.get("/button-logs", (req, res) => {
  console.log("GET /button-logs called");
  const sql = "SELECT * FROM button_logs ORDER BY timestamp DESC";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching button activity logs:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// Get flood reports
app.get("/flood-reports", (req, res) => {
  const sql = "SELECT * FROM flood_reports ORDER BY report_time DESC";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching flood reports:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

module.exports = app;

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
