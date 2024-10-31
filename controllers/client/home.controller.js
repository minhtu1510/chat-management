const Product = require("../../models/product.model");
module.exports.index = async (req, res) => {
  //Sản phẩm nổi bật
  const productsFeatured = await Product.find({
    deleted: false,
    status: "active",
    featured: "1",
  })
    .sort({
      position: "desc",
    })
    .limit(6);

  for (const item of productsFeatured) {
    item.priceNew = (1 - item.discountPercentage / 100) * item.price;
    item.priceNew = item.priceNew.toFixed(0);
  }
  //Sản phẩm mới
  const productsNew = await Product.find({
    deleted: false,
    status: "active",
  })
    .sort({
      position: "desc",
    })
    .limit(6);

  for (const item of productsNew) {
    item.priceNew = (1 - item.discountPercentage / 100) * item.price;
    item.priceNew = item.priceNew.toFixed(0);
  }

  //Sản phẩm giảm giá bao nhiu
  const productsDiscount = await Product.find({
    deleted: false,
    status: "active",
  })
    .sort({
      discountPercentage: "desc",
    })
    .limit(6);

  for (const item of productsDiscount) {
    item.priceNew = (1 - item.discountPercentage / 100) * item.price;
    item.priceNew = item.priceNew.toFixed(0);
  }
  //Lấy ra các sản phẩm cụ thể(theo id)
  const productsId = await Product.find({
    deleted: false,
    status: "active",
  })
    .sort({
      discountPercentage: "desc",
    })
    .limit(6);

  for (const item of productsId) {
    item.priceNew = (1 - item.discountPercentage / 100) * item.price;
    item.priceNew = item.priceNew.toFixed(0);
  }

  res.render("client/pages/home/index", {
    pageTitle: "Trang chủ",
    productsFeatured: productsFeatured,
    productsNew: productsNew,
    productsDiscount: productsDiscount,
  });
};
