import express, { text } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batepapo_uol");
});

const now = dayjs();

const userNameSchema = joi.object({
  name: joi.string().trim().required(),
});
const messageSchema = joi.object({
  from: joi.string().trim().required(),
  to: joi.string().trim().required(),
  text: joi.string().trim().required(),
  type: joi.string().valid("message", "private_message"),
  time: joi.any(),
});

server.post("/participants", async (req, res) => {
  const validation = userNameSchema.validate(req.body, { abortEarly: false });
  const [sameName] = await db
    .collection("participante")
    .find({ name: req.body.name })
    .toArray();

  if (sameName) {
    return res.status(409).send("Username already in use");
  }
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(422).send(errors);
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
      time: now.format("HH:mm:ss"),
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
  const messages = {
    from: req.headers.user,
    to: req.body.to,
    text: req.body.text,
    type: req.body.type,
    time: now.format("HH:mm:ss"),
  };

  const [activeUser] = await db
    .collection("participante")
    .find({ name: req.headers.user })
    .toArray();

  const validation = messageSchema.validate(messages, { abortEarly: false });

  if (!activeUser) {
    return res.status(422).send("Invalid user");
  }
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(422).send(errors);
  }
  try {
    await db.collection("mensagem").insertOne(messages);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(400);
  }
});

server.get("/messages", async (req, res) => {
  const limit = req.query.limit;

  try {
    const messages = await db
      .collection("mensagem")
      .find({
        $or: [
          { from: req.headers.user },
          { to: "Todos" },
          { to: req.headers.user },
        ],
      })
      .toArray();
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
  const [activeUser] = await db
    .collection("participante")
    .find({ name: req.headers.user })
    .toArray();

  if (!activeUser) {
    return res.sendStatus(404);
  }
  try {
    await db
      .collection("participante")
      .updateOne(
        { name: req.headers.user },
        { $set: { lastStatus: Date.now() } }
      );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
});

server.delete("/messages/:id", async (req, res) => {
  const id = req.params.id;

  const msg = await db.collection("mensagem").findOne({ _id: ObjectId(id) });

  if (!msg) {
    return res.sendStatus(404);
  }
  if (msg.from != req.headers.user) {
    return res.sendStatus(401);
  }
  try {
    await db.collection("mensagem").deleteOne({ _id: ObjectId(id) });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(400);
  }
});

server.put("/messages/:id", async (req, res) => {
  const id = req.params.id;
  const message = {
    from: req.headers.user,
    to: req.body.to,
    text: req.body.text,
    type: req.body.type,
  };
  const validation = messageSchema.validate(message, { abortEarly: false });
  const msg = await db.collection("mensagem").findOne({ _id: ObjectId(id) });

  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(422).send(errors);
  }
  if (!msg) {
    return res.sendStatus(404);
  }
  if (msg.from != req.headers.user) {
    return res.sendStatus(401);
  }
  try {
    await db.collection("mensagem").updateOne(
      {
        _id: msg._id,
      },
      { $set: message }
    );
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(400);
  }
});

setInterval(async () => {
  const inactive = await db
    .collection("participante")
    .find({ lastStatus: { $lt: Date.now() - 10000 } })
    .toArray();

  inactive.forEach((ans) => {
    db.collection("mensagem").insertOne({
      from: ans.name,
      to: "Todos",
      text: "sai na sala...",
      type: "status",
      time: now.format("HH:mm:ss"),
    });
  });

  await db
    .collection("participante")
    .deleteMany({ lastStatus: { $lt: Date.now() - 10000 } });
}, 15000);

server.listen(5000, () => console.log("Listening on port 5000"));
