const mongoose = require("mongoose");
const songSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    album: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
    },
    lyric: {
      type: mongoose.Schema.Types.ObjectId,
    },
    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lyric",
      },
    ],
    rejected: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lyric",
      },
    ],
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);
const Song = mongoose.model("Song", songSchema);

module.exports = Song;
