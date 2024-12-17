const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Obtener la IP del servidor
function getServerIP() {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Devuelve la IP pública/local
            }
        }
    }
    return 'IP desconocida';
}

// Pila de mensajes
const messages = [];

io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado: ${socket.id}`);

    // Enviar IP del servidor
    socket.emit('serverIP', { ip: getServerIP() });

    // Enviar historial de mensajes
    socket.emit('loadMessages', messages);

    // Unirse al chat
    socket.on('joinRoom', (username) => {
        socket.username = username;
        console.log(`${username} se unió al chat`);
        socket.broadcast.emit('message', { user: 'Sistema', message: `${username} se unió al chat` });
    });

    // Enviar mensajes
    socket.on('chatMessage', (data) => {
        const message = { user: socket.username, message: data.message };
        messages.push(message);
        io.emit('message', message);
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`${socket.username || 'Un usuario'} se desconectó`);
        socket.broadcast.emit('message', { user: 'Sistema', message: `${socket.username || 'Un usuario'} se desconectó` });
    });
});

server.listen(3000, () => {
    console.log('Servidor Backend escuchando en http://localhost:3000');
});
