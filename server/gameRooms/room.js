var Backbone = require("backbone");
var _ = require("lodash");
var moment = require("moment-timezone");

var Room = Backbone.Model.extend({

  initialize: function(options){
    this.io = options.io;
    this.set("options", options.options);
    this.set("status", 0);
    this.set("players", new Backbone.Collection());
    this.set("hasPassword", options.hasPassword);
    this.set("maxPlayers", options.maxPlayers);
    this.set("channel", "game" + this.get("id"));
    this.set("gameState", {});
    console.log(`${moment(new Date()).format("[[]MM-DD-YY|h:mm:ss A[]]")} Room ${this.get("options").roomName}, playing ${this.get("options").gameId}, created with id: ${this.get("id")}`);
  },

  switchChannel(socket, name, from, to){
    //Any way to move me to chat controller?
    this.io.sockets.in(from.channel).emit("chatMessage", {
      message: name + " left " + from.display + ".",
      type: "server"
    });
    socket.leave(from.channel);
    socket.join(to.channel);
    this.io.sockets.in(to.channel).emit("chatMessage", {
      message: name + " joined " + to.display + ".",
      type: "server"
    });
  },

  playerJoin: function(playerModel){
    var self = this;
    self.switchChannel(	playerModel.get("socket"),
      playerModel.get("name"),
      { channel: "global",
							  display: "global chat"
      },
      { channel: self.get("channel"),
							  display: self.get("options").roomName
      });
    var roomPlayers = this.get("players");
    if (roomPlayers.length == 0){
      this.set("host", playerModel.clientJSON());
    }
    roomPlayers.add(playerModel);
    if (this.get("players").length == this.get("maxPlayers")){
      this.set("status", 1);
    }
    this.emitToAllExcept(playerModel.id, "playerJoin");
  },

  playerLeave: function(socket){
    var self = this;
    var playerId = socket.id;

    self.switchChannel( socket,
      self.get("players").get(socket.id).get("name"),
      { channel: self.get("channel"),
							  display: self.get("options").roomName
      },
      { channel: "global",
							  display: "global chat"
      });

    this.get("players").remove(playerId);
    if (this.get("players").length == 0){
      this.deleteSelf();
    } else {
      if (this.get("players").length == 1){
        this.set("status", 0);
      }
      if (this.get("host").id == playerId){
        var randomPlayer = self.get("players").at(Math.floor(Math.random() * self.get("players").length));
        this.set("host", randomPlayer.clientJSON());
      }
    }
    this.emitToAllExcept(null, "playerLeave");
  },

  deleteSelf: function(){
    console.log(`${moment(new Date()).format("[[]MM-DD-YY|h:mm:ss A[]]")} Room id ${this.get("id")} deleted.`);
    this.collection.remove(this);
  },

  sendRoomInfo: function(socket, event){
    //Overwrite me!
    socket.emit("roomInfo", _.assign(this.toJSON(socket.id), { event: event }));
  },

  clientJSON: function(socketId){
    //Overwrite me if necessary!
    var returnObj = {};
    returnObj.hasPassword = this.get("hasPassword");
    returnObj.host = this.get("host");
    returnObj.id = this.get("id");
    returnObj.maxPlayers = this.get("maxPlayers");
    returnObj.status = this.get("status");
    returnObj.id = this.get("id");
    var myOptions = this.get("options");
    returnObj.options = {
      gameId: myOptions.gameId,
      roomName: myOptions.roomName
    };

    var myPlayers = this.get("players").models;
    var players = [];
    for (var i = 0; i < myPlayers.length; i++){
      players.push(this.transformPlayerJson(myPlayers[i].clientJSON()));
    }
    returnObj.players = players;
    returnObj.gameState = this.gameStateJson(this.get("gameState"), socketId);
    return returnObj;
  },

  gameStateJson: function(gameState){
    return gameState;
  },

  transformPlayerJson: function(player){
    return player;
  },

  prettifyGameState: function(){
    //Overwrite me if neccessary!
    return this.get("gameState");
  },

  toJSON: function(socketId){
    //Overwrite me if necessary!
    var clientJSON = this.clientJSON(socketId);
    clientJSON.options.roomPassword = this.get("options").roomPassword;
    return clientJSON;
  },

  emitToAllExcept: function(playerId, event){
    var self = this;
    _.forEach(self.get("players").models, function(playerModel){
      if (playerId != playerModel.id){
        self.sendRoomInfo(playerModel.get("socket"), event);
      }
    });
  },

  executeCommand: function(options, playerId){
    //Overwrite me!
    console.log(options);
    console.log(playerId);
    console.error("Execute command not implemented!");
  },

  emitGameMessage: function(message){
    this.io.in(this.get("channel")).emit("gameMessage", message);
  },

  getSocketFromPID: function(playerId){
    var player = this.get("players").get(playerId);
    if (player){
      return player.get("socket");
    } else {
      return null;
    }
  },

  getRandomPlayer: function(){
    var players = this.get("players");
    if (players.length){
      return players.at(Math.floor(players.length * Math.random()));
    }
  },

  emitGameMessageToAllExcept: function(socketIds, message){
    var self = this;
    _.forEach(self.get("players").models, function(player){
      if (socketIds.indexOf(player.get("id")) == -1){
        player.get("socket").emit("gameMessage", message);
      }
    });
  },

  inProgress: function(){
    return this.get("status") == 2;
  },

});

module.exports = Room;
