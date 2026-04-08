const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Adjust this for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    socket.on('join_institute', (instituteId) => {
      if (instituteId) {
        socket.join(instituteId.toString());
        console.log(`Socket ${socket.id} joined room: ${instituteId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from socket');
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIo };
