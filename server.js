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

io.on("connection", (socket) => {
    socket.on("setName", (name) => {
        if (players[socket.id]) {
            players[socket.id].name = name.substring(0, 15);
        }
    });

    console.log(`Player connected: ${socket.id}`);

    players[socket.id] = {
        x: Math.random() * 700 + 50,
        y: Math.random() * 400 + 50,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
        it: Object.keys(players).length === 0
    };

    io.emit("players", players);

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

                if ( tagCooldown < 0) {
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