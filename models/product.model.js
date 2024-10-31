const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const Product = mongoose.model(
  "Product",
  {
    title: String,
    slug: {
      type: String,
      slug: "title",
      unique: true,
    },
    category_id: String,
    description: String,
    price: Number,
    discountPercentage: Number,
    stock: Number,
    thumbnail: String,
    status: String,
    position: Number,
    createdBy: String,
    createdAt: Date,
    updatedBy: String,
    updatedAt: Date,
    deletedBy: String,
    deletedAt: Date,
    featured: {
      type: String,
      default: "0",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  "products"
);


module.exports = Product;
