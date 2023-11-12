const mqtt = require("mqtt")
const moment = require("moment-timezone")
const Log = require("../models/Log")

// establish mqtt connection
const host = "test.mosquitto.org"
const port = "1883"

const connectUrl = `mqtt://${host}:${port}`

// let io // Definisikan variabel io di sini
// Fungsi untuk mengatur io
// function setSocketIO(socketIO) {
//   io = socketIO
// }

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
  const currentDatetime = new Date()
  currentDatetime.setSeconds(0) // Bulatkan detik menjadi 00
  currentDatetime.setMilliseconds(0)
  // Menambahkan offset waktu UTC+7 secara manual (7 jam atau 7 * 60 menit)
  currentDatetime.setMinutes(currentDatetime.getMinutes() + 7 * 60)

  const newLog = new Log({
    suhu: suhuData.value,
    kelembapan: kelembapanData.value,
    createdAt: currentDatetime.toISOString(), // Tambahkan waktu pengambilan data
  })

  // emit ke socket.io-client (frontend)
  // if (io) {
  //   io.emit("logs", newLog)
  // }

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

// get data for chart - 1 last hour
const getChartLog = async (req, res) => {
  try {
    const chartLogs = await Log.find(
      {},
      { _id: 0, suhu: 1, kelembapan: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(60)

    // Membalik urutan data
    const reversedChartLogs = chartLogs.reverse()

    res.json(reversedChartLogs)
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve data" })
  }
}

// get data for chart - 24 last hour
const getChartLog24 = async (req, res) => {
  try {
    const currentDate = new Date()
    currentDate.setMinutes(0, 0, 0) // Mengatur menit dan detik ke 0 untuk mendapatkan jam bulat saat ini

    const last24Hours = new Date(currentDate)
    last24Hours.setHours(currentDate.getHours() - 24) // Menghitung waktu 24 jam yang lalu

    const chartLogs = await Log.find(
      {
        createdAt: {
          $gte: last24Hours,
          $lt: currentDate,
        },
      },
      { _id: 0, suhu: 1, kelembapan: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 }) // Mengurutkan berdasarkan createdAt secara descending untuk mendapatkan data terbaru
      .limit(24) // Mengambil 24 data terbaru

    res.json(chartLogs)
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data" })
  }
}

// suhu dan kelembapan tertinggi dan terendah selama 24 jam terakhir
const getMinMax24 = async (req, res) => {
  try {
    // Kueri untuk mendapatkan data suhu dan kelembapan tertinggi dan terendah dalam 48 jam terakhir
    const result = await Log.aggregate([
      {
        $match: {
          // Tidak ada batasan waktu
        },
      },
      {
        $group: {
          _id: null,
          highestTemperature: { $max: "$suhu" },
          lowestTemperature: { $min: "$suhu" },
          highestHumidity: { $max: "$kelembapan" },
          lowestHumidity: { $min: "$kelembapan" },
        },
      },
    ])

    const {
      highestTemperature,
      lowestTemperature,
      highestHumidity,
      lowestHumidity,
    } = result[0] // Mengambil hasil dari agregasi

    res.json({
      highestTemperature,
      lowestTemperature,
      highestHumidity,
      lowestHumidity,
    })
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data" })
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
  getChartLog,
  getChartLog24,
  getMinMax24,
  findLogById,
  // setSocketIO,
}
