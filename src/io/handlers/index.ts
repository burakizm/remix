import { Socket } from "socket.io";
import getQueue from "./getQueue";

export default (socket: Socket) => {
    getQueue(socket);
};
