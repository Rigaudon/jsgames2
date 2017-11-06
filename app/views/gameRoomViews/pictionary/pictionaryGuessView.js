var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var PictionaryGuessView = Marionette.View.extend({
  className: "guess",

  ui: {
    "guess": ".guessInput"
  },

  regions: {
    "guessList": ".guessList",
    "guessListContainer": ".guessListContainer"
  },

  events: {
    "keypress @ui.guess": "onGuessChange"
  },

  modelEvents: {
    "player:turn": "onPlayerTurn",
    "made:guess": "onMadeGuess",
    "end:turn": "onEndTurn"
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/guess.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {};
  },

  onRender: function(){
    $(this.ui.guess).attr("disabled", "disabled");
  },

  onPlayerTurn: function(){
    $(this.regions.guessList).empty();
    if (this.model.isMyTurn()){
      $(this.ui.guess).attr("disabled", "disabled");
    } else {
      $(this.ui.guess).attr("disabled", false);
      $(this.ui.guess).val("");
      $(this.ui.guess).focus();
    }
  },

  onGuessChange: function(e){
    var keycode = e.keyCode || e.which;
    if (keycode === 13){
      //Enter
      this.sendGuess($(this.ui.guess).val());
      $(this.ui.guess).val("");
    }
  },

  onEndTurn: function(){
    $(this.ui.guess).attr("disabled", "disabled");
  },

  onMadeGuess: function(message){
    $(this.regions.guessList).css("max-height", (250 + this.model.get("players").length * 42) + "px");
    var guess = $("<div>");
    var player = this.model.getPlayerById(message.player);
    if (message.correct){
      if (this.model.isMe(message.player)){
        $(this.ui.guess).attr("disabled", "disabled");
      }
      guess.addClass("correct");
      guess.text(player.name + " guessed the word!");
    } else {
      guess.append($("<span class='playerName'>").css("color", player.color).text(player.name));
      guess.append($("<span class='guessItem'>").text(message.guess));
    }
    $(this.regions.guessList).append(guess);
    $(this.regions.guessListContainer).scrollTop($(this.regions.guessListContainer)[0].scrollHeight);
  },

  sendGuess: function(val){
    this.model.sendGuess(val);
  }
});

module.exports = PictionaryGuessView;
