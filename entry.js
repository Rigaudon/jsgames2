require("dotenv").config()

var express = require("express");
var server = express();
server.use(express.static(__dirname+"/"))
var http = require("http").Server(server);
var io = require("socket.io")(http);
var mem = require("./server/initializeState"); //Object used to store server state

//Load jsgames socket events
var initSocket = require("./server/socketEvents");

server.get("/", function(req, res){
  res.sendFile(__dirname + "/index.html");
});

initSocket(io, mem);

var port = process.env.PORT || 8080;

http.listen(port, function(){
  console.log(`Server started on port ${port}`);
});
