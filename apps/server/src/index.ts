import { createServer } from "http";
import { Server } from "socket.io";
import { setupListners } from "./controllers/setupListners";

const PORT = process.env.PORT || 8080;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["POST", "GET"],
  },
});

setupListners(io);

httpServer.listen(PORT, () => console.log(`Server is online at port: ${PORT}`));
