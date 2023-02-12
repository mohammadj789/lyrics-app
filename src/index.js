require("./db/mongoose");
const express = require("express");
const userRouter = require("./router/user");
const lyricRouter = require("./router/lyric");
const songRouter = require("./router/song");

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(lyricRouter);
app.use(songRouter);

app.listen(process.env.PORT, () => {
  console.log(`server is listening on port ${process.env.PORT}`);
});
