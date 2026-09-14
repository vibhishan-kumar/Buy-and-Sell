const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

let io = null;
// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  // Socket middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
      } catch (err) {
        console.warn('Socket token verification failed:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user && socket.user.id) {
      const userId = socket.user.id;
      socket.join(`user_${userId}`);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Broadcast user online status
      io.emit('user_online', { userId });
    }

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userName }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userName
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        conversationId
      });
    });

    socket.on('disconnect', () => {
      if (socket.user && socket.user.id) {
        const userId = socket.user.id;
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit('user_offline', { userId });
          }
        }
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function isUserOnline(userId) {
  return onlineUsers.has(Number(userId)) && onlineUsers.get(Number(userId)).size > 0;
}

function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

function emitToConversation(conversationId, event, data) {
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
}

function broadcastEvent(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  emitToUser,
  emitToConversation,
  broadcastEvent
};
