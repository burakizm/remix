import queues from "../../queues";
import { Server, Socket } from "socket.io";

export default (socket: Socket) => {
    socket.on("getQueue", async (chatId: number) => {
        socket.emit("items", queues.getAll(chatId));
    });
};
