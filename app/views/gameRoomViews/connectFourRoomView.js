var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ConnectFourClient = require("../../models/connectFourClient");
var fs = require("fs");

var ConnectFourRoomView = Marionette.View.extend({
  initialize: function(options){
    this.player = options.player;
    this.model = new ConnectFourClient({ player: options.player });
    this.player.gameClient = this.model;
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/gameRooms/connectFour.html", "utf8"), this.templateContext());
  },

  className: "connectFourRoom",

  statusCodes: ["Waiting for players", "Waiting to start", "Playing"],

  templateContext: function(){
    return {
      opponent: this.model.get("opponentName") || "Waiting for opponent...",
      controls: this.getOptions(),
      roomName: this.model.get("roomName") || "Connect Four",
      id: this.model.get("id"),
      status: this.statusCodes[this.model.get("status")],
      host: this.model.get("host") ? ( this.model.get("host").name + (this.model.get("isHost") ? " (you)" : "")) : "",
      isHost: this.model.get("isHost"),
      hostControls: this.getHostOptions(),
      player: this.player.get("name")
    };
  },

  modelEvents: {
    "update:room": "render",
    "change:myTurn": "changeTurn",
    "animate:preview": "animatePreview",
    "victory": "onVictory"
  },

  ui: {
    "leaveBtn": ".leaveBtn",
    "kickBtn": ".kickBtn",
    "startBtn": ".startBtn",
    "cell": ".cell",
    "preview": ".preview",
    "dropPreview": ".dropPreview"
  },

  events: {
    "click @ui.leaveBtn": "leaveRoom",
    "click @ui.kickBtn": "kickOpponent",
    "click @ui.startBtn": "startRoom",
    "mouseover @ui.cell": "cellHover",
    "click @ui.cell": "cellClick"
  },

  onRender: function(){
    this.renderGameState();
  },

  getOptions: function(){
    return "<button class='leaveBtn btn-big'>Leave Room</button>";
  },

  getHostOptions: function(){
    var hostOptions = "";
    if (this.model.get("isHost")){
      var players = this.model.get("players");
      if (players.length == 2 && !this.model.get("inProgress")){
        //Add restart option
        hostOptions += "<button class=\"kickBtn btn-big\">Kick Opponent</button>";
        hostOptions += "<button class=\"startBtn btn-big\">Start Game</button>";
      }
    }
    return hostOptions;
  },

  leaveRoom: function(){
    this.player.leaveRoom();
  },

  kickOpponent: function(){
    this.model.kickOpponent();
  },

  startRoom: function(){
    this.model.startRoom();
  },

  changeTurn: function(){
    if (!this.model.get("inProgress")){
      this.$el.find(".myName").removeClass("currentTurn");
      this.$el.find(".opponentName").removeClass("currentTurn");
      $(this.ui.preview).css("display", "none");
    } else if (this.model.get("myTurn")){
      this.$el.find(".myName").addClass("currentTurn");
      this.$el.find(".opponentName").removeClass("currentTurn");
    } else {
      this.$el.find(".opponentName").addClass("currentTurn");
      this.$el.find(".myName").removeClass("currentTurn");
      $(this.ui.preview).css("display", "none");
    }
  },

  cellHover: function(child){
    if (this.model.get("myTurn") && this.model.get("inProgress")){
      var $elem = $(child.target);
      var position = $elem.position();
      var width = $elem.width();
      this.showPreviewOnCol(position.left, width);
    }
  },

  cellClick: function(child){
    if (this.model.get("myTurn") && this.model.get("inProgress")){
      var $elem = $(child.target);
      var col = $elem.index();
      this.model.makeMove(col);
    }
  },

  onVictory: function(){
    window.showConfetti();
  },

  showPreviewOnCol: function(left, width){
    var preview = $(this.ui.preview);
    preview.css("display", "block");
    preview.attr("src", "/static/images/assets/connectFour/c4" + this.model.get("myColor") + ".png");
    preview.css("width", width);
    preview.css("left", left + 2);
    preview.css("top", -1 * width / 2);
  },

  animatePreview: function(options){
    var elRow = 6 - options.row;
    var elCol = options.col + 1;
    var cell = this.$el.find(`.connectFourBoard .square .row:nth-child(${elRow}) .cell:nth-child(${elCol})`);
    var preview;
    preview = $(this.ui.dropPreview);

    var pieceImg = "/static/images/assets/connectFour/c4" + options.color + ".png";
    preview.attr("src", pieceImg);
    preview.css("width", cell.width());
    preview.css("top", -1 * cell.width() / 2);
    preview.css("left", cell.position().left + 2);
    preview.css("display", "block");
    preview.animate({
      top: cell.position().top + 2
    },
    function(){
      preview.css("display", "none");
      cell.css("background-image", `url(${pieceImg})`);
    });
  },

  renderGameState: function(){
    var gameState = this.model.get("gameState");
    if (gameState && gameState.boardState){
      var boardState = gameState.boardState;
      var highlight = gameState.highlight;
      for (var col = 0; col < boardState.length; col++){
        for (var row = 0; row < boardState[col].length; row++){
          if (boardState[col][row] != -1){
            var cell = this.$el.find(`.connectFourBoard .square .row:nth-child(${6 - row}) .cell:nth-child(${1 + col})`);
            var color = gameState.colors[boardState[col][row]];
            var pieceImg = "/static/images/assets/connectFour/c4" + color + ".png";
            cell.css("background-image", `url(${pieceImg})`);
            if (highlight && highlight.filter(function(val){
              return _.isEqual(val, [col, row]);
            }).length > 0){
              cell.css("background-color", color);
            }
          }
        }
      }
    }
  }
});

module.exports = ConnectFourRoomView;
