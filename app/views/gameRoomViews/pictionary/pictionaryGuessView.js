var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var PictionaryGuessView = Marionette.View.extend({
  className: "guess",

  ui: {
    "guess": ".guessInput"
  },

  regions: {
    "guessList": ".guessList"
  },

  events: {
    "keypress @ui.guess": "onGuessChange"
  },

  modelEvents: {
    "player:turn": "onPlayerTurn",
    "made:guess": "onMadeGuess"
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/guess.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {};
  },

  onPlayerTurn: function(){
    if (this.model.isMyTurn()){
      $(this.ui.guess).attr("disabled", "disabled");
    } else {
      $(this.ui.guess).attr("disabled", false);
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

  onMadeGuess: function(message){
    if (message.correct){

    } else {
      var guess = $("<div>").text(message.guess);
      $(this.regions.guessList).append(guess);
    }
  },

  sendGuess: function(val){
    this.model.sendGuess(val);
  }
});

module.exports = PictionaryGuessView;
