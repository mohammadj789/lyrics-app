const express = require("express");
const Song = require("../models/song");
const router = new express.Router();
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Lyric = require("../models/lyric");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "songs");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp3)/))
      cb(new Error("file must be mp3"));
    else cb(undefined, true);
  },
  storage: storage,
  limits: {
    fileSize: 10000000,
  },
});

router.post(
  "/song",
  userAuth,
  upload.single("track"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).send({ error: "please upload a file" });
    }
    const song = new Song({
      ...req.body,
      address: path.join(__dirname, "../..", "songs", file.filename),
    });
    await song.save();
    res.status(200).send(song);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/song/check", userAuth, adminAuth, async (req, res) => {
  try {
    const songs = await Song.find({ status: "pending" });
    if (!songs) return res.status(404).send();
    res.send(songs);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post(
  "/song/check/:id",
  userAuth,
  adminAuth,
  async (req, res) => {
    try {
      const { accept } = req.body;
      const songID = req.params.id;

      const song = await Song.findById(songID);

      if (!song) return res.status(404).send();

      if (accept === true) {
        song.status = "verified";
        await song.save();
      } else if (accept === false) {
        song.status = "rejected";
        await fs.promises.unlink(song.address);

        song.address = "deleted";

        await song.save();
      } else return res.status(404).send();
      res.status(200).send();
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

router.get("/song", async function (req, res) {
  try {
    const name = req.query.search;
    const song = await Song.find({
      name: { $regex: name, $options: "i" },
      status: "verified",
    });

    if (!song) return res.status(404).send();
    res.status(200).send(song);
  } catch (err) {
    return res.status(500).send(err);
  }
});
router.post("/song/link", userAuth, async function (req, res) {
  try {
    const { songID, lyricID } = req.body;
    const song = await Song.findById(songID);

    if (song.lyric)
      return res
        .status(400)
        .send({ error: "this song already has an aproved lyric " });

    if (song.rejected.includes(lyricID))
      return res.status(400).send({
        error: "this lyric is not a good one for this song",
      });

    if (song.requests.includes(lyricID))
      return res
        .status(409)
        .send({ error: "this request is in waiting list" });

    const lyric = await Lyric.findById(lyricID);

    if (
      !song ||
      song.status == "rejected" ||
      !lyric ||
      lyric.status == "rejected"
    )
      return res.status(404).send();
    song.requests = [...song.requests, lyricID];
    await song.save();
    res.status(200).send(song);
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post(
  "/song/link/:songid",
  userAuth,
  adminAuth,
  async function (req, res) {
    try {
      const songID = req.params.songid;
      const { lyricID, accept } = req.body;

      const song = await Song.findById(songID);
      if (!song) return res.status(404).send();

      if (!song.requests.includes(lyricID))
        return res.status(400).send({
          error: "this lyric is not valid for this item",
        });

      if (accept === true) {
        song.lyric = lyricID;
        song.rejected = undefined;
        song.requests = undefined;
        await song.save();
        res.status(200).send();
      } else if (accept === false) {
        song.rejected = [...song.rejected, lyricID];
        song.requests = song.rejected.filter(
          (req) => req.toString() !== lyricID
        );
        await song.save();
        res.status(200).send();
      }
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

router.get("/song/:id", async function (req, res) {
  try {
    const song = await Song.findById(req.params.id);

    if (!song || song.status !== "verified")
      return res.status(404).send();
    res.status(200).send(song);
  } catch (err) {
    return res.status(500).send(err);
  }
});
module.exports = router;
