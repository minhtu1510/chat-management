const roomChat = require("../../models/rooms-chat.model");
const RoomChat = require("../../models/rooms-chat.model");
const User = require("../../models/user.model");

module.exports = (req, res) => {
  const userIdA = res.locals.user.id;
  _io.once("connection", (socket) => {
    //Gửi lời mời kết bạn
    socket.on("CLIENT_ADD_FRIEND", async (userIdB) => {
      // Thêm id của A vào acceptFriends của B
      const existAInB = await User.findOne({
        _id: userIdB,
        acceptFriends: userIdA,
      });
      if (!existAInB) {
        await User.updateOne(
          {
            _id: userIdB,
          },
          {
            $push: { acceptFriends: userIdA },
          }
        );
      }
      // Thêm id của B vào requestFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        requestFriends: userIdB,
      });
      if (!existBInA) {
        await User.updateOne(
          {
            _id: userIdA,
          },
          {
            $push: { requestFriends: userIdB },
          }
        );
      }
      //Trả về cho B số lượng user cần chấp nhận
      const userB = await User.findOne({
        _id: userIdB,
        deleted: false,
        status: "active",
      });
      _io.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIENDS", {
        userIdB: userIdB,
        length: userB.acceptFriends.length,
      });
      //Trả về cho B thông tin của A
      _io.emit("SERVER_RETURN_INFO_ACCECPT_FRIENDS", {
        userIdA: userIdA,
        fullNameA: res.locals.user.fullName,
        avatarA: "",
        userIdB: userIdB,
      });
    });

    //Khi A hủy gửi yêu cầu cho B
    socket.on("CLIENT_CANCEL_FRIEND", async (userIdB) => {
      // Xóa id của A vào acceptFriends của B
      const existAInB = await User.findOne({
        _id: userIdB,
        acceptFriends: userIdA,
      });
      if (existAInB) {
        await User.updateOne(
          {
            _id: userIdB,
          },
          {
            $pull: { acceptFriends: userIdA },
          }
        );
      }
      // Xóa id của B vào requestFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        requestFriends: userIdB,
      });
      if (existBInA) {
        await User.updateOne(
          {
            _id: userIdA,
          },
          {
            $pull: { requestFriends: userIdB },
          }
        );
      }
      //Trả về cho B số lượng user cần chấp nhận mới nhất
      const userB = await User.findOne({
        _id: userIdB,
        deleted: false,
        status: "active",
      });
      _io.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIENDS", {
        userIdB: userIdB,
        length: userB.acceptFriends.length,
      });
      //Trả về cho B userId của A để xóa khỏi giao diện
      _io.emit("SERVER_RETURN_USER_ID_CANCEL_FRIEND", {
        userIdB: userIdB,
        userIdA: userIdA,
      });
    });

    //Khi A từ chối kết bạn
    socket.on("CLIENT_REFUSE_FRIEND", async (userIdB) => {
      // Xóa id của B vào acceptFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        acceptFriends: userIdB,
      });
      if (existBInA) {
        await User.updateOne(
          {
            _id: userIdA,
          },
          {
            $pull: { acceptFriends: userIdB },
          }
        );
      }
      // Xóa id của A vào requestFriends của B
      const existAInB = await User.findOne({
        _id: userIdB,
        requestFriends: userIdA,
      });
      if (existAInB) {
        await User.updateOne(
          {
            _id: userIdB,
          },
          {
            $pull: { requestFriends: userIdA },
          }
        );
      }
    });

    //Khi A chấp nhận kết bạn B
    socket.on("CLIENT_ACCEPT_FRIEND", async (userIdB) => {
      //Thêm {user_id,roomChatId} của A vào friendList của B
      //Xóa id của B trong acceptFiends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        acceptFriends: userIdB,
      });

      const existAInB = await User.findOne({
        _id: userIdB,
        requestFriends: userIdA,
      });

      if (existBInA && existAInB) {
        //Tạo phòng chat chung cho A và B
        const roomChat = new RoomChat({
          typeRoom: "friend",
          users: [
            {
              userId: userIdA,
              role: "superAdmin",
            },
            {
              userId: userIdB,
              role: "superAdmin",
            },
          ],
        });
        await roomChat.save();
        await User.updateOne(
          {
            _id: userIdA,
          },
          {
            $pull: { acceptFriends: userIdB },
            $push: {
              friendsList: {
                userId: userIdB,
                roomChatId: roomChat.id,
              },
            },
          }
        );

        //Thêm {user_id,roomChatId} của B vào friendList của A

        //Xóa id của A trong requestFiends của B

        await User.updateOne(
          {
            _id: userIdB,
          },
          {
            $pull: { requestFriends: userIdA },
            $push: {
              friendsList: {
                userId: userIdA,
                roomChatId: roomChat.id,
              },
            },
          }
        );
      }
    });
  });
};
