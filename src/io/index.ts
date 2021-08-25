import { Server, Socket } from "socket.io";
import handlers from "./handlers";
import env from "../env";

const server = new Server();
const connections = new Map<number, Socket[]>();

function cleanConnections() {
    connections.forEach((val, key) => {
        val.filter((socket) => !socket.connected);
    });
}

setInterval(cleanConnections, 1000);

export function sendUpdate(chatId: number, name: string, update?: any) {
    const sockets = connections.get(chatId);

    if (!sockets) {
        return;
    }

    sockets.forEach((socket) => {
        if (socket.connected) {
            socket.emit(name, update);
        }
    });
}

export default () => {
    server.on("connection", (socket) => {
        socket.on("initialize", (chatId: number) => {
            const sockets = connections.get(chatId);

            if (sockets) {
                sockets.push(socket);
            } else {
                connections.set(chatId, [socket]);
            }
        });

        handlers(socket);
    });

    return server.listen(env.SOCKET_PORT);
};
