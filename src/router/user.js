const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");

// const User = require("../models/user");

router.post("/user", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.createAuthTocken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.checkForLogin(req.body);
    const token = await user.createAuthTocken();

    res.status(200).send({ user, token });
  } catch (error) {
    res.status(404).send(error.message);
  }
});
router.post("/user/logout", userAuth, async (req, res) => {
  try {
    const user = req.body.user;
    const currentToken = req.body.token;

    user.tokens = user.tokens.filter(
      (token) => token.token !== currentToken
    );
    user.save();
    res.send();
  } catch (error) {
    res.status(404).send(error.message);
  }
});
router.post(
  "/user/logoutAll",
  userAuth,

  async (req, res) => {
    try {
      const user = req.body.user;

      user.tokens = undefined;
      user.save();
      res.send();
    } catch (error) {
      res.status(404).send(error.message);
    }
  }
);
router.delete("/user", userAuth, async (req, res) => {
  try {
    const user = req.body.user;
    user.remove();
    res.send();
  } catch (error) {
    res.status(404).send(error.message);
  }
});
router.get("/user/me", userAuth, async (req, res) => {
  res.send(req.body);
});
module.exports = router;
