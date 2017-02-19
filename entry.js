"use strict"

var express = require('express');
var server = express();
server.use(express.static(__dirname+"/"))
var http = require("http").Server(server);
var io = require("socket.io")(http);

server.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket){
	console.log("User connected");
});

http.listen(3000, function(){
	console.log("Server started on port 3000");
});
