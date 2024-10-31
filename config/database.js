const mongoose = require("mongoose");
require("dotenv").config();

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Kết nối thành công");
  } catch (error) {
    console.log(error);
  }
};
