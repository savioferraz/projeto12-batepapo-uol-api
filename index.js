import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

server.use(express.json());
server.use(cors());
mongoClient.connect().then(() => {
  db = mongoClient.db("batepapo_uol");
});

server.listen(5000, () => console.log("Listening on port 5000"));
