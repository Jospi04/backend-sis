const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir archivos estáticos desde la carpeta fronend sis (un nivel arriba)
app.use(express.static('../fronend sis'));

// Almacenar máquinas conectadas
const machines = new Map();
const MAX_MACHINES = 19;

// Asignar nombres de Máquina 1 a Máquina 19
let nextMachineNumber = 1;

// Manejar nuevas conexiones
wss.on('connection', (ws) => {
  if (machines.size >= MAX_MACHINES) {
    ws.send(JSON.stringify({ type: 'error', message: 'Límite de 19 máquinas alcanzado' }));
    ws.close();
    return;
  }

  // Asignar nombre de máquina
  const machineName = `Máquina ${nextMachineNumber}`;
  nextMachineNumber++;
  machines.set(ws, { id: uuidv4(), name: machineName });

  // Enviar nombre al cliente
  ws.send(JSON.stringify({ type: 'name', name: machineName }));

  // Notificar a todos de la nueva conexión
  broadcast({ type: 'machines', machines: Array.from(machines.values()).map(m => m.name) });

  // Manejar mensajes recibidos
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    const sender = machines.get(ws).name;

    if (message.type === 'broadcast') {
      // Mensaje general
      broadcast({
        type: 'message',
        sender,
        content: message.content,
        to: 'all'
      });
    } else if (message.type === 'direct') {
      // Mensaje directo
      const recipient = [...machines.entries()].find(([_, info]) => info.name === message.to);
      if (recipient) {
        const [recipientWs] = recipient;
        recipientWs.send(JSON.stringify({
          type: 'message',
          sender,
          content: message.content,
          to: message.to
        }));
        // Enviar copia al remitente
        ws.send(JSON.stringify({
          type: 'message',
          sender,
          content: message.content,
          to: message.to
        }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Máquina destinataria no encontrada' }));
      }
    }
  });

  // Manejar desconexión
  ws.on('close', () => {
    machines.delete(ws);
    broadcast({ type: 'machines', machines: Array.from(machines.values()).map(m => m.name) });
  });
});

// Enviar mensaje a todos los clientes
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Iniciar servidor
server.listen(8081, () => {
  console.log('Servidor corriendo en http://localhost:8081');
});