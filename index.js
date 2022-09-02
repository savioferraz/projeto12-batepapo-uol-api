import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const now = dayjs();
const server = express();
server.use(express.json());
server.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batepapo_uol");
});

server.post("/participants", async (req, res) => {
  const userSchema = joi.object({
    name: joi.string().trim().required(),
  });
  const validation = userSchema.validate(req.body);
  const [sameName] = await db.collection("participante").find({}).toArray();

  console.log(sameName.name);
  console.log(req.body.name);
  if (sameName.name === req.body.name) {
    return res.sendStatus(409);
  }
  if (validation.error) {
    console.log(validation.error.details);
    return res.sendStatus(422);
  }
  try {
    await db
      .collection("participante")
      .insertOne({ name: req.body.name, lastStatus: Date.now() });
    db.collection("mensagem").insertOne({
      from: req.body.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: "HH:MM:SS",
    });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(400);
  }
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
  // const username = req.headers.user;
  const messages = {
    from: req.headers.user,
    to: req.body.to,
    text: req.body.text,
    type: req.body.type,
  };

  console.log(messages);
  try {
    // await db.collection("mensagem").insert(messages);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(400);
  }
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
  const username = req.headers.user;
  try {
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(404);
    s;
  }
});

server.listen(5000, () => console.log("Listening on port 5000"));
