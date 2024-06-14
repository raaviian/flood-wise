const mysql = require("mysql");

// MySQL database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iot-floodwise",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database as id " + connection.threadId);
});

exports.storeData = (req, res) => {
  const { ultrasonic_reading, water_level_reading } = req.body;
  const sql = `INSERT INTO sensor_data (ultrasonic_reading, water_level_reading, date) VALUES (?, ?, NOW())`;

  connection.query(
    sql,
    [ultrasonic_reading, water_level_reading],
    (err, result) => {
      if (err) {
        console.error("Error storing data in database: " + err.message);
        res.status(500).send("Internal Server Error");
      } else {
        console.log("Data inserted successfully");
        res.status(200).send("Data inserted successfully");
      }
    }
  );
};

exports.getRealtimeData = (req, res) => {
  const sql = "SELECT * FROM sensor_data ORDER BY date DESC LIMIT 1"; // Get latest entry

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL: " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      res.json(results[0]);
    }
  });
};
