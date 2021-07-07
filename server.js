import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import router from "./route/test.route.js";
import cors from "cors";
import bodyParser from "body-parser";
import {addUser ,removeUser ,getUser ,getUsersInRoom} from './controller/users.controller.js'


const PORT = process.env.PORT || 8000;

const app = express(); 

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

const server = createServer(app);

const io = new Server(server , {
  cors: {
    origins: ["*"],
    handlePreflightRequest: (req , res) => {
    	res.writeHead(200, {
    		"Access-Control-Allow-Origin":"*",
    		"Access-Control-Allow-Methods":"GET,POST",
    		"Access-Control-Allow-Credentials":true,
    	})
    }
  }
});

io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

app.use(router)

server.listen(PORT , () => console.log(`Server Run On Port ${PORT} .....`))