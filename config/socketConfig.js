// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");

// let io;

// module.exports = {
  
//   init: (server) => {

//   io = new Server(server, {
//     cors: {
//       origin: "http://localhost:3000",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });


//     // Use middleware to check token from cookies or handshake auth
//     io.use((socket, next) => {

//       cookieParser()(socket.request, {}, (err) => {
//         if (err) return next(new Error("Error parsing cookies"));

//         const token =
//           socket.handshake.auth.token || socket.request.cookies.token;

//         if (!token) {
//           return next(new Error("Authentication error: Token not provided"));
//         }

//         // Verify JWT token
//         jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//           if (err) {
//             return next(new Error("Authentication error: Invalid token"));
//           }

//           // Store user data on the socket object for later use
//           socket.user = decoded;
//           next();
//         });
//       });
//     });


//     io.on("connection", (socket) => {

//       console.log("New User Connected:", socket.id);

//       console.log("Authenticated User:", socket.user);

    

//       socket.on("joinCarRoom", async (carId) => {
        
//         socket.join(`car_${carId}`);

//         console.log(`User ${socket.user.email} joined room for car_${carId}`);

//       });

//       socket.on("newHighestBid", async (data) => {

//         console.log(data)
//         const { title , carId,bidAmount,image } = data;


//         try {

//           io.emit('bidUpdated', { carId , bidAmount });

//           socket.to(`car_${carId}`).emit("notify", {
//             title:title,
//             body:bidAmount,
//             carId,
//             bidAmount,
//             image
//           });

//           console.log(`Real-time update sent to room car_${carId}`);

//         } catch (err) {
//           console.error("Error updating notifications:", err);
//         }
//       });

//       socket.on("disconnect", () => {
//         console.log("User Disconnected:", socket.id);
//       });
//     });

//     return io;
//   },

//   getIO: () => {
//     if (!io) {
//       throw new Error("Socket.io not initialized");
//     }
//     return io;
//   },
// };




const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

let io;

const init = (server) => {
  
  if (io) {
    console.log('Socket.io already initialized');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    cookieParser()(socket.request, {}, (err) => {
      if (err) return next(new Error("Error parsing cookies"));

      const token = socket.handshake.auth.token || socket.request.cookies.token;

      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error("Authentication error: Invalid token"));
        }

        socket.user = decoded;
        next();
      });
    });
  });

    io.on("connection", (socket) => {

      console.log("New User Connected:", socket.id);

      console.log("Authenticated User:", socket.user);

    

      socket.on("joinCarRoom", async (carId) => {
        
        socket.join(`car_${carId}`);

        console.log(`User ${socket.user.email} joined room for car_${carId}`);

      });

      socket.on("newHighestBid", async (data) => {

        console.log(data)
        const { title , carId,bidAmount,image } = data;


        try {

          io.emit('bidUpdated', { carId , bidAmount });

          socket.to(`car_${carId}`).emit("notify", {
            title:title,
            body:bidAmount,
            carId,
            bidAmount,
            image
          });

          console.log(`Real-time update sent to room car_${carId}`);

        } catch (err) {
          console.error("Error updating notifications:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
      });
    });

    return io;
};

module.exports = {
  init,
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
};
