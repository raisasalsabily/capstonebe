const router = require("express").Router()

const {
  createLog,
  findAllLog,
  findLogById,
} = require("../controllers/logController.js")

// GET ALL Log
router.get("/", findAllLog)

// GET BY ID
router.get("/:id", findLogById)

// POST Log
router.post("/", createLog)

module.exports = router
