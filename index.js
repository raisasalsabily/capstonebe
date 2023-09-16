const express = require("express")
const app = express()
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cors = require("cors")

const logRoute = require("./routes/log")

// initialize config
dotenv.config({ path: ".env" })

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// connect to DB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(console.log("Connected to MONGODB"))
  .catch((err) => console.log(err))

app.use("/api/log", logRoute)

app.use("/", (req, res) => {
  res.send("main url server iot kandang")
})

app.listen(process.env.PORT, () => {
  console.log(`Backend is running on port ${process.env.PORT}`)
})
