const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const WIDTH = 1200;
const HEIGHT = 700;
const players = new Map();

function randomPosition() {
  return {
    x: 80 + Math.random() * (WIDTH - 160),
    y: 80 + Math.random() * (HEIGHT - 160)
  };
}

function publicPlayers() {
  return [...players.values()].map(p => ({
    id: p.id,
    x: p.x,
    y: p.y,
    color: p.color,
    health: p.health,
    kills: p.kills,
    deaths: p.deaths,
    name: p.name
  }));
}

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const p of players.values()) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(message);
    }
  }
}

wss.on("connection", ws => {
  const id = Math.random().toString(36).substring(2, 10);
  const pos = randomPosition();

  const player = {
    id,
    ws,
    x: pos.x,
    y: pos.y,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    health: 100,
    kills: 0,
    deaths: 0,
    name: "Jogador"
  };

  players.set(id, player);

  ws.send(JSON.stringify({
    type: "welcome",
    id,
    world: {
      width: WIDTH,
      height: HEIGHT
    }
  }));

  broadcast({
    type: "players",
    players: publicPlayers()
  });

  ws.on("message", raw => {
    try {
      const data = JSON.parse(raw.toString());
      const p = players.get(id);

      if (!p) return;

      if (data.type === "join") {
        p.name = String(data.name || "Jogador").slice(0, 16);
      }

      if (data.type === "move") {
        p.x = Math.max(25, Math.min(WIDTH - 25, Number(data.x)));
        p.y = Math.max(25, Math.min(HEIGHT - 25, Number(data.y)));
      }

      if (data.type === "shoot") {
        broadcast({
          type: "bullet",
          owner: id,
          x: p.x,
          y: p.y,
          angle: Number(data.angle)
        });
      }

      if (data.type === "hit") {
        const victim = players.get(data.target);

        if (!victim || victim.id === id) return;

        victim.health -= 25;

        if (victim.health <= 0) {
          p.kills++;
          victim.deaths++;
          victim.health = 100;

          const newPos = randomPosition();
          victim.x = newPos.x;
          victim.y = newPos.y;

          broadcast({
            type: "kill",
            killer: p.name,
            victim: victim.name
          });
        }
      }

      broadcast({
        type: "players",
        players: publicPlayers()
      });

    } catch (error) {
      console.error(error);
    }
  });

  ws.on("close", () => {
    players.delete(id);

    broadcast({
      type: "players",
      players: publicPlayers()
    });
  });
});

server.listen(PORT, () => {
  console.log(`Arena 2D rodando na porta ${PORT}`);
});
