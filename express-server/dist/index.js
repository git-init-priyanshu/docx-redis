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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = __importDefault(require("zod"));
const cors_1 = __importDefault(require("cors"));
const redis_1 = require("redis");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000']
}));
app.use(express_1.default.json());
const client = (0, redis_1.createClient)();
client.on("error", (err) => console.log("Redis Client Error", err));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Connected to Redis");
            app.listen(8000, () => {
                console.log("Server is running on port 8000");
            });
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
        }
    });
}
// Starting the server
startServer();
const bodySchema = zod_1.default.object({
    docId: zod_1.default.string(),
    thumbnail: zod_1.default.string(),
    userId: zod_1.default.string(),
});
app.post("/push-to-quque", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { docId, thumbnail, userId } = req.body;
    try {
        bodySchema.parse({ docId, thumbnail, userId });
        yield client.lPush("queue", JSON.stringify({ docId, thumbnail, userId }));
        res.status(200).json({ success: true, data: "Successfully added to the queue" });
    }
    catch (error) {
        console.error("Redis error:", error);
        res.status(500).json({ success: false, data: "Failed to add to the queue" });
    }
}));
