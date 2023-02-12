const express = require("express");
const Lyric = require("../models/lyric");
const User = require("../models/user");
const router = new express.Router();
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
const mongoose = require("mongoose");

router.post("/lyrics", userAuth, async (req, res) => {
  const user = req.body.user;

  const lyric = new Lyric({ ...req.body, writer: user._id });
  try {
    await lyric.save();
    res.status(201).send(lyric);
  } catch (error) {
    console.log(error);

    res.status(400).send(error);
  }
});

router.get("/lyrics/me", userAuth, async (req, res) => {
  try {
    const states = ["rejected", "pending", "verified", undefined];
    const status = req.query.status;

    if (!states.includes(status)) return res.status(404).send();

    await req.body.user.populate({
      path: "lyrics",
      match: { status: status ? status : "verified" },
    });
    const lyrics = req.body.user.lyrics;
    if (!lyrics) return res.status(404).send();
    res.status(200).send(lyrics);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/lyrics/check", userAuth, adminAuth, async (req, res) => {
  try {
    const lyrics = await Lyric.find({ status: "pending" });
    if (!lyrics) return res.status(404).send();
    res.send(lyrics);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post(
  "/lyrics/check/:id",
  userAuth,
  adminAuth,
  async (req, res) => {
    try {
      const { accept } = req.body;
      const lyricID = req.params.id;
      const lyric = await Lyric.findById(lyricID);
      console.log(lyric);

      if (!lyric) return res.status(404).send();

      if (accept === true) {
        lyric.status = "verified";
        await lyric.save();
        const user = await User.findById(lyric.writer);
        if (!user) return res.status(200).send();
        user.score += 20;
        await user.save();
      } else if (accept === false) {
        lyric.status = "rejected";
        await lyric.save();
      } else return res.status(404).send();
      res.status(200).send();
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

router.post(
  "/lyrics/favorit/:id",
  userAuth,
  async function (req, res) {
    try {
      const { remove } = req.body;
      const user = req.body.user;
      const lyricID = req.params.id;
      console.log(remove);

      if (remove === false) {
        const lyric = await Lyric.findById(lyricID);

        if (!lyric || lyric.status !== "verified")
          return res.status(404).send();

        if (user.favorits.includes(lyricID))
          return res.status(409).send();

        await User.findOneAndUpdate(user._id, {
          favorits: [...user.favorits, lyricID],
        });
        return res.status(200).send();
      } else if (remove === true && user.favorits.includes(lyricID)) {
        user.favorits = user.favorits.filter(
          (id) => id.toString() !== lyricID
        );
        await user.save();
        return res.status(200).send();
      } else return res.status(404).send();
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
);

router.get("/lyrics/favorit", userAuth, async function (req, res) {
  try {
    const user = req.body.user;

    const favorits = await Lyric.find({
      _id: {
        $in: user.favorits,
      },
    });
    res.status(200).send(favorits);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.get("/lyrics", async function (req, res) {
  try {
    const name = req.query.search;
    const lyric = await Lyric.find({
      name: { $regex: name, $options: "i" },
      status: "verified",
    });

    if (!lyric) return res.status(404).send();
    res.status(200).send(lyric);
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.get("/lyrics/:id", async function (req, res) {
  try {
    const lyric = await Lyric.findById(req.params.id);

    if (!lyric || lyric.status == "rejected")
      return res.status(404).send();
    res.status(200).send(lyric);
  } catch (err) {
    return res.status(500).send(err);
  }
});

module.exports = router;
