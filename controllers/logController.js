const express = require("express")
const Log = require("../models/Log")

// Create
const createLog = async (req, res) => {
  const newLog = new Log(req.body)
  try {
    const savedLog = await newLog.save()

    res.status(200).json(savedLog)
  } catch (err) {
    res.status(500).json(err)
  }
}

// GET ALL Log
const findAllLog = async (req, res) => {
  try {
    let logs = {}
    if (req.query.table === "true") {
      logs = await Log.find().select({
        _id: 1,
        category: 1,
        logs: 1,
      })
    } else {
      logs = await Log.find()
    }

    res.status(200).json(logs)
  } catch (err) {
    res.status(500).json(err)
  }
}

// GET Log BY ID
const findLogById = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id)
    res.status(200).json(log)
  } catch (err) {
    res.status(500).json(err)
  }
}

module.exports = {
  createLog,
  findAllLog,
  findLogById,
}
