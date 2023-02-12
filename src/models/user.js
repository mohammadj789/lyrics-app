const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Lyric = require("./lyric");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes("password"))
        throw new Error("try another PASSWORD");
    },
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value))
        throw new Error("email is invalid");
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  score: {
    type: Number,
    default: 0,
  },
  role: { type: String, default: "user" },
  favorits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lyric",
      unique: true,
    },
  ],
});
userSchema.virtual("lyrics", {
  ref: "Lyric",
  localField: "_id",
  foreignField: "writer",
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  const lyrics = await Lyric.find({ writer: user._id });
  for (const lyric of lyrics) {
    lyric.writer = undefined;
    await lyric.save();
  }
  next();
});

userSchema.methods.createAuthTocken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JTWTOKEN
  );
  // console.log(token);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.checkForLogin = async function ({
  email,
  password,
}) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("username or password is wrong");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("username or password is wrong");
  }
  return user;
};
const User = mongoose.model("User", userSchema);

module.exports = User;
