// const WebSocket = require('ws');
// const express = require('express');
// const http = require('http');
// const { v4: uuidv4 } = require('uuid');

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// // Servir archivos estáticos desde la carpeta fronend sis (un nivel arriba)
// app.use(express.static('../fronend sis'));

// // Almacenar máquinas conectadas y sus nombres
// const machines = new Map();
// let nextClientNumber = 1; // Contador para nuevos clientes
// const clientNames = new Map(); // Mapa para almacenar clientId -> nombre

// // Manejar nuevas conexiones
// wss.on('connection', (ws) => {
//   ws.on('message', (data) => {
//     const message = JSON.parse(data);

//     // Identificación del cliente
//     if (message.type === 'identify') {
//       let machineName;
//       const clientId = message.clientId;

//       if (message.role === 'mother') {
//         machineName = 'Máquina Madre';
//       } else {
//         // Verificar si el clientId ya tiene un nombre asignado
//         if (clientNames.has(clientId)) {
//           machineName = clientNames.get(clientId); // Reutilizar el nombre existente
//         } else {
//           machineName = `Máquina ${nextClientNumber}`; // Asignar nuevo nombre
//           clientNames.set(clientId, machineName); // Almacenar el nombre
//           nextClientNumber++; // Incrementar solo para nuevos clientes
//         }
//       }

//       machines.set(ws, { id: clientId, name: machineName });

//       // Enviar nombre al cliente
//       ws.send(JSON.stringify({ type: 'name', name: machineName }));

//       // Notificar a todos de la lista actualizada de máquinas
//       broadcast({ type: 'machines', machines: Array.from(machines.values()).map(m => m.name) });
//     }

//     // Manejar mensajes de chat
//     if (message.type === 'broadcast') {
//       broadcast({
//         type: 'message',
//         sender: machines.get(ws).name,
//         content: message.content,
//         to: 'all'
//       });
//     } else if (message.type === 'direct') {
//       const recipient = [...machines.entries()].find(([_, info]) => info.name === message.to);
//       if (recipient) {
//         const [recipientWs] = recipient;
//         recipientWs.send(JSON.stringify({
//           type: 'message',
//           sender: machines.get(ws).name,
//           content: message.content,
//           to: message.to
//         }));
//         ws.send(JSON.stringify({
//           type: 'message',
//           sender: machines.get(ws).name,
//           content: message.content,
//           to: message.to
//         }));
//       } else {
//         ws.send(JSON.stringify({ type: 'error', message: 'Máquina destinataria no encontrada' }));
//       }
//     }
//   });

//   // Manejar desconexión
//   ws.on('close', () => {
//     machines.delete(ws);
//     broadcast({ type: 'machines', machines: Array.from(machines.values()).map(m => m.name) });
//   });
// });

// // Enviar mensaje a todos los clientes
// function broadcast(message) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify(message));
//     }
//   });
// }

// // Iniciar servidor
// server.listen(8080, () => {
//   console.log('Servidor corriendo en http://localhost:8080');
// });
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir archivos estáticos desde la carpeta fronend sis (un nivel arriba)
app.use(express.static('../fronend sis'));

// Almacenar máquinas conectadas y sus nombres
const machines = new Map();
let nextClientNumber = 1; // Contador para nuevos clientes
const clientNames = new Map(); // Mapa para almacenar clientId -> nombre

// Manejar nuevas conexiones
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    // Identificación del cliente
    if (message.type === 'identify') {
      let machineName;
      const clientId = message.clientId;

      if (message.role === 'mother') {
        machineName = 'Máquina Madre';
      } else {
        // Verificar si el clientId ya tiene un nombre asignado
        if (clientNames.has(clientId)) {
          machineName = clientNames.get(clientId); // Reutilizar el nombre existente
        } else {
          machineName = `Máquina ${nextClientNumber}`; // Asignar nuevo nombre
          clientNames.set(clientId, machineName); // Almacenar el nombre
          nextClientNumber++; // Incrementar solo para nuevos clientes
        }
      }

      machines.set(ws, { id: clientId, name: machineName });

      // Enviar nombre al cliente
      ws.send(JSON.stringify({ type: 'name', name: machineName }));

      // Notificar a todos de la lista actualizada de máquinas
      broadcast({ type: 'machines', machines: Array.from(machines.values()).map(m => m.name) });
    }

    // Manejar mensajes de chat
    if (message.type === 'broadcast') {
      broadcast({
        type: 'message',
        sender: machines.get(ws).name,
        content: message.content,
        to: 'all'
      });
    } else if (message.type === 'direct') {
      const recipient = [...machines.entries()].find(([_, info]) => info.name === message.to);
      if (recipient) {
        const [recipientWs] = recipient;
        recipientWs.send(JSON.stringify({
          type: 'message',
          sender: machines.get(ws).name,
          content: message.content,
          to: message.to
        }));
        ws.send(JSON.stringify({
          type: 'message',
          sender: machines.get(ws).name,
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

// Iniciar servidor en todas las interfaces
server.listen(8080, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://0.0.0.0:8080');
});