"use strict"

var express = require('express');
var server = express();
server.use(express.static(__dirname+"/"))
var http = require("http").Server(server);
var io = require("socket.io")(http);
//Load jsgames socket events
var initSocket = require("./static/js/socketEvents");

server.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");
});

initSocket(io);

http.listen(3000, function(){
	console.log("Server started on port 3000");
});