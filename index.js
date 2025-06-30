const express = require('express');
const http = require('http');
const { createClient } = require('redis');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // allow any frontend
});

const pubClient = createClient();  // Redis publisher
const subClient = pubClient.duplicate(); // Redis subscriber

(async () => {
  await pubClient.connect();
  await subClient.connect();

  subClient.subscribe('data-changed', (message) => {
    // Broadcast to all connected clients
    io.emit('data-updated', message);
    console.log('Redis message received and broadcasted:', message);
  });
})();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('change-data', async (data) => {
    console.log('Change received from frontend:', data);
    await pubClient.publish('data-changed', JSON.stringify(data));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => console.log('Backend listening on port 3000'));
