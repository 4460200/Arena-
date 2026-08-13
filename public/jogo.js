const menu = document.getElementById("menu");
const jogo = document.getElementById("jogo");
const nomeInput = document.getElementById("nome");
const botaoDeEntrada = document.getElementById("entrar");
const status = document.getElementById("status");

const tela = document.getElementById("arena");
const ctx = tela.getContext("2d");

const vidaElemento = document.getElementById("vida");
const elemento = document.getElementById("jogadores");

let socket;
let meuId = null;

let jogadores = {};

const teclas = {};

document.addEventListener("keydown", (evento) => {
    teclas[evento.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (evento) => {
    teclas[evento.key.toLowerCase()] = false;
});

botaoDeEntrada.addEventListener("click", entrarNaArena);

function entrarNaArena() {
    const nome = nomeInput.value.trim();

    if (nome === "") {
        status.textContent = "Digite um nome!";
        return;
    }

    status.textContent = "Conectando...";

    const protocolo = location.protocol === "https:" ? "wss://" : "ws://";

    socket = new WebSocket(protocolo + location.host);

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: "join",
            name: nome
        }));

        status.textContent = "Entrando na arena...";

        setTimeout(() => {
            menu.style.display = "none";
            jogo.style.display = "block";
            iniciarJogo();
        }, 500);
    };

    socket.onmessage = (evento) => {
        const dados = JSON.parse(evento.data);

        if (dados.type === "welcome") {
            meuId = dados.id;

            tela.width = dados.world.width;
            tela.height = dados.world.height;
        }

        if (dados.type === "players") {
            jogadores = {};

            dados.players.forEach((jogador) => {
                jogadores[jogador.id] = jogador;
            });

            atualizarInterface();
        }

        if (dados.type === "bullet") {
            // Os tiros são tratados pelo servidor.
        }

        if (dados.type === "kill") {
            // As estatísticas são atualizadas
            // quando o servidor envia players novamente.
        }
    };

    socket.onclose = () => {
        status.textContent = "Conexão perdida.";
    };

    socket.onerror = () => {
        status.textContent = "Erro na conexão.";
    };
}

function iniciarJogo() {
    requestAnimationFrame(loop);
}

function loop() {
    atualizar();
    desenhar();

    requestAnimationFrame(loop);
}

function atualizar() {
    const jogador = jogadores[meuId];

    if (!jogador) {
        return;
    }

    let x = jogador.x;
    let y = jogador.y;

    let mudou = false;

    if (teclas["w"] || teclas["arrowup"]) {
        y -= 5;
        mudou = true;
    }

    if (teclas["s"] || teclas["arrowdown"]) {
        y += 5;
        mudou = true;
    }

    if (teclas["a"] || teclas["arrowleft"]) {
        x -= 5;
        mudou = true;
    }

    if (teclas["d"] || teclas["arrowright"]) {
        x += 5;
        mudou = true;
    }

    x = Math.max(20, Math.min(tela.width - 20, x));
    y = Math.max(20, Math.min(tela.height - 20, y));

    if (mudou && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "move",
            x: x,
            y: y
        }));
    }
}

function desenhar() {
    ctx.clearRect(0, 0, tela.width, tela.height);

    // Fundo
    ctx.fillStyle = "#202631";
    ctx.fillRect(0, 0, tela.width, tela.height);

    // Grade
    ctx.strokeStyle = "#29313e";
    ctx.lineWidth = 2;

    for (let x = 0; x < tela.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tela.height);
        ctx.stroke();
    }

    for (let y = 0; y < tela.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(tela.width, y);
        ctx.stroke();
    }

    // DESENHA TODOS OS JOGADORES
    Object.values(jogadores).forEach((jogador) => {
        desenharJogador(jogador);
    });
}

function desenharJogador(jogador) {
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, 27, 0, Math.PI * 2);

    ctx.fillStyle = jogador.color || "#3498db";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = jogador.id === meuId ? 3 : 1;
    ctx.stroke();

    // Nome
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        jogador.name || "Player",
        jogador.x,
        jogador.y - 38
    );

    // Vida
    ctx.fillStyle = "#333";
    ctx.fillRect(
        jogador.x - 25,
        jogador.y + 34,
        50,
        6
    );

    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(
        jogador.x - 25,
        jogador.y + 34,
        50 * ((jogador.health || 0) / 100),
        6
    );
}

function atualizarInterface() {
    const meuJogador = jogadores[meuId];

    if (meuJogador) {
        vidaElemento.textContent = meuJogador.health;

        elemento.textContent =
            Object.keys(jogadores).length;
    }
}
