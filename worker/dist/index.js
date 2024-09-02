"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const client_1 = require("@prisma/client");
require("dotenv/config");
const client = (0, redis_1.createClient)();
const prisma = new client_1.PrismaClient();
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Worker connected to Redis.");
            while (true) {
                try {
                    const data = yield client.brPop("queue", 0);
                    //@ts-ignore
                    const { docId, thumbnail, userId } = JSON.parse(data.element);
                    const formData = new FormData();
                    formData.append('image', thumbnail);
                    //@ts-ignore
                    const upload = yield fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
                        method: "POST",
                        body: formData
                    });
                    const res = yield upload.json();
                    if (!res.success) {
                        throw Error("Couldn't save thumbnail");
                    }
                    const url = res.data.display_url;
                    const deleteUrl = res.data.delete_url;
                    const doc = yield prisma.document.findFirst({
                        where: {
                            id: docId,
                            users: {
                                some: { userId }
                            }
                        },
                    });
                    if (!doc)
                        throw Error("Coudn't find document");
                    // if(deleteUrl){
                    //   await fetch(deleteUrl, {
                    //     method: 'POST',
                    //   })
                    // }
                    const updatedDoc = yield prisma.document.update({
                        where: {
                            id: docId,
                            users: {
                                some: { userId }
                            }
                        },
                        data: {
                            thumbnail: url,
                            deleteUrl
                        }
                    });
                    console.log(updatedDoc);
                }
                catch (error) {
                    console.error("Error processing submission:", error);
                    // Here error handling could be better. For example, we might want to push
                    // the element back onto the queue or log the error to a file.
                }
            }
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
        }
    });
}
startWorker();
