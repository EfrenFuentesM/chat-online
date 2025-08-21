const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { saveMessage, getLastMessages } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servimos el frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Sanitizador mínimo para evitar XSS al pintar mensajes
function sanitize(text) {
  return String(text).replace(/[<>&'"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]
  ));
}

// Genera una sala simple si no te pasan una
function randomRoom() {
  // 8 hex chars -> 65k millones de combinaciones. Suficiente para demo.
  return Math.random().toString(16).slice(2, 10);
}

// Ruta para crear una sala rápida y redirigir
app.get('/nueva', (req, res) => {
  const r = randomRoom();
  res.redirect(`/?sala=${r}`);
});

io.on('connection', (socket) => {
  const { room, username } = socket.handshake.query;

  // Validación basiquita
  const sala = (room || '').trim() || randomRoom();
  const user = (username || 'Anónimo').trim().slice(0, 30);

  socket.join(sala);

  // Enviar historial al que se conecta
  const history = getLastMessages(sala, 100);
  socket.emit('historial', history);

  // Aviso opcional de conexión (no lo guardamos)
  // io.to(sala).emit('sistema', `${user} se unió a la sala.`);

  socket.on('mensaje', (payload) => {
    const text = sanitize((payload && payload.text) || '').slice(0, 2000);
    if (!text) return;

    const ts = Date.now();
    const msg = { room: sala, author: user, text, ts };

    // Guardar en BD
    saveMessage(msg);

    // Reenviar a todos en la sala
    io.to(sala).emit('mensaje', { author: user, text, ts });
  });

  socket.on('disconnect', () => {
    // io.to(sala).emit('sistema', `${user} salió.`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
