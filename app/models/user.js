var Backbone = require("backbone");
var ChatClient = require("./chatClient.js");
var Cookie = require("js-cookie");

var User = Backbone.Model.extend({
  initialize: function(){
    this.set("activeRooms", new Backbone.Collection());
    this.consoleRequests = [];
    this.consoleResponses = new Backbone.Collection();
    if (!io){
      console.error("No socket.io detected!");
      return;
    }
    this.setUpSocket();
  },

  //Players are "ready" when they set an acceptable name
  ready: false,

  getSocket: function(){
    return this.get("socket");
  },

  setUpSocket: function(){
    var self = this;
    self.set("socket", io());
    //Getting unique socket id
    self.getSocket().on("myId", function(value){
      if (self.get("ready")){
        //Connection was reset; refresh the page.
        location.reload();
      } else {
        self.set("pid", value);
      }
    });
    //Getting response about name request
    self.getSocket().on("nameRequest", function(response){
      if (response.success){
        self.set("name", response.name);
        self.set("color", response.color);
        Cookie.set("username", response.name);
        Cookie.set("color", response.color);
      } else {
        self.set("error", response.error);
      }
    });
    //Response from setting color
    self.getSocket().on("setColor", function(response){
      if (response.success){
        Cookie.set("color", response.color);
      }
    });
    //Initialize/update active game rooms
    self.getSocket().on("activeRooms", function(rooms){
      self.set("activeRooms", new Backbone.Collection(rooms));
    });
    //Show disconnection message
    self.getSocket().on("disconnect", function(){
      self.set("disconnected", 1);
    });
    //Response for joining a room
    self.getSocket().on("joinRoomResponse", function(response){
      if (response.success){
        self.set("channelName", response.channelName);
        self.set("roomId", response.roomId);
      } else {
        self.chatClient.addMessage({
          type: "server",
          class: "error",
          message: "Failed to join room."
        });
      }
    });
    //Kicked from room
    self.getSocket().on("leaveRoom", function(){
      self.set("channelName", "Global Chat");
      self.unset("roomId");
    });
    //Received a console message
    self.getSocket().on("consoleMessage", function(message){
      self.consoleResponses.add(message);
    });
  },

  requestName: function(name){
    this.getSocket().emit("nameRequest", {
      name: name,
      color: Cookie.get("color")
    });
  },

  createChatClient: function(){
    if (!this.get("name") || !this.getSocket()){
      console.error("Could not create chat client without a name.");
    } else {
      //this.chatClient = new ChatClient(this.getSocket());
      var self = this;
      this.chatClient = new ChatClient({ userModel: self });
    }
  },

  joinRoom: function(roomId, password){
    this.getSocket().emit("joinRoom", {
      roomId: roomId,
      password: password
    });
  },

  leaveRoom: function(){
    this.getSocket().emit("leaveRoom");
    //Don't need to wait for response
    this.set("channelName", "Global Chat");
    this.unset("roomId");
    this.gameClient = undefined;
  },

  pickColor: function(color){
    this.getSocket().emit("pickColor", color);
  },

  consoleMessage: function(message){
    if (message && message.length > 0){
      this.consoleRequests.push(message);
      this.consoleResponses.add({
        message: "&gt;&gt;&gt; " + message
      });
      var args = message.split(" ");
      switch (args[0]){
      case "clear":
        this.consoleResponses.reset();
        break;
      case "log":
        this.clientConsole(args.splice(1));
        break;
      case "server":
        this.getSocket().emit("consoleMessage", {
          args: args.splice(1)
        });
        break;
      default:
        this.consoleResponses.add({
          message: "Unknown command"
        });
        break;
      }
    }
  },

  clientConsole: function(args){
    if (args.length != 1){
      this.consoleResponses.add({
        message: "Unknown command"
      });
    } else {
      switch (args[0]){
      case "user":
        console.log("%cUser", "color:green; font-size:20pt");
        console.log(this);
        this.consoleResponses.add({
          message: "Logged user"
        });
        break;
      case "gameClient":
        console.log("%cGame Client", "color:blue; font-size:20pt");
        console.log(this.gameClient);
        this.consoleResponses.add({
          message: "Logged game client"
        });
        break;
      case "chatClient":
        console.log("%cChat Client", "color:orange; font-size:20pt");
        console.log(this.chatClient);
        this.consoleResponses.add({
          message: "Logged chat client"
        });
      default:
        this.consoleResponses.add({
          message: "Unknown command"
        });
        break;
      }
    }
  }
});

module.exports = User;
