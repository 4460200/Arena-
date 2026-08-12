const menu = document.getElementById("menu");
const jogo = document.getElementById("jogo");
const nomeInput = document.getElementById("nome");
const entrarButton = document.getElementById("entrar");
const status = document.getElementById("status");

const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const vidaElement = document.getElementById("vida");
const jogadoresElement = document.getElementById("jogadores");

let jogador = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    velocidade: 5,
    vida: 100
};

const teclas = {};

document.addEventListener("keydown", (event) => {
    teclas[event.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (event) => {
    teclas[event.key.toLowerCase()] = false;
});

entrarButton.addEventListener("click", entrarNaArena);

function entrarNaArena() {
    const nome = nomeInput.value.trim();

    if (nome === "") {
        status.textContent = "Digite um nome!";
        return;
    }

    status.textContent = "Entrando na arena...";

    setTimeout(() => {
        menu.style.display = "none";
        jogo.style.display = "block";

        jogadoresElement.textContent = "1";

        iniciarJogo();
    }, 500);
}

function iniciarJogo() {
    requestAnimationFrame(loop);
}

function atualizar() {
    if (teclas["w"]) {
        jogador.y -= jogador.velocidade;
    }

    if (teclas["s"]) {
        jogador.y += jogador.velocidade;
    }

    if (teclas["a"]) {
        jogador.x -= jogador.velocidade;
    }

    if (teclas["d"]) {
        jogador.x += jogador.velocidade;
    }

    // Impede o jogador de sair da arena
    jogador.x = Math.max(20, Math.min(canvas.width - 20, jogador.x));
    jogador.y = Math.max(20, Math.min(canvas.height - 20, jogador.y));

    vidaElement.textContent = jogador.vida;
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    ctx.fillStyle = "#202631";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade
    ctx.strokeStyle = "#303846";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Jogador
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Nome do jogador
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(nomeInput.value, jogador.x, jogador.y - 30);
}

function loop() {
    atualizar();
    desenhar();

    requestAnimationFrame(loop);
}
