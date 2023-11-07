const router = require("express").Router()

const {
  createLog,
  findLatestLog,
  findLogById,
  getChartLog,
  getChartLog24,
  getHighest60,
  getLowest60,
} = require("../controllers/logController.js")

// GET latest log
router.get("/latest", findLatestLog)

// get data for chart - 1 last hour
router.get("/chartlog", getChartLog)

// get data for chart - 24 last hours
router.get("/chartlog24", getChartLog24)

// suhu dan kelembapan tertinggi selama 60 menit terakhir
router.get("/highestlog60", getHighest60)

// suhu dan kelembapan terendah selama 60 menit terakhir
router.get("/lowestlog60", getLowest60)

// GET BY ID
router.get("/:id", findLogById)

// POST Log
router.post("/", createLog)

module.exports = router
