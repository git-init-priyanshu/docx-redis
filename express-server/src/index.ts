import express from "express";
import z from 'zod';
import cors from 'cors';
import { createClient } from "redis";

const app = express();
app.use(cors({
  origin: ['http://localhost:3000, https://docx-gray.vercel.app']
}));
app.use(express.json());

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});
client.on("error", (err) => console.log("Redis Client Error", err));

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis");

    app.listen(8000, () => {
      console.log("Server is running on port 8000");
    });
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}
// Starting the server
startServer();

const bodySchema = z.object({
  docId: z.string(),
  thumbnail: z.string(),
  userId: z.string(),
})
app.post("/push-to-quque", async (req, res) => {
  const { docId, thumbnail, userId } = req.body;
  try {
    bodySchema.parse({ docId, thumbnail, userId });

    await client.lPush("queue", JSON.stringify({ docId, thumbnail, userId }));

    res.status(200).json({ success: true, data: "Successfully added to the queue" });
  } catch (error) {
    console.error("Redis error:", error);
    res.status(500).json({ success: false, data: "Failed to add to the queue" });
  }
});
