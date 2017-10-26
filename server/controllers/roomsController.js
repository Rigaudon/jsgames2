var Backbone = require("backbone");
var _ = require("lodash");
var games = require("../../games.json");
var gamesCollection = new Backbone.Collection(games);

var ConnectFourRoom = require("../gameRooms/connectFour/connectFourRoom");
var UnoRoom = require("../gameRooms/uno/unoRoom");
var ExplodingKittensRoom = require("../gameRooms/explodingKittens/explodingKittensRoom");

var nextGameRoomId = 0;
var RoomsController = Backbone.Collection.extend({
  idToRoomMap: {
    "1": ConnectFourRoom,
    "2": UnoRoom,
    "4": ExplodingKittensRoom,
  },

  emitActiveRooms: function(socket){
    socket.emit("activeRooms", this.withoutPasswords());
  },

  withoutPasswords: function(){
    var returnList = [];
    for (var i = 0; i < this.models.length; i++){
      var model = this.models[i];
      returnList.push(model.clientJSON());
    }
    return returnList;
  },

  validateAndCreate: function(socket, options){
    var valid = this.validateRoomOptions(options, socket.id);
    if (valid.valid){
      var roomInfo = this.createGameRoom(options, this.io);
      if (roomInfo.id != -1){
        socket.emit("createRoomResponse", {
          success: true,
          id: roomInfo.id,
          password: roomInfo.password
        });
      } else {
        socket.emit("createRoomResponse", {
          success: false,
          message: "That game is not available."
        });
      }
    } else {
      socket.emit("createRoomResponse", {
        success: false,
        message: valid.message
      });
    }
  },

  validateRoomOptions: function(options, playerId){
    var self = this;
    var gameOptions = gamesCollection.get(options.gameId).get("options");
    var returnVal = {
      valid: false,
      message: "A server error occured."
    };

    if (gameOptions && !this.playerMap[playerId]){
      _.forEach(gameOptions, function(gameOption){
        if (!self.validateRoomOption(gameOption, options[gameOption])){
          return returnVal;
        }
      });

      returnVal = {
        valid: true,
        message: ""
      };
    }

    return returnVal;
  },

  validateRoomOption: function(option, val){
    switch (option){
    case "roomName":
      return val && val.length > 0 && val.length <= 25;
    case "roomPassword":
      return val && val.length <= 25;
    case "start":
      return true;
    default:
      return this.validateGameSpecificOption(option, val);
    }
  },

  validateGameSpecificOption: function(option, val){
    switch (option){
    //Exploding Kittens
    case "expansionImploding":
      return val === true || val === false;
    default:
      return false;
    }
  },

  createGameRoom: function(options){
    var game = gamesCollection.get(options.gameId);
    var RoomModel = this.idToRoomMap[options.gameId];
    if (!RoomModel){
      return {
        id: -1
      };
    }
    var newRoom = new RoomModel({
      options: options,
      id: ++nextGameRoomId,
      hasPassword: (options.roomPassword != ""),
      maxPlayers: game.get("maxPlayers"),
      io: this.io
    });
    this.add(newRoom);
    this.emitActiveRooms(this.io);
    return {
      id: nextGameRoomId,
      password: options.roomPassword
    };
  },

  //Deprecate and use io.sockets.adapter.sids[socket.id]?
  playerMap: {}, //map player ids to game rooms

  joinRoom: function(socket, options, playerModel){
    var room = this.get(options.roomId);
    if (this.validateJoinRoom(socket.id, options, room)){
      var roomName = this.get(options.roomId).get("options").roomName;
      this.playerJoin(socket.id, options.roomId, playerModel);
      socket.emit("joinRoomResponse", {
        success: true,
        roomId: options.roomId,
        channelName: roomName
      });
      this.emitActiveRooms(this.io);
    } else {
      socket.emit("joinRoomResponse", {
        success: false
      });
    }
  },

  validateJoinRoom: function(playerId, options, room){
    //Do we care if player is in another room?
    //Probably not...
    return 	room &&
				room.get("options").roomPassword == options.password &&
				!room.get("players").get(playerId) &&
				!this.playerMap[playerId] &&
        room.get("status") == 0 &&
				room.get("maxPlayers") > room.get("players").length;
  },

  playerJoin: function(playerId, roomId, playerModel){
    var roomModel = this.get(roomId);
    roomModel.playerJoin(playerModel);
    playerModel.set("room", roomId);
    this.playerMap[playerId] = roomModel;
  },

  playerLeave: function(socket){
    var playerId = socket.id;
    var inRoom = this.playerMap[playerId];
    if (inRoom){
      inRoom.playerLeave(socket);
      delete this.playerMap[playerId];
      this.emitActiveRooms(this.io);
    }
  },

  requestRoomInfo: function(socket){
    var inRoom = this.playerMap[socket.id];
    if (inRoom){
      inRoom.sendRoomInfo(socket);
    }
  },

  executeCommand: function(options, playerId){
    var gameRoom = this.get(options.roomId);
    if (gameRoom){
      gameRoom.executeCommand(options, playerId);
    }
  },

  processMessage: function(socket, channel, origMessage){
    //Overwrite me!
    this.io.sockets.in(channel).emit("chatMessage", origMessage);
  }

});

module.exports = RoomsController;
