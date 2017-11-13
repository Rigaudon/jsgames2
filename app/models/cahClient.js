var GameClient = require("./gameClient");
var _ = require("lodash");

var CardsAgainstHumanityClient = GameClient.extend({

  actions: {
    playerWin: function(message){
      this.trigger("player:win", message);
    },
    playerTurn: function(message){
      this.trigger("player:turn", message);
    },
    setStatus: function(message){
      this.trigger("set:status", message);
    },
    listSubmissions: function(message){
      this.trigger("show:submissions", message);
    },
    submissionPicked: function(message){
      this.trigger("submission:picked", message);
    }
  },

  getPlayerInfo: function(){
    var playerInfo = [];
    if (!this.get("players")){
      return playerInfo;
    }
    var self = this;
    this.get("players").forEach(function(player){
      var info = {
        "id": player.id,
        "name": player.name,
        "color": player.color,
        "score": self.get("gameState") ? (self.get("gameState").points ? self.get("gameState").points[player.id] || 0 : 0) : 0
      };
      playerInfo.push(info);
    });

    return playerInfo;
  },

  submitInput: function(selected){
    if (!this.isMyTurn() && this.inProgress()){
      this.socket.emit("gameMessage", {
        "command": "submitCards",
        "roomId": this.get("id"),
        "selection": selected
      });
    }
  },

  pickSubmission: function(playerId){
    if (this.isMyTurn()){
      this.socket.emit("gameMessage", {
        "command": "pickSubmission",
        "player": playerId,
        "roomId": this.get("id"),
      });
    }
  },

  processRoomInfo: function(roomInfo){
    GameClient.prototype.processRoomInfo.call(this, roomInfo);
    this.trigger("update:room");
  },

  getCards: function(){
    return this.get("gameState") && this.get("gameState").hand ? this.get("gameState").hand : []
  },

  currentPlayer: function(){
    return this.get("gameState") ? this.get("gameState").turnPlayer : null;
  },

  getActiveCard: function(){
    return this.get("gameState") ? this.get("gameState").activeBlackCard : null;
  },

  getCardText: function(position){
    var gameState = this.get("gameState");
    return _.get(gameState, "hand[" + position + "]", "");
  },

  getStatusMsg: function(){
    if (this.get("gameState")){
      return {
        status: this.get("gameState").statusMsg
      };
    }
    return {
      status: ""
    };
  },

  isMyTurn: function(){
    return this.inProgress() && this.get("gameState") && this.isMe(this.get("gameState").turnPlayer);
  },

});

module.exports = CardsAgainstHumanityClient;
