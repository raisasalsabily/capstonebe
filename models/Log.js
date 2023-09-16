const { Double } = require("bson")
const mongoose = require("mongoose")

const LogSchema = new mongoose.Schema(
  {
    suhu: {
      type: Number,
      required: true,
    },
    kelembapan: {
      type: Number,
      required: true,
    },
    waktuPakan: {
      type: Date,
      required: true,
      default: Date.now,
    },
    waktuDisinfek: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // note: untuk Date.now masih dummy, selanjutnya harusnya diubah ke waktu pemberian sebenarnya
    kipasStatus: {
      type: Boolean,
      required: true,
    },
    lampuStatus: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Log", LogSchema)
