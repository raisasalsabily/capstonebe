const mqtt = require("mqtt")
const Log = require("../models/Log")

// establish mqtt connection
const host = "test.mosquitto.org"
const port = "1883"

const connectUrl = `mqtt://${host}:${port}`

let io // Definisikan variabel io di sini
// Fungsi untuk mengatur io
function setSocketIO(socketIO) {
  io = socketIO
}

// establish connection
const client = mqtt.connect(connectUrl, {
  clean: true,
  // connectTimeout: 4000, --> atur di program esp-nya
  // username: "emqx",
  // password: "public",
  reconnectPeriod: 2000,
})

client.on("connect", () => {
  console.log("Connected to MQTT Broker")
})

// subscribe to mqtt topic
const topic = "esp32/capstoneb12501expo"
const topic_suhu = "esp32/capstoneb12501expo/suhu"
const topic_kelembapan = "esp32/capstoneb12501expo/kelembapan"

client.on("connect", () => {
  client.subscribe(topic_suhu)
  client.subscribe(topic_kelembapan)
})

const suhuData = {} // Objek untuk menyimpan data suhu
const kelembapanData = {} // Objek untuk menyimpan data kelembapan

client.on("message", (topic, payload) => {
  const data = payload.toString()

  if (topic === topic_suhu) {
    // Ubah data suhu menjadi objek JSON
    suhuData.value = parseFloat(data)
  } else if (topic === topic_kelembapan) {
    // Ubah data kelembapan menjadi objek JSON
    kelembapanData.value = parseFloat(data)
  }

  // Jika kedua data suhu dan kelembapan sudah diterima, simpan ke MongoDB
  if ("value" in suhuData && "value" in kelembapanData) {
    // save to mongodb
    createLog()
  }
})

// Create
const createLog = () => {
  const newLog = new Log({
    suhu: suhuData.value,
    kelembapan: kelembapanData.value,
  })

  // emit ke socket.io-client (frontend)
  if (io) {
    io.emit("logs", newLog)
  }

  newLog
    .save()
    .then((savedLog) => {
      // console.log("Data suhu dan kelembapan berhasil disimpan di MongoDB")
      // Reset data suhu dan kelembapan
      suhuData.value = undefined
      kelembapanData.value = undefined
    })
    .catch((error) => {
      // console.error(
      //   `Gagal menyimpan data suhu dan kelembapan ke MongoDB: ${error}`
      // )
    })
}

// GET latest log
const findLatestLog = async (req, res) => {
  try {
    let logs = {}
    logs = await Log.findOne().sort({ createdAt: -1 })

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
  setSocketIO,
}
