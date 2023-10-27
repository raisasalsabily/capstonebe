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

// GET latest log
const findLatestLog = async (req, res) => {
  try {
    let logs = {}
    logs = await Log.findOne().sort({ timerecord: -1 })

    if (logs) {
      res.status(200).json(logs)
    } else {
      res.status(404).json({ error: "No log data available" })
    }
  } catch (err) {
    res.status(500).json(err)
  }
}

// // GET ALL Log
// const findAllLog = async (req, res) => {
//   try {
//     let logs = {}
//     logs = await Log.find().sort("-timerecord")
//     res.status(200).json(logs)
//   } catch (err) {
//     res.status(500).json(err)
//   }
// }

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
  findLatestLog,
  findLogById,
}
