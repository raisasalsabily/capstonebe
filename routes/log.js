const router = require("express").Router()

const {
  createLog,
  findLatestLog,
  findLogById,
  getChartLog,
} = require("../controllers/logController.js")

// GET latest log
router.get("/latest", findLatestLog)

// get data for chart
router.get("/chartlog", getChartLog)

// GET BY ID
router.get("/:id", findLogById)

// POST Log
router.post("/", createLog)

module.exports = router
