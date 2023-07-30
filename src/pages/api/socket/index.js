import { Server } from "socket.io";

const SocketHandler = (req, res) => {
  try {
    if (res.socket.server.io) {
      console.log("Server already started!");
      res.end();
      return;
    }

    const io = new Server(res.socket.server, {
      path: "/api/socket_io",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    const onConnection = (socket) => {
      console.log("New connection", socket.id);
      socket.on("joinRoom", (room) => {
        console.log("Joining room", room);
        socket.join(room);
      });

      socket.on("playerControl", (data, room) => {
        console.log("Player control", data);
        console.log("Room", room);
        socket.to(room).emit("playerControl", data);
      });
    };

    io.on("connection", onConnection);

    console.log("Socket server started successfully!");
    res.end();
  } catch (e) {
    console.log(e);
  }
};

export default SocketHandler;
