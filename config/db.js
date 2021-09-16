require("dotenv").config({ path: "../config.env" });
const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  });
  console.log("Succesfully connected to DB")
};


module.exports = connectDB