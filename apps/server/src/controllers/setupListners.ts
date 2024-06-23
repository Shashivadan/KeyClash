import { Server, Socket } from "socket.io";
import { Game } from "../classes/game";

export const rooms = new Map<string, Game>();

export function setupListners(io: Server) {
  io.on("connections", (socket: Socket) => {
    console.log(`connention id ${socket.id}`);

    socket.on("join-game", (roomId: string, name: string) => {
      if (!roomId) return socket.emit("error", "Invaild room ID");
      if (!name) return socket.emit("error", "provide your name");
      socket.join(roomId);
      if (rooms.has(roomId)) {
        const game = rooms.get(roomId);
        if (!game) return socket.emit("error", "Game is not found");
        game.joinPlayers(socket.id, socket, name);
      } else {
        const game = new Game(roomId, io, socket.id);
        rooms.set(roomId, game);
        game.joinPlayers(socket.id, socket, name);
      }
    });
  });
}
