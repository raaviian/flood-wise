require("dotenv").config(); // Load environment variables
const http = require("http");
const app = require("./app"); // Import app.js
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost"; // Read HOST from environment variables

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");
  ws.on("message", (message) => {
    console.log("Received:", message);
  });
  ws.send("Welcome to the WebSocket server!");
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// Gracefully close the database connection when the server stops
process.on("SIGINT", () => {
  const connection = app.get("connection");
  connection.end((err) => {
    if (err) {
      console.error("Error closing the database connection:", err);
    } else {
      console.log("Database connection closed");
    }
    process.exit(err ? 1 : 0);
  });
});
