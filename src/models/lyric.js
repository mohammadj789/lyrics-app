const mongoose = require("mongoose");
const lyricSchema = new mongoose.Schema(
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
    lyric: [
      {
        start: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
      },
    ],
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);
const Lyric = mongoose.model("Lyric", lyricSchema);

module.exports = Lyric;
