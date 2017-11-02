var GameClient = require("./gameClient");

var ConnectFourClient = GameClient.extend({

  processRoomInfo: function(roomInfo){
    GameClient.prototype.processRoomInfo.call(this, roomInfo);
    this.trigger("update:room");
  },

  myColor: function(){
    if (!this.get("gameState")){
      return false;
    }
    var playerNum = this.get("gameState").playerNum[this.player.get("name")];
    return this.get("gameState").colors[playerNum];
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

  myTurn: function(){
    return this.get("gameState").turn == this.player.get("name");
  },

  actions: {
    turn: function(message){
      this.get("gameState").turn = message.turn;
      this.trigger("change:myTurn");
    },
    madeMove: function(message){
      var targetPosition = this.get("gameState").boardState[message.move].indexOf(-1);
      var color = this.get("gameState").colors[message.playerNum];
      //Set the local gamestate
      this.get("gameState").boardState[message.move][targetPosition] = message.playerNum;
      this.trigger("animate:preview", {
        color: color,
        row: targetPosition,
        col: message.move
      });
    },
    victory: function(message){
      this.player.chatClient.addMessage({
        message: message.player + " won!",
        class: "success",
        type: "server"
      });
      this.set("status", 1);
      this.trigger("victory");
    }
  },

  makeMove: function(col){
    if (this.myTurn() && this.inProgress()){
      this.socket.emit("gameMessage", {
        command: "makeMove",
        roomId: this.get("id"),
        column: col
      });
    }
  },

  //Below are host functions
  kickOpponent: function(){
    this.socket.emit("gameMessage", {
      command: "kickOpponent",
      roomId: this.get("id")
    });
  },

});

module.exports = ConnectFourClient;
