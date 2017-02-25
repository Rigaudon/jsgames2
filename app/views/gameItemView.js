var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

//Static for now, since can't load templates dynamically
var gameOptions = {
	"start": fs.readFileSync("./app/templates/partials/gameOptions/start.html"),
	"roomName": fs.readFileSync("./app/templates/partials/gameOptions/roomName.html"),
	"roomPassword": fs.readFileSync("./app/templates/partials/gameOptions/roomPassword.html")
};


var GameItemView = Marionette.View.extend({

	className: "gameOptionsView",

	initialize: function(options){
		this.gameModel = options.gameModel;
	},

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/gameItem.html", "utf8"), this.templateContext());
	},

	templateContext: function(){
		var playerText;
		if(this.gameModel.get("maxPlayers") == this.gameModel.get("minPlayers")){
			playerText = this.gameModel.get("maxPlayers") + " players";
		}else{
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

	ui: {
		"roomName": ".roomName input",
		"roomPassword": ".roomPassword input",
		"start": ".startGame"
	},

	events: {
		"click @ui.start": "validateOptions"
	},

	modelEvents: {
		"clear:errors": "clearErrors",
		"show:errors": "showErrors"
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
			options[option] = self.$(self.ui[option]).val();
		});
		return options;
	},

	validateOptions: function(){
		if(this.model.validateOptions(this.getOptionVals())){
			//this.startGame();
		}
	}

});

module.exports = GameItemView;
