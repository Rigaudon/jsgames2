var Backbone = require("backbone");
var util = require("../socketUtil");

var nextMsgId = 0;
var ChatController = Backbone.Collection.extend({
  processMessage: function(socket, message, player, rooms){
    if (util.validateMessage(message, socket, this.io)){
      var origMessage = {
        type: "player",
        id: ++nextMsgId,
        message: message.message,
        name: player.get("name"),
        time: new Date(),
        color: player.get("color")
      };

      if (this.io.sockets.adapter.sids[socket.id]["global"]){
        this.io.sockets.in(message.channel).emit("chatMessage", origMessage);
      } else {
        //delegate message to room controller
        rooms.processMessage(socket, message.channel, origMessage);
      }
    }
  }
});

module.exports = ChatController;
