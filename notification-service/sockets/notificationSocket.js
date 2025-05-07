module.exports = (io, userSocketMap) => {
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
  
      socket.on('register', (authId) => {
        userSocketMap[authId] = socket.id;
        console.log(`User ${authId} registered with socket ${socket.id}`);
      });
  
      socket.on('disconnect', () => {
        for (const authId in userSocketMap) {
          if (userSocketMap[authId] === socket.id) {
            delete userSocketMap[authId];
            break;
          }
        }
      });
    });
  };
  