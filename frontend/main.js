// Utilidades pequeñas
function $(sel) { return document.querySelector(sel); }
function getQuery(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}
function setQuery(name, value) {
  const u = new URL(window.location.href);
  u.searchParams.set(name, value);
  window.history.replaceState({}, '', u.toString());
}

// DOM
const mensajesContainer = $('#mensajes');
const mensajeInput = $('#mensajeInput');
const enviarBtn = $('#enviarBtn');
const nombreSpan = $('#nombre');
const salaSpan = $('#sala');
const linkSala = $('#linkSala');
const copiarLinkBtn = $('#copiarLink');

// 1) Pide nombre una vez (simple)
let username = localStorage.getItem('miChatNombre') || '';
if (!username) {
  username = prompt('Elige un nombre para el chat:') || 'Anónimo';
  username = username.trim().slice(0, 30);
  localStorage.setItem('miChatNombre', username);
}
nombreSpan.textContent = username;

// 2) Detecta o crea sala desde ?sala=...
let sala = getQuery('sala');
if (!sala) {
  sala = Math.random().toString(16).slice(2, 10);
  setQuery('sala', sala);
}
salaSpan.textContent = sala;

// Preparar enlace para compartir
linkSala.value = window.location.href;
copiarLinkBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(linkSala.value);
  copiarLinkBtn.textContent = '¡Copiado!';
  setTimeout(() => (copiarLinkBtn.textContent = 'Copiar'), 1200);
});

// 3) Conectar con Socket.IO, enviando sala y username
const socket = io({
  query: { room: sala, username }
});

// 4) Pintar mensajes
function renderMensaje({ author, text, ts }) {
  const box = document.createElement('div');
  box.className = 'mensaje';

  const hora = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  box.innerHTML = `<strong>${author}</strong> <small>${hora}</small><br>${text}`;
  mensajesContainer.appendChild(box);
  mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
}

// Historial al entrar
socket.on('historial', (items) => {
  mensajesContainer.innerHTML = '';
  for (const it of items) renderMensaje(it);
});

// Mensaje nuevo en tiempo real
socket.on('mensaje', (msg) => {
  renderMensaje(msg);
});

// 5) Envío de mensajes
function enviarMensaje() {
  const text = mensajeInput.value.trim();
  if (!text) return;
  socket.emit('mensaje', { text });
  mensajeInput.value = '';
  enviarBtn.disabled = true;
}
enviarBtn.addEventListener('click', enviarMensaje);
mensajeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    enviarMensaje();
  }
});
mensajeInput.addEventListener('input', () => {
  enviarBtn.disabled = mensajeInput.value.trim() === '';
});
