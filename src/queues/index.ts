import { Readable } from "stream";
import { User } from "@grammyjs/types";
import { sendUpdate } from "../io";

export interface Item {
    getReadable: () => Promise<Readable> | Readable;
    url: string;
    title: string;
    requester: User;
}

export type NowHandler = (chatId: number, now: Item) => Promise<void>;

function escapeItem(item: Item) {
    return { url: item.url, title: item.title, requester: item.requester };
}

export default new (class Queues {
    queues: Map<number, Item[]> = new Map();
    now: Map<number, Item> = new Map();
    nowHandlers: NowHandler[] = [];

    addNowHandler(handler: NowHandler) {
        this.nowHandlers.push(handler);
    }

    setNow(chatId: number, item: Item) {
        this.now.set(chatId, item);
        this.nowHandlers.forEach((handler) => handler(chatId, item));
        sendUpdate(chatId, "now", escapeItem(item));
    }

    rmNow(chatId: number) {
        sendUpdate(chatId, "rmNow");
        return this.now.delete(chatId);
    }

    getNow(chatId: number) {
        return this.now.get(chatId);
    }

    push(chatId: number, item: Item) {
        const queue = this.queues.get(chatId);

        sendUpdate(chatId, "pushedItem", escapeItem(item));

        if (queue) {
            queue.push(item);
            return queue.length;
        }

        this.queues.set(chatId, [item]);
        return 1;
    }

    get(chatId: number) {
        const queue = this.queues.get(chatId);

        this.rmNow(chatId);

        if (queue) {
            const item = queue.shift();

            if (item) {
                this.setNow(chatId, item);
            }

            return item;
        }
    }

    getAll(chatId: number) {
        const queue = this.queues.get(chatId);

        if (queue) {
            return queue;
        }

        return [];
    }

    clear(chatId: number) {
        this.rmNow(chatId);
        sendUpdate(chatId, "cleared");

        if (this.queues.has(chatId)) {
            this.queues.set(chatId, []);
            return true;
        }

        return false;
    }
})();
