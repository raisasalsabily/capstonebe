const router = require("express").Router()

const {
  createLog,
  findLatestLog,
  findLogById,
} = require("../controllers/logController.js")

// GET latest log
router.get("/latest", findLatestLog)

// GET BY ID
router.get("/:id", findLogById)

// POST Log
router.post("/", createLog)

module.exports = router
