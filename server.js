// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Worker } = require("worker_threads");
const fs = require("fs");
const winston = require("winston");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

const numWorkers = 150; // Número de workers

io.on("connection", (socket) => {
  socket.on("startCheck", (emailList) => {
    const credenciais = emailList.split("\n").filter(Boolean);
    const chunkSize = Math.ceil(credenciais.length / numWorkers);

    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = credenciais.slice(start, end);

      const worker = new Worker(__dirname + "/worker.js", {
        workerData: chunk,
      });

      worker.on("message", (message) => {
        socket.emit("result", message);
      });

      worker.on("error", (error) => {
        winston.error(`Erro no worker: ${error.message}`);
        socket.emit("result", `Erro no worker: ${error.message}`);
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          winston.error(`Worker terminou com código ${code}`);
          socket.emit("result", `Worker terminou com código ${code}`);
        }
      });
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
