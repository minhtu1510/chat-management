const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    address: String,
    products: Array,
    acceptFriends: Array, //Danh sách người cần chấp nhận
    requestFriends: Array, //Danh sách những người đã gửi yêu cầu đi
    friendsList: Array, //Danh sách bạn bè
  },
  {
    timestamps: true,
  }
);
const Order = mongoose.model("Order", orderSchema, "orders");
module.exports = Order;
