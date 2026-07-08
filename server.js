const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const players = {};
let tagCooldown = 0

setInterval(() => {
    tagCooldown -= 1
}, 300);
setInterval(() => {
    for (let id in players) {
        let player = players[id];

        if (player.it && Object.keys(players).length > 1) {
            player.timeIT += 1;
            if (player.timeIT > 120 ) {
                io.sockets.sockets.get(id)?.disconnect(true);
            }
        }
    }

}, 1000);

io.on("connection", (socket) => {
    socket.on("setName", (name) => {
        if (players[socket.id]) {
            players[socket.id].name = name.substring(0, 15);
            players[socket.id].timeIT = 0
        }
    });

    console.log(`Player connected: ${socket.id}`);
    const min = 57;
    const max = 68;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    players[socket.id] = {
        x: Math.random() * 700 + 50,
        y: Math.random() * 400 + 50,
        color: `/images/pixil-frame-0 (${randomNumber}).png`,
        it: Object.keys(players).length === 0,
        timeIT: 0,
        name: "Player"
    };

    io.emit("players", players);
    socket.on("ban", (name) => {
        for (const id in players) {
            if (players[id].name === name) {
                io.sockets.sockets.get(id)?.disconnect(true);
            }
        }
    });

    socket.on("move", (data) => {

        if (!players[socket.id]) return;

        players[socket.id].x = data.x;
        players[socket.id].y = data.y;

        // Check for tagging
        for (const id in players) {

            if (id === socket.id) continue;

            const a = players[socket.id];
            const b = players[id];

            if (
                a.x < b.x + 30 &&
                a.x + 30 > b.x &&
                a.y < b.y + 30 &&
                a.y + 30 > b.y
            ) {

                if ((a.it || b.it) && tagCooldown < 0) {
                    tagCooldown = 3
                    a.it = false;
                    b.it = true;
                }

            }

        }

        io.emit("players", players);

    });

    socket.on("disconnect", () => {

        const wasIt = players[socket.id]?.it;

        delete players[socket.id];

        // If IT left, make another player IT
        if (wasIt) {

            const ids = Object.keys(players);

            if (ids.length > 0) {
                players[ids[0]].it = true;
            }

        }

        io.emit("players", players);

        console.log(`Player disconnected: ${socket.id}`);

    });

});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});