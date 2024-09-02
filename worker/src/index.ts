import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import "dotenv/config"

const client = createClient();
const prisma = new PrismaClient();

async function startWorker() {
  try {
    await client.connect();
    console.log("Worker connected to Redis.");

    while (true) {
      try {
        const data = await client.brPop("queue", 0);
        //@ts-ignore
        const { docId, thumbnail, userId } = JSON.parse(data.element);

        const formData = new FormData();
        formData.append('image', thumbnail);

        //@ts-ignore
        const upload = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
          method: "POST",
          body: formData
        })
        const res = await upload.json();
        if (!res.success) {
          throw Error("Couldn't save thumbnail");
        }
        const url = res.data.display_url;
        const deleteUrl = res.data.delete_url;

        const doc = await prisma.document.findFirst({
          where: {
            id: docId,
            users: {
              some: { userId }
            }
          },
        })
        if (!doc) throw Error("Coudn't find document");

        // if(deleteUrl){
        //   await fetch(deleteUrl, {
        //     method: 'POST',
        //   })
        // }

        const updatedDoc = await prisma.document.update({
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
        })
        console.log(updatedDoc);
      } catch (error) {
        console.error("Error processing submission:", error);
        // Here error handling could be better. For example, we might want to push
        // the element back onto the queue or log the error to a file.
      }
    }
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}

startWorker();
