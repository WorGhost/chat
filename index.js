import express from "express";
import logger from "morgan";

import pkg from "pg"; // Import the default export

const { Client } = pkg;

import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const port = process.env.PORT ?? 3000;
//Juntar todo en un solo server
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "chat",
  password: "123456789",
  port: "5432",
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database!");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY, -- Use SERIAL for auto-incrementing ID
          content TEXT
        );
      `;

    await client.query(createTableQuery);
  } catch (err) {
    console.error("Error connecting to or creating table:", err);
  }
})();

io.on("connection", (socket) => {
  console.log("user has connected");

  socket.on("disconnect", () => {
    console.log("User has disconnected");
  });

  socket.on("chat message", async (msg) => {
    let lastId;
    let result;
    try {
      let query = `INSERT INTO messages (content) VALUES ($1) RETURNING id`;
      let values = [msg];

      result = await client.query(query, values);
      lastId = result.rows[0].id;
      console.log("Message inserted into database!");

      io.emit("chat message", msg, lastId);
    } catch (err) {
      console.error("Error inserting message into database:", err);
    }

    if (!socket.recovered) {
      try{

        let query = `SELECT id, content FROM messages WHERE id > $1`
        let values = [ socket.handshake.auth.serverOffset ?? 0]
        const results = await client.query(query,values)
      } catch ( err ) {
        console.log(err)
      }
    }

  });
});

app.use(logger());

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, console.log("server on port " + port));
