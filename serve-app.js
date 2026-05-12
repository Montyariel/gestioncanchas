// Servidor estático simple para CanchaOS
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'app')));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ CanchaOS corriendo en: http://localhost:${PORT}`);
});
