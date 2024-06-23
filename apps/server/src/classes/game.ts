import { Server, Socket } from "socket.io";
import { generateParagraph } from "../util/paraGenerater";
import { rooms } from "../controllers/setupListners";

export class Game {
  gameStatus: "not-started" | "in-progress" | "finished";
  gameId: string;
  players: { id: string; score: number; name: string }[];
  io: Server;
  gameHost: string;
  paragraph: string;

  constructor(id: string, io: Server, host: string) {
    (this.gameId = id),
      (this.gameHost = host),
      (this.io = io),
      (this.players = []),
      (this.paragraph = ""),
      (this.gameStatus = "not-started");
  }

  setupListners(socket: Socket) {
    socket.on("start-game", async () => {
      if (this.gameStatus == "in-progress")
        return socket.emit("error", "game in progres");
      if (this.gameHost !== socket.id)
        return socket.emit("error", "Only the host can start the game");

      this.players.forEach((player) => {
        player.score = 0;
      });
      this.io.to(this.gameId).emit("players", this.players);
      this.gameStatus = "in-progress";
      const paragraph = await generateParagraph();
      this.paragraph = paragraph;
      this.io.to(this.gameId).emit("game-strated", paragraph);

      setTimeout(() => {
        this.gameStatus = "finished";
        this.io.to(this.gameId).emit("game-finished");
        this.io.to(this.gameId).emit("players", this.players);
      }, 60000);
    });

    socket.on("player-typed", (typed: string) => {
      if (this.gameStatus == "in-progress")
        return socket.emit("error", "game has not statred yet");

      const splitedParagraph = this.paragraph.split(" ");
      const splitedTyped = typed.split(" ");
      let score = 0;
      for (let i = 0; i <= splitedParagraph.length; i++) {
        if (splitedParagraph[i] === splitedTyped[i]) {
          score++;
        } else {
          break;
        }
      }

      const player = this.players.find((player) => player.id === socket.id);

      if (player) player.score = score;

      this.io.to(this.gameId).emit("player-score", { id: socket.id, score });
    });

    socket.on("leave", () => {
      if (socket.id == this.gameHost) {
        this.players = this.players.filter((player) => player.id !== socket.id);
        if (this.players.length !== 0) {
          //@ts-ignore
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("new-host", this.gameHost);
          this.io.to(this.gameId).emit("player-left", socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }
      socket.leave(this.gameId);
      this.players = this.players.filter((player) => player.id !== socket.id);
      this.io.to(this.gameId).emit("player-left", socket.id);
    });
    socket.on("disconnect", () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id !== socket.id);

        if (this.players.length !== 0) {
          //@ts-ignore
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("new-host", this.gameHost);
          this.io.to(this.gameId).emit("player-left", socket.id);
        } else {
          // Delete the game if the host leaves and there are no players
          rooms.delete(this.gameId);
        }
      }

      socket.leave(this.gameId);
      this.players = this.players.filter((player) => player.id !== socket.id);
    });
  }

  joinPlayers(id: string, socket: Socket, name: string) {
    if (this.gameStatus === "in-progress")
      return socket.emit(
        "error",
        "Game is in progress plase with untill game is over"
      );
    this.players.push({ id, name, score: 0 });

    this.io.to(this.gameId).emit("player-joined", {
      id,
      name,
      score: 0,
    });

    socket.emit("player", this.players);
    socket.emit("game-host", this.gameHost);

    this.setupListners(socket);
  }
}
