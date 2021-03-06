var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

//Static for now, since can't load templates dynamically
var gameSpecificOptions = {
  //Exploding Kittens
  "expansionImploding": fs.readFileSync("./app/templates/partials/gameOptions/explodingKittens/expansionImploding.html")
};

var gameOptions = _.assign({
  "start": fs.readFileSync("./app/templates/partials/gameOptions/start.html"),
  "roomName": fs.readFileSync("./app/templates/partials/gameOptions/roomName.html"),
  "roomPassword": fs.readFileSync("./app/templates/partials/gameOptions/roomPassword.html"),
}, gameSpecificOptions);

var GameItemView = Marionette.View.extend({

  className: "gameOptionsView",

  initialize: function(options){
    this.gameModel = options.gameModel;
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/gameItem.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    var playerText;
    if (this.gameModel.get("maxPlayers") == this.gameModel.get("minPlayers")){
      playerText = this.gameModel.get("maxPlayers") + " players";
    } else {
      playerText = this.gameModel.get("minPlayers") + " to " + this.gameModel.get("maxPlayers") + " players";
    }
    return {
      image: this.gameModel.get("image"),
      name: this.gameModel.get("name"),
      description: this.gameModel.get("description"),
      players: playerText,
      selected: this.gameModel.get("selected"),
      options: this.generateOptions(this.gameModel.get("options"))
    };
  },

  regions: {
    "info": ".alertInfo",
  },

  ui: _.assign({
    "roomName": ".roomName input",
    "roomPassword": ".roomPassword input",
    "start": ".startGame"
  }, {
    //Game Specific UI
    //Exploding Kittens
    "expansionImploding": ".expansionImploding input"
  }),

  events: {
    "click @ui.start": "validateOptions"
  },

  modelEvents: {
    "clear:errors": "clearErrors",
    "show:errors": "showErrors"
  },

  onRender: function(){
    var self = this;
    this.$(this.ui.roomName).val(self.model.user.get("name") + "'s room");
  },

  generateOptions: function(options){
    var generated = "";
    var self = this;
    _.forEach(options, function(option){
      generated += self.generateOption(option);
    });

    return generated;
  },

  generateOption: function(option){
    return gameOptions[option];
  },

  showErrors: function(){
    var errors = this.model.get("errors");
    this.clearErrors();
    var errRegion = this.$(this.regions.info);
    var regionText = "<ul>";
    errRegion.addClass("alert-danger");
    _.forEach(errors, function(error){
      regionText += "<li>" + error + "</li>";
    });
    regionText += "</ul>";
    errRegion.html(regionText);
  },

  clearErrors: function(){
    var errRegion = this.$(this.regions.info);
    errRegion.empty();
    errRegion.removeClass("alert-danger");
  },

  getOptionVals: function(){
    var options = {};
    var self = this;
    _.forEach(this.gameModel.get("options"), function(option){
      var inputEl = self.$(self.ui[option]);
      if (inputEl.attr("type") == "checkbox"){
        options[option] = inputEl.is(":checked");
      } else {
        options[option] = self.$(self.ui[option]).val();
      }
    });
    return options;
  },

  validateOptions: function(){
    var optionVals = this.getOptionVals();
    if (this.model.validateOptions(optionVals)){
      this.model.setOptions(optionVals);
      this.startGame();
    }
  },

  startGame: function(){
    this.model.begin();
  }

});

module.exports = GameItemView;
