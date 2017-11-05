var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");
var ProgressBar = require("progressbar.js");

var PictionaryGameInfoView = Marionette.View.extend({
  className: "gameInfo",
  modelEvents: {
    "player:turn": "onPlayerTurn",
    "end:turn": "onEndTurn"
  },

  regions: {
    "word": ".word",
    "timer": ".timer"
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/info.html", "utf8"));
  },

  onPlayerTurn: function(message){
    this.setProgressBar(message.turnEnds);
    this.setWord(message.word);
  },

  onEndTurn: function(message){
    this.setWord(message.word);
  },

  setWord: function(word){
    $(this.regions.word).html(word);
  },

  timer: undefined,
  setProgressBar: function(ends){
    if (this.timer && this.timer.destroy){
      this.timer.destroy();
    }
    var duration = ends - Date.now();
    this.timer = new ProgressBar.Line(this.regions.timer, {
      strokeWidth: 4,
      duration: duration,
      trailColor: "#eee",
      trailWidth: 1,
      color: "red",
      svgStyle: { width: "100%", height: "100%" },
      step: (state, bar) => {
        bar.setText(Math.round(bar.value() * duration / 1000));
      }
    });
    this.timer.set(1);
    this.timer.animate(0);
  }

});

module.exports = PictionaryGameInfoView;
