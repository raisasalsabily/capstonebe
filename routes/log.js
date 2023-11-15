const router = require("express").Router()

const {
  createLog,
  findLatestLog,
  findLogById,
  getChartLog,
  getChartLog24,
  getMinMax24,
  // getSisaPakan,
  updateSisaPakan,
} = require("../controllers/logController.js")

// GET latest log
router.get("/latest", findLatestLog)

// get data for chart - 1 last hour
router.get("/chartlog", getChartLog)

// get data for chart - 24 last hours
router.get("/chartlog24", getChartLog24)

// suhu dan kelembapan tertinggi dan terendah selama 24 jam terakhir
router.get("/minmaxlog24", getMinMax24)

// perkiraan sisa pakan
// router.get("/sisapakan", getSisaPakan)

router.post("/updatesisapakan", updateSisaPakan)

// GET BY ID
router.get("/:id", findLogById)

// POST Log
router.post("/", createLog)

module.exports = router
