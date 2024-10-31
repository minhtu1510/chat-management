const Role = require("../../models/role.model");
const { prefixAdmin } = require("../../config/system");

module.exports.index = async (req, res) => {
  const records = await Role.find({
    deleted: false,
  });

  res.render("admin/pages/roles/index", {
    pageTitle: "Nhóm quyền",
    records: records,
  });
};

module.exports.create = async (req, res) => {
  res.render("admin/pages/roles/create", {
    pageTitle: "Tạo nhóm quyền",
  });
};

module.exports.createPost = async (req, res) => {
  const newRecord = new Role(req.body);
  await newRecord.save();

  res.redirect(`/${prefixAdmin}/roles`);
};

module.exports.edit = async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    deleted: false,
  });
  res.render("admin/pages/roles/edit", {
    pageTitle: "Chỉnh sửa nhóm quyền",
    role: role,
  });
};

module.exports.editPatch = async (req, res) => {
  const id = req.params.id;
  await Role.updateOne(
    {
      _id: id,
      deleted: false,
    },
    req.body
  );

  req.flash("success", "Cập nhật thành công !");
  res.redirect("back");
};

module.exports.permissions = async (req, res) => {
  const records = await Role.find({
    deleted: false,
  });

  res.render("admin/pages/roles/permissions", {
    pageTitle: "Phân quyền",
    records: records,
  });
};

module.exports.permissionsPatch = async (req, res) => {
  for (const item of req.body) {
    await Role.updateOne(
      {
        _id: item.id,
      },
      {
        permissions: item.permissions,
      }
    );
  }
  req.flash("success", "Cập nhật thành công!");
  res.json({
    code: "success",
  });
};

