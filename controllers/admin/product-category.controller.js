const { prefixAdmin } = require("../../config/system");
const ProductCategory = require("../../models/product-category.model");

module.exports.index = async (req, res) => {
  const listCategory = await ProductCategory.find({
    deleted: false,
  });
  res.render("admin/pages/products-category/index", {
    pageTitle: "Danh sách danh mục sản phẩm",
    listCategory: listCategory,
  });
};

module.exports.create = async (req, res) => {
  const listCategory = await ProductCategory.find({
    deleted: false,
  });
  res.render("admin/pages/products-category/create", {
    pageTitle: "Tạo danh mục sản phẩm",
    listCategory: listCategory,
  });
};

module.exports.createPost = async (req, res) => {
  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const countRecord = await ProductCategory.countDocuments();
    req.body.position = countRecord + 1;
  }
  console.log(req.body);
  const newRecord = new ProductCategory(req.body);
  await newRecord.save();

  res.redirect(`/${prefixAdmin}/products-category`);
};

module.exports.edit = async (req, res) => {
  console.log(req.params.id);
  const listCategory = await ProductCategory.find({
    deleted: false,
  });
  const category = await ProductCategory.findOne({
    _id: req.params.id,
    deleted: false,
  });

  res.render("admin/pages/products-category/edit", {
    pageTitle: "Chỉnh sửa danh mục",
    listCategory: listCategory,
    category: category,
  });
};

module.exports.editPatch = async (req, res) => {
  const id = req.params.id;

  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    delete req.body.position;
  }

  await ProductCategory.updateOne(
    {
      _id: id,
      deleted: false,
    },
    req.body
  );

  req.flash("success", "Cập nhật thành công !");
  res.redirect("back");
};