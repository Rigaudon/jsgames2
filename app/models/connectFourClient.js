var Backbone = require("backbone");
var ConnectFourClient = Backbone.Model.extend({
  initialize: function(options){
    var self = this;
    this.player = options.player;
    this.socket = this.player.getSocket();
    this.socket.off("roomInfo");
    this.socket.on("roomInfo", function(roomInfo){
      self.processRoomInfo(roomInfo);
    });
    this.socket.off("gameMessage");
    this.socket.on("gameMessage", function(message){
      self.processGameMessage(message);
    });
    this.set("myTurn", undefined);
    this.set("inProgress", false);
    //We do this instead of the server side event because of the delay it takes to create the view
    this.getRoomInfo();
  },

  getRoomInfo: function(){
    this.socket.emit("requestRoomInfo");
  },

  processRoomInfo: function(roomInfo){
    var self = this;
    this.set("host", roomInfo.host);
    this.set("isHost", this.isHost());
    this.set("gameState", roomInfo.gameState);
    this.set("status", roomInfo.status);
    this.set("players", roomInfo.players);
    this.set("opponentName", this.opponentName());
    this.set("roomName", roomInfo.options.roomName);
    this.set("id", roomInfo.id);
    this.set("inProgress", roomInfo.status == 2);
    if (roomInfo.gameState.playerNum){
      this.set("myPlayerNum", roomInfo.gameState.playerNum[self.player.get("name")]);
      if (roomInfo.gameState.colors){
        this.set("myColor", roomInfo.gameState.colors[self.get("myPlayerNum")]);
      }
    }
    this.trigger("update:room");
  },

  opponentName: function(){
    var players = this.get("players");
    if (players && players.length == 2){
      if (players[0].id != this.socket.id){
        return players[0].name;
      } else {
        return players[1].name;
      }
    } else {
      return false;
    }
  },

  processGameMessage: function(message){
    switch (message.message){
    case "turn":
      if (message.turn == this.player.get("name")){
        this.set("myTurn", true);
      } else {
        this.set("myTurn", false);
      }
      break;
    case "madeMove":
      var targetPosition = this.get("gameState").boardState[message.move].indexOf(-1);
      var color = this.get("gameState").colors[message.playerNum];
      //Set the local gamestate
      this.get("gameState").boardState[message.move][targetPosition] = message.playerNum;
      this.trigger("animate:preview", {
        color: color,
        row: targetPosition,
        col: message.move
      });
      break;
    case "victory":
      this.player.chatClient.addMessage({
        message: message.player + " won!",
        class: "success",
        type: "server"
      });
      this.set("inProgress", false);
      this.set("myTurn", null);
      this.trigger("victory");
      break;
    }
  },

  makeMove: function(col){
    if (this.get("myTurn") && this.get("inProgress")){
      this.socket.emit("gameMessage", {
        command: "makeMove",
        roomId: this.get("id"),
        column: col
      });
    }
  },

  isHost: function(){
    return this.get("host") && this.get("host").id == this.socket.id;
  },

  //Below are host functions
  kickOpponent: function(){
    this.socket.emit("gameMessage", {
      command: "kickOpponent",
      roomId: this.get("id")
    });
  },

  startRoom: function(){
    this.socket.emit("gameMessage", {
      command: "startGame",
      roomId: this.get("id")
    });
  }
});

module.exports = ConnectFourClient;
