const User = require("../../models/user.model");
const md5 = require("md5");

const generateHelper = require("../../helpers/generate.helper");
const forgotPassword = require("../../models/forgot-password.model");
const sendMailHelper = require("../../helpers/sendMail.helper");

const userSocket = require("../../sockets/client/user.socket");
const RoomChat = require("../../models/rooms-chat.model");
const { infoUser } = require("../../middlewares/client/user.middleware");

module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

module.exports.registerPost = async (req, res) => {
  const user = req.body;

  const existUser = await User.findOne({
    email: user.email,
    deleted: false,
  });
  if (existUser) {
    req.flash("error", "Email đã tồn tại trong hệ thống !");
    res.redirect("back");
    return;
  }

  const dataUser = {
    fullName: user.fullName,
    email: user.email,
    password: md5(user.password),
    token: generateHelper.generateRandomString(30),
    status: "active",
  };

  const newUser = new User(dataUser);
  await newUser.save();

  res.cookie("tokenUser", newUser.token);

  req.flash("success", "Đăng ký tài khoản thành công !");

  res.redirect("/");
};

module.exports.login = async (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  });
};

module.exports.loginPost = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const existUser = await User.findOne({
    email: email,
    deleted: false,
  });

  if (!existUser) {
    req.flash("error", "Email không tồn tại");
    res.redirect("back");
    return;
  }
  if (md5(password) != existUser.password) {
    req.flash("error", "Sai mật khẩu");
    res.redirect("back");
    return;
  }
  if (existUser.status != "active") {
    req.flash("error", "Tài khoản đã bị khóa");
    res.redirect("back");
    return;
  }
  res.cookie("tokenUser", existUser.token);
  await User.updateOne(
    {
      email: email,
    },
    {
      statusOnline: "online",
    }
  );

  _io.once("connection", (socket) => {
    _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
      userId: existUser.id,
      statusOnline: "online",
    });
  });

  req.flash("success", "Đăng nhập thành công !");
  res.redirect("/");
};

module.exports.logout = async (req, res) => {
  await User.updateOne(
    {
      token: req.cookies.tokenUser,
    },
    {
      statusOnline: "offline",
    }
  );
  _io.once("connection", (socket) => {
    _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
      userId: res.locals.user.id,
      statusOnline: "offline",
    });
  });
  res.clearCookie("tokenUser");
  req.flash("success", "Đã đăng xuất !");
  res.redirect("/");
};

module.exports.forgotPassword = async (req, res) => {
  res.render("client/pages/user/forgot-password", {
    pageTitle: "Lấy lại mật khẩu",
  });
};

module.exports.forgotPasswordPost = async (req, res) => {
  const email = req.body.email;

  const existUser = await User.findOne({
    email: email,
    status: "active",
    deleted: false,
  });

  if (!existUser) {
    req.flash("error", "Email không tồn tại !");
    res.redirect("back");
    return;
  }

  // Việc 1:Lưu email và mã OTP vào database
  const existEmailInForgotPassword = await forgotPassword.findOne({
    email: email,
  });
  if (!existEmailInForgotPassword) {
    const otp = generateHelper.generateRandomNumber(6);
    const data = {
      email: email,
      otp: otp,
      expireAt: Date.now() + 5 * 60 * 1000,
    };

    const record = new forgotPassword(data);
    await record.save();

    // Việc 2:Gửi mã OTP qua email cho user
    const subject = "Xác thực mã OTP";
    const text = `Mã xác thực của bạn là :${otp}.Mã otp có hiệu lực trong vòng 5 phút ,vui lòng không cung cấp mã OTP cho bất kì ai`;
    sendMailHelper.sendMail(email, subject, text);
  }
  res.redirect(`/user/password/otp?email=${email}`);
};

module.exports.otpPassword = async (req, res) => {
  const email = req.query.email;
  res.render("client/pages/user/otp-password", {
    pageTitle: "Xác thực OTP",
    email: email,
  });
};

module.exports.otpPasswordPost = async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;
  const existUser = await forgotPassword.findOne({
    email: email,
    otp: otp,
  });

  if (!existUser) {
    req.flash("error", "Mã OTP không hợp lệ !");
    res.redirect("back");
    return;
  }
  const user = await User.findOne({
    email: email,
  });
  res.cookie("tokenUser", user.token);
  res.redirect("/user/password/reset");
};

module.exports.resetPassword = async (req, res) => {
  const email = req.query.email;
  res.render("client/pages/user/reset-password", {
    pageTitle: "Đặt lại mật khẩu",
    email: email,
  });
};

module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password;
  const tokenUser = req.cookies.tokenUser;
  await User.updateOne(
    {
      token: tokenUser,
      status: "active",
      deleted: false,
    },
    {
      password: md5(password),
    }
  );
  req.flash("success", "Đổi mật khẩu thành công !");
  res.redirect("/");
};

module.exports.profile = async (req, res) => {
  res.render("client/pages/user/profile", {
    pageTitle: "Thông tin tài khoản",
  });
};

module.exports.notFriend = async (req, res) => {
  const userIdA = res.locals.user.id;
  userSocket(req, res);
  const friendsList = res.locals.user.friendsList;
  const friendListId = friendsList.map((item) => item.userId);

  const users = await User.find({
    $and: [
      { _id: { $ne: userIdA } },
      { _id: { $nin: res.locals.user.requestFriends } },
      { _id: { $nin: res.locals.user.acceptFriends } },
      { _id: { $nin: friendListId } },
    ],
    deleted: false,
    status: "active",
  });
  res.render("client/pages/user/not-friend", {
    pageTitle: "Danh sách người dùng",
    users: users,
  });
};

module.exports.request = async (req, res) => {
  userSocket(req, res);

  const users = await User.find({
    _id: { $in: res.locals.user.requestFriends },
    deleted: false,
    status: "active",
  });
  res.render("client/pages/user/request", {
    pageTitle: "Lời mời đã gửi",
    users: users,
  });
};

module.exports.accept = async (req, res) => {
  userSocket(req, res);

  const users = await User.find({
    _id: { $in: res.locals.user.acceptFriends },
    deleted: false,
    status: "active",
  });
  res.render("client/pages/user/accept", {
    pageTitle: "Lời mời đã nhận",
    users: users,
  });
};

module.exports.friends = async (req, res) => {
  // const userIdA = res.locals.user.id;
  const friendsList = res.locals.user.friendsList;
  // const friendListId = friendsList.map((item) => item.userId);
  const users = [];

  for (const user of friendsList) {
    const infoUser = await User.findOne({
      _id: user.userId,
      deleted: false,
      status: "active",
    });
    users.push({
      id: infoUser.id,
      fullName: infoUser.fullName,
      avatar: infoUser.avatar,
      statusOnline: infoUser.statusOnline,
      roomChatId: user.roomChatId,
    });
  }
  res.render("client/pages/user/friends", {
    pageTitle: "Danh sách bạn bè",
    users: users,
  });
};

module.exports.rooms = async (req, res) => {
  const listRoomChat = await RoomChat.find({
    "users.userId": res.locals.user.id,
    typeRoom: "group",
    deleted: false,
  });
  res.render("client/pages/user/rooms", {
    pageTitle: "Phòng chat",
    listRoomChat: listRoomChat,
  });
};

module.exports.createRoom = async (req, res) => {
  const friendsList = res.locals.user.friendsList;
  const friendsListFinal = [];
  for (const item of friendsList) {
    const infoFriend = await User.findOne({
      _id: item.userId,
      deleted: false,
    });
    if (infoFriend) {
      friendsListFinal.push({
        userId: item.userId,
        fullName: infoFriend.fullName,
      });
    }
  }
  res.render("client/pages/user/create-room", {
    pageTitle: "Tạo phòng chat",
    friendsList: friendsListFinal,
  });
};

module.exports.createRoomPost = async (req, res) => {
  const title = req.body.title;
  const usersId = req.body.usersId;

  const dataRoom = {
    title: title,
    typeRoom: "group",
    users: [],
  };
  dataRoom.users.push({
    userId: res.locals.user.id,
    role: "superAdmin",
  });
  for (const item of usersId) {
    dataRoom.users.push({
      userId: item,
      role: "user",
    });
  }
  const newRoom = new RoomChat(dataRoom);
  await newRoom.save();
  res.redirect(`/chat/${newRoom.id}`);
};




