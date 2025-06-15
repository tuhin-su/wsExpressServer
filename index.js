require('./config/env');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const clients = new Map();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// IMPORT ROUTERS
const userRoutes = require('./routes/userRoutes');

// IMPORT SOCKET HANDLERS
const userSocket = require('./handlers/userSocket');

// 📦 HTTP REST API setup
app.use(express.json());
app.use('/api/user', userRoutes);

// 🧠 Available WebSocket handlers mapped by endpoint root
const wsHandlers = {
  user: userSocket
};

// 🌐 Unified WebSocket handler
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  // Temporary UUID if userId not yet known
  const tempId = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  clients.set(tempId, { ws, meta: { connectedAt: Date.now(), temp: true } });

  // Attach metadata to ws itself
  ws._clientId = tempId;

  
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      const { type, command, body = {} } = data;
      console.log(data);

      if (!type || !command) {
        return ws.send(JSON.stringify({ error: 'Missing type or endpoint' }));
      }
      
      const parts = command.split('/').filter(Boolean);
      const service = parts[0];
      // remove service from parts
      parts.shift();

      const handler = wsHandlers[service];
      if (!handler) {
        return ws.send(JSON.stringify({ error: 'Unknown WebSocket endpoint' }));
      }

      // if (body.userId) {
      //   // Upgrade temp guest to actual user
      //   clients.set(body.userId, { ws, meta: { connectedAt: Date.now(), type: service } });
      //   clients.delete(ws._clientId);
      //   ws._clientId = body.userId;
      // }

      const context = {
        type,
        command,
        parts,
        body,
        ws,
        clients
      };


      await handler(context);

    } catch (err) {
      console.error('WebSocket error:', err);
      ws.send(JSON.stringify({ error: 'Invalid WebSocket message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws._clientId);
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
