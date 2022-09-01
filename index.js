import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batepapo_uol");

  server.use(express.json());
  server.use(cors());
});

server.post("/participants", async (req, res) => {
  try {
  } catch (error) {}
});

server.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participante").find().toArray();
    res.send(participants);
  } catch (error) {
    res.sendStatus(400);
  }
});

server.post("/messages", async (req, res) => {
  const messages = req.body;
  try {
    await db.collection("mensagem");
  } catch (error) {}
});

server.get("/messages", async (req, res) => {
  const limit = req.params.limit;

  try {
    const messages = await db.collection("mensagem").find().toArray();
    if (limit) {
      res.send(messages.slice(-limit));
    } else {
      res.send(messages);
    }
  } catch (error) {
    res.sendStatus(400);
  }
});

server.post("/status", async (req, res) => {
  try {
  } catch (error) {}
});

server.listen(5000, () => console.log("Listening on port 5000"));
