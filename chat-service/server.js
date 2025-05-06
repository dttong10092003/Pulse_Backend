const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();
const cors = require('cors');

const messageRoutes = require("./routes/messageRoute");
const conversationRoutes = require("./routes/conversationRoute");
const deletedConversationRoutes = require("./routes/deletedConversationRoutes");
const redisClient = require("./config/redisClient");
const Message = require("./models/message");
const Conversation = require("./models/conversation");
const DeletedConversation = require("./models/deletedConversation");
const { sendMessage } = require("./controllers/messageController");
const { uploadToCloudinary } = require("./utils/cloudinary");
const { parseBase64 } = require("./utils/parseBase64");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:4000", "https://pulse-azure.vercel.app/"],
    methods: ["GET", "POST"],
    credentials: true
  }
});


app.use(express.json());

app.use(cors());

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use("/deleted-conversations", deletedConversationRoutes);

// Socket.io xử lý real-time
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);
  socket.on("setup", (userId) => {
    socket.join(userId); // Cho phép emit đến userId như một room
  });

  // Khi người dùng online
  socket.on("userOnline", async (userId) => {
    await redisClient.set(`online:${userId}`, "1", { EX: 300 }); // Online trong 5 phút
    console.log(`✅ User ${userId} is online`);
  });

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
    console.log(`📌 User joined room: ${conversationId}`);
  });

  socket.on(
    "sendMessage",
    async ({
      conversationId,
      senderId,
      type,
      content,
      name,
      senderAvatar,
      timestamp,
      isDeleted,
      isPinned,
      fileName,
      fileType,
    }) => {
      console.log("Received message from client:", content);

      // const newMessage = new Message({ conversationId, senderId, type, content, timestamp, isDeleted, isPinned });

      try {
        // Gọi hàm sendMessage từ controller để xử lý và lưu tin nhắn
        // const newMessage = await sendMessage({ conversationId, senderId, type, content, timestamp, isDeleted, isPinned });
        const newMessage = await sendMessage({
          conversationId,
          senderId,
          type,
          content,
          timestamp,
          isDeleted,
          isPinned,
          fileName,
          fileType,
        });

        // Gửi tin nhắn tới các client trong phòng chat tương ứng
        // io.to(conversationId).emit('newMessage', newMessage);
        io.to(conversationId).emit("receiveMessage", {
          ...newMessage.toObject(),
          name,
          senderAvatar,
        });
        console.log("✅ Sent new message to room:", conversationId);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );

  socket.on("revokeMessage", async (data) => {
    const { messageId, senderId, conversationId } = data;

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if (message.senderId.toString() !== senderId.toString()) {
        return socket.emit("error", {
          message: "You don't have permission to revoke this message",
        });
      }

      message.isDeleted = true;
      message.content = "Message revoked";
      message.type = "text";
      await message.save();

      // Phát sự kiện cho tất cả các client trong phòng chat
      io.to(conversationId).emit("messageRevoked", {
        messageId,
        senderId,
        conversationId,
      });

      console.log(
        "✅ Message revoked and event emitted to room:",
        conversationId
      );
    } catch (error) {
      console.error("Error revoking message:", error);
    }
  });

  socket.on("deleteMessage", async (data) => {
    const { messageId, senderId, conversationId } = data;

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if (message.senderId.toString() !== senderId.toString()) {
        return socket.emit("error", {
          message: "You don't have permission to delete this message",
        });
      }

      await message.deleteOne();

      // Phát sự kiện cho tất cả các client trong phòng chat
      io.to(conversationId).emit("messageDeleted", {
        messageId,
        senderId,
        conversationId,
      });

      console.log(
        "✅ Message deleted and event emitted to room:",
        conversationId
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  // Lắng nghe sự kiện tạo cuộc trò chuyện mới
  socket.on("createPrivateConversation", async (data) => {
    const { members } = data; // members là mảng gồm 2 user (userA và userB)

    try {
      // Tạo cuộc trò chuyện mới mà không kiểm tra sự tồn tại
      const conversation = new Conversation({
        members: members.map((member) => member.userId),
        isGroup: false,
      });

      await conversation.save();

      const conversationWithDetails = {
        _id: conversation._id,
        ...conversation.toObject(),
        members: members.map((member) => ({
          userId: member.userId,
          name: member.name,
          avatar: member.avatar || "",
        })),
        messages: [], // Thêm trường messages nếu cần thiết
      };

      // ✅ Gửi riêng cho từng user trong cặp
      members.forEach((member) => {
        io.to(member.userId).emit("newConversation", conversationWithDetails);
      });

      console.log(
        `✅ New conversation created and emitted: ${conversation._id}`
      );
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  });

  socket.on("createGroupConversation", async (data) => {
    const { groupName, members, adminId, avatar } = data;

    try {
      let avatarUrl = "";

      if (avatar && typeof avatar === "string") {
        const { mimeType, buffer } = parseBase64(avatar);
        const ext = mimeType.split("/")[1];
        const fileName = `group_${Date.now()}.${ext}`;
        avatarUrl = await uploadToCloudinary(buffer, fileName, "group_avatars");
      }

      const memberIds = members.map((member) => member.userId);

      const conversation = new Conversation({
        groupName,
        members: memberIds,
        isGroup: true,
        adminId,
        avatar: avatarUrl,
      });

      await conversation.save();

      const conversationWithDetails = {
        _id: conversation._id,
        ...conversation.toObject(),
        members: members.map((member) => ({
          userId: member.userId,
          name: member.name,
          avatar: member.avatar || "",
        })),
        messages: [],
      };

      members.forEach((member) => {
        io.to(member.userId).emit("newConversation", conversationWithDetails);
      });

      console.log(
        `✅ Group conversation created and emitted: ${conversation._id}`
      );
    } catch (error) {
      console.error("❌ Error creating group conversation:", error);
    }
  });

  socket.on("leaveGroup", async ({ conversationId, userId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      // Xóa thành viên khỏi nhóm
      conversation.members = conversation.members.filter(
        (id) => id.toString() !== userId
      );
      await conversation.save();

      // Xóa DeletedConversation
      await DeletedConversation.deleteOne({ userId, conversationId });

      // Emit cho tất cả thành viên trong phòng biết ai đã rời nhóm
      io.to(conversationId).emit("memberLeft", {
        conversationId,
        userId,
      });
    } catch (error) {
      console.error("Error in leaveGroup:", error);
    }
  });

  // XÓA THÀNH VIÊN
  socket.on("removeMember", async ({ conversationId, userIdToRemove }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      // Xóa thành viên khỏi mảng
      conversation.members = conversation.members.filter(
        (id) => id.toString() !== userIdToRemove
      );
      await conversation.save();

      // Xóa DeletedConversation
      await DeletedConversation.deleteOne({
        userId: userIdToRemove,
        conversationId,
      });

      // Emit tới tất cả các user trong room
      io.to(conversationId).emit("memberRemoved", {
        conversationId,
        userId: userIdToRemove,
      });
    } catch (error) {
      console.error("Error in removeMember:", error);
    }
  });

  // CHUYỂN QUYỀN ADMIN
  socket.on("transferAdmin", async ({ conversationId, newAdminId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      conversation.adminId = newAdminId;
      await conversation.save();

      io.to(conversationId).emit("adminTransferred", {
        conversationId,
        newAdminId,
      });
    } catch (error) {
      console.error("Error in transferAdmin:", error);
    }
  });

  //add member
  socket.on("addMembersToGroup", async ({ conversationId, newMembers }) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    const membersToAdd = newMembers.map((member) => member.userId);
    conversation.members.push(...membersToAdd);
    await conversation.save();

    // Emit cập nhật lại cho tất cả thành viên hiện tại
    io.to(conversationId).emit("memberAdded", {
      conversationId,
      newMembers,
    });

    console.log("conveersation", conversation, "newMembers", newMembers);

    try {
      const userServiceUrl =
        process.env.USER_SERVICE_URL || "http://user-service:5002";
      const userDetailsRes = await axios.post(
        `${userServiceUrl}/users/user-details-by-ids`,
        {
          userIds: conversation.members.map((id) => id.toString()), // full danh sách sau khi thêm
        }
      );

      const userDetailsMap = userDetailsRes.data.reduce((acc, user) => {
        acc[user.userId] = {
          userId: user.userId,
          name: `${user.firstname} ${user.lastname}`,
          avatar: user.avatar || "",
        };
        return acc;
      }, {});

      const enrichedConversation = {
        ...conversation.toObject(),
        members: conversation.members.map(
          (id) =>
            userDetailsMap[id.toString()] || {
              userId: id,
              name: "Unknown",
              avatar: "",
            }
        ),
        messages: [], // Gửi conversation mới cho user nhưng không cần gửi messages
      };

      newMembers.forEach((member) => {
        io.to(member.userId).emit("newConversation", enrichedConversation);
      });
    } catch (error) {
      console.error(
        "❌ Lỗi khi enrich conversation cho thành viên mới:",
        error.message
      );
    }

    // newMembers.forEach(member => {
    //   io.to(member.userId).emit('newConversation', {...conversation.toObject(), messages: []});
    // });
  });

  socket.on("updateGroupAvatar", async ({ conversationId, avatar }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      if (typeof avatar === "string") {
        const { mimeType, buffer } = parseBase64(avatar);
        const ext = mimeType.split("/")[1];
        const fileName = `group_${Date.now()}.${ext}`;
        const avatarUrl = await uploadToCloudinary(
          buffer,
          fileName,
          "group_avatars"
        );

        conversation.avatar = avatarUrl;
        await conversation.save();

        io.to(conversationId).emit("groupAvatarUpdated", {
          conversationId,
          avatar: avatarUrl,
        });

        console.log(`🖼️ Avatar updated for group ${conversationId}`);
      }
    } catch (error) {
      console.error("❌ Error updating group avatar:", error.message);
    }
  });

  socket.on("updateGroupName", async ({ conversationId, groupName }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      conversation.groupName = groupName;
      await conversation.save();

      io.to(conversationId).emit("groupNameUpdated", {
        conversationId,
        groupName,
      });

      console.log(`✏️ Group name updated for ${conversationId}`);
    } catch (error) {
      console.error("❌ Error updating group name:", error.message);
    }
  });

  // Khi người dùng rời phòng (disconnect)
  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.id);
    // await redisClient.del(`online:${socket.id}`);
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () =>
  console.log(`🚀 Chat Service running on port ${PORT}`)
);
