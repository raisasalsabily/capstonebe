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

// client.on("connect", () => {
//   console.log("Connected to MQTT Broker")
// })

// subscribe to mqtt topic
const topic = "esp32/capstoneb12501expo"
const topic_suhu = "esp32/capstoneb12501expo/suhu"
const topic_kelembapan = "esp32/capstoneb12501expo/kelembapan"
const topic_waktu = "esp32/capstoneb12501expo/waktu"
// const topic_kipas = "esp32/capstoneb12501expo/kipas"

client.on("connect", () => {
  console.log("Connected to MQTT Broker")

  client.subscribe(topic_suhu)
  client.subscribe(topic_kelembapan)
  client.subscribe(topic_waktu)
  // client.subscribe(topic_kipas)
})

const suhuData = {} // Objek untuk menyimpan data suhu
const kelembapanData = {} // Objek untuk menyimpan data kelembapan
const waktuData = {} // Objek untuk menyimpan data kelembapan
// const kipasData = {} // Objek untuk menyimpan data kelembapan

client.on("message", (topic, payload) => {
  const data = payload.toString()

  try {
    if (topic === topic_suhu) {
      suhuData.value = parseFloat(data)
      console.log(suhuData)
    } else if (topic === topic_kelembapan) {
      kelembapanData.value = parseFloat(data)
      console.log(kelembapanData)
    } else if (topic === topic_waktu) {
      waktuData.value = data
      console.log(waktuData)
    }

    if (
      suhuData.value !== undefined &&
      kelembapanData.value !== undefined &&
      waktuData.value !== undefined
    ) {
      createLog()
    }
  } catch (error) {
    console.error("Error handling MQTT message:", error)
    // Lakukan tindakan lain sesuai kebutuhan, seperti logging atau memberikan respons kepada pengirim pesan MQTT
  }
})

// Create
const createLog = async () => {
  Log.findOne()
    .sort({ createdAt: -1 })
    .exec((err, latestLog) => {
      if (err) {
        console.error("Gagal mencari data log terbaru:", err)
        return
      }

      if (latestLog) {
        const newLog = new Log({
          suhu: suhuData.value,
          kelembapan: kelembapanData.value,
          // kipasStatus: kipasData.value,
          sisaPakan: latestLog.sisaPakan, // Gunakan nilai sisaPakan dari dokumen terbaru
          // sisaPakan: latestLog.sisaPakan, // Gunakan nilai sisaPakan dari dokumen terbaru
          createdAt: waktuData.value,
        })

        newLog
          .save()
          .then((savedLog) => {
            console.log("Data suhu dan kelembapan berhasil disimpan di MongoDB")
            // Reset data suhu dan kelembapan
            suhuData.value = undefined
            kelembapanData.value = undefined
            waktuData.value = undefined
          })
          .catch((error) => {
            console.error(
              `Gagal menyimpan data suhu dan kelembapan ke MongoDB: ${error}`
            )
          })
      } else {
        console.log("Tidak ada data log yang tersedia untuk nilai sisaPakan")
      }
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

// mengurangi sisa pakan tiap "durasiSisaPakan"
const volPakanPenuh = 10000000
const volSekaliKeluar = 2
const durasiSisaPakan = volPakanPenuh / volSekaliKeluar

setInterval(async () => {
  try {
    const log = await Log.findOne().sort({ createdAt: -1 })
    if (log && log.sisaPakan > 0) {
      log.sisaPakan -= 1
      await log.save()
    }
  } catch (err) {
    console.error(err)
  }
}, 12 * 60 * 60 * 1000)

const updateSisaPakan = async (req, res) => {
  try {
    const { sisaPakan } = req.body // Ambil nilai sisaPakan dari body request
    // Buat atau perbarui data log terakhir dengan nilai sisaPakan yang diterima
    const latestLog = await Log.findOne().sort({ createdAt: -1 })
    if (latestLog) {
      latestLog.sisaPakan = sisaPakan
      await latestLog.save()
      res.status(200).json({ message: "Nilai sisaPakan berhasil diperbarui" })
    } else {
      res.status(404).json({ error: "Tidak ada data log yang tersedia" })
    }
  } catch (error) {
    res.status(500).json({
      error: "Gagal memperbarui nilai sisaPakan",
      message: error.message,
    })
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
      .limit(46)

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
    // Hitung waktu 24 jam yang lalu dari saat ini
    const time24HoursAgo = moment().subtract(48, "hours").toDate()

    // Kueri untuk mendapatkan data suhu dalam 24 jam terakhir
    const chartLogsSuhu = await Log.find(
      { createdAt: { $gte: time24HoursAgo } },
      { _id: 0, suhu: 1 }
    )
      .sort({ suhu: -1 })
      .exec() // Mengurutkan data suhu dari yang tertinggi ke terendah

    // Kueri untuk mendapatkan data kelembapan dalam 24 jam terakhir
    const chartLogsKelembapan = await Log.find(
      { createdAt: { $gte: time24HoursAgo } },
      { _id: 0, kelembapan: 1 }
    )
      .sort({ kelembapan: 1 })
      .exec() // Mengurutkan data kelembapan dari yang terendah ke tertinggi

    // Temukan nilai suhu tertinggi dalam dokumen suhu
    const highestTemperature =
      chartLogsSuhu.length > 0 ? chartLogsSuhu[0].suhu : null

    // Temukan nilai suhu terendah dalam dokumen suhu
    const lowestTemperature =
      chartLogsSuhu.length > 0
        ? chartLogsSuhu[chartLogsSuhu.length - 1].suhu
        : null

    // Temukan nilai kelembapan tertinggi dalam dokumen kelembapan
    const highestHumidity =
      chartLogsKelembapan.length > 0
        ? chartLogsKelembapan[chartLogsKelembapan.length - 1].kelembapan
        : null

    // Temukan nilai kelembapan terendah dalam dokumen kelembapan
    const lowestHumidity =
      chartLogsKelembapan.length > 0 ? chartLogsKelembapan[0].kelembapan : null

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

// get sisa pakan
const getSisaPakan = async (req, res) => {
  try {
    const log = await Log.findOne()
    res.json({ sisaPakan: log.sisaPakan })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Logic untuk mengurangi nilai sisaPakan setiap 5 detik
// setInterval(async () => {
//   try {
//     const log = await Log.findOne()
//     if (log.sisaPakan > 0) {
//       log.sisaPakan -= 1
//       await log.save()
//     }
//   } catch (err) {
//     console.error(err)
//   }
// }, 5000)

module.exports = {
  createLog,
  findLatestLog,
  getChartLog,
  getChartLog24,
  getMinMax24,
  findLogById,
  updateSisaPakan,
  // getSisaPakan,
  // setSocketIO,
}
