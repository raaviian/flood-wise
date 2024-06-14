const express = require("express");
const sensorController = require("../controllers/sensorController");

const router = express.Router();

router.post("/store-data", sensorController.storeData);
router.get("/realtime-data", sensorController.getRealtimeData);

module.exports = router;
