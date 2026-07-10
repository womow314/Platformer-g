const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const flatPlayers = {};
const gravityPlayers = {};

let tagCooldown = 0

setInterval(() => {
    tagCooldown -= 1
}, 300);
setInterval(() => {
    for (let id in flatPlayers) {
        let player = flatPlayers[id];

        if (player.it && Object.keys(flatPlayers).length > 1) {
            player.timeIT += 1;
        }
    }
    for (let id in gravityPlayers) {
        let player = gravityPlayers[id];

        if (player.it && Object.keys(gravityPlayers).length > 1) {
            player.timeIT += 1;
        }
    }

}, 1000);



io.on("connection", (socket) => {
    socket.on("joinTag", (dir) =>{
        socket.on("setName", (name) => {
            if (flatPlayers[socket.id]) {
                flatPlayers[socket.id].name = name.substring(0, 15);
                flatPlayers[socket.id].timeIT = 0
            }
        });

        console.log(`Player connected: ${socket.id}`);
        const min = 57;
        const max = 68;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        flatPlayers[socket.id] = {
            x: Math.random() * 700 + 50,
            y: Math.random() * 400 + 50,
            color: `/images/pixil-frame-0 (${randomNumber}).png`,
            it: Object.keys(flatPlayers).length === 0,
            timeIT: 0,
            name: "Player",
            facing: dir
        };

        io.emit("players", flatPlayers);
        socket.on("ban", (name) => {
            for (const id in flatPlayers) {
                if (flatPlayers[id].name === name) {
                    const target = io.sockets.sockets.get(id);

                    if (target) {
                        target.emit("kicked");
                        setTimeout(() => {
                            target.disconnect(true);
                        }, 100);
                    }
                }
            }
        });

        socket.on("move", (data) => {

            if (!flatPlayers[socket.id]) return;

            flatPlayers[socket.id].x = data.x;
            flatPlayers[socket.id].y = data.y;

            // Check for tagging
            for (const id in flatPlayers) {

                if (id === socket.id) continue;

                const a = flatPlayers[socket.id];
                const b = flatPlayers[id];

                if (
                    a.x < b.x + 30 &&
                    a.x + 30 > b.x &&
                    a.y < b.y + 30 &&
                    a.y + 30 > b.y
                ) {

                    if ((a.it || b.it) && (a.facing === b.facing) && tagCooldown < 0) {
                        tagCooldown = 3
                        a.it = false;
                        b.it = true;
                    }

                }

            }

            io.emit("players", flatPlayers);

        });

        socket.on("disconnect", () => {

            const wasIt = flatPlayers[socket.id]?.it;

            delete flatPlayers[socket.id];

            // If IT left, make another player IT
            if (wasIt) {

                const ids = Object.keys(flatPlayers);

                if (ids.length > 0) {
                    flatPlayers[ids[0]].it = true;
                }

            }

            io.emit("players", flatPlayers);

            console.log(`Player disconnected: ${socket.id}`);

        });
    })

    socket.on("joinTagSide", (dir) => {
        socket.on("setName", (name) => {
            if (gravityPlayers[socket.id]) {
                gravityPlayers[socket.id].name = name.substring(0, 15);
                gravityPlayers[socket.id].timeIT = 0
            }
        });

        console.log(`Player connected: ${socket.id}`);
        const min = 57;
        const max = 68;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        gravityPlayers[socket.id] = {
            x: Math.random() * 700 + 50,
            y: Math.random() * 400 + 50,
            color: `/images/pixil-frame-0 (${randomNumber}).png`,
            it: Object.keys(gravityPlayers).length === 0,
            timeIT: 0,
            name: "Player",
            facing: dir
        };

        io.emit("players", gravityPlayers);
        socket.on("ban", (name) => {
            for (const id in gravityPlayers) {
                if (gravityPlayers[id].name === name) {
                    const target = io.sockets.sockets.get(id);

                    if (target) {
                        target.emit("kicked");
                        setTimeout(() => {
                            target.disconnect(true);
                        }, 100);
                    }
                }
            }
        });

        socket.on("move", (data) => {

            if (!gravityPlayers[socket.id]) return;

            gravityPlayers[socket.id].x = data.x;
            gravityPlayers[socket.id].y = data.y;

            // Check for tagging
            for (const id in gravityPlayers) {

                if (id === socket.id) continue;

                const a = gravityPlayers[socket.id];
                const b = gravityPlayers[id];

                if (
                    a.x < b.x + 30 &&
                    a.x + 30 > b.x &&
                    a.y < b.y + 30 &&
                    a.y + 30 > b.y
                ) {

                    if ((a.it || b.it) && (a.facing === b.facing) && tagCooldown < 0) {
                        tagCooldown = 3
                        a.it = false;
                        b.it = true;
                    }

                }

            }

            io.emit("players", gravityPlayers);

        });

        socket.on("disconnect", () => {

            const wasIt = gravityPlayers[socket.id]?.it;

            delete gravityPlayers[socket.id];

            // If IT left, make another player IT
            if (wasIt) {

                const ids = Object.keys(gravityPlayers);

                if (ids.length > 0) {
                    gravityPlayers[ids[0]].it = true;
                }

            }

            io.emit("players", gravityPlayers);

            console.log(`Player disconnected: ${socket.id}`);

        });
    })

});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});