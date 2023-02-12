const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.on("connected", () => {
  console.log("database is connected");
});
mongoose.connection.on("error", (err) => {
  console.error("error connecting mongo", err);
});
//C:\mongoDB\Database\bin\mongod.exe --dbpath=C:\mongoDB\Data
