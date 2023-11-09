const express = require("express")
const http = require("http")
// const socketIo = require("socket.io")
const mongoose = require("mongoose")

const app = express()
const server = http.createServer(app)
// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//   },
// })

const dotenv = require("dotenv")
const cors = require("cors")

const logRoute = require("./routes/log")

// initialize config
dotenv.config({ path: ".env" })

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Konfigurasi CORS
app.use(
  cors({
    origin: "https://kandangkoo.vercel.app", // Ganti dengan domain Anda
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
)

// connect to DB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(console.log("Connected to MONGODB"))
  .catch((err) => console.log(err))

// Express.js API endpoint to fetch log data
app.use("/api/log", logRoute)

app.use("/", (req, res) => {
  res.send("main url server iot kandang")
})

// Socket.io
// io.on("connection", (socket) => {
//   console.log("socket.io user connected")
// })

// Start server
server.listen(process.env.PORT, () => {
  console.log(`Backend is running on port ${process.env.PORT}`)
  // io.on("connection", function (socket) {
  //   console.log("User connected: " + socket.id)
  // })
})
