const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema(
  {
    products: Array,
    expireAt: {
      type: Date,
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);
const Cart = mongoose.model("Cart", CartSchema, "carts");
module.exports = Cart;
