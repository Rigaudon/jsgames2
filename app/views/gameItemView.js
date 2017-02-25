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
	tagName: "li",

	className: function(){
		var myClass = "gameItem";
		if(this.model.get("selected") === 1){
			myClass += " selected";
		}
		return myClass;
	},

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/gameItem.html", "utf8"), this.templateContext());
	},

	triggers: {
		"click": "select:item"
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

	templateContext: function(){
		var playerText;
		if(this.model.get("maxPlayers") == this.model.get("minPlayers")){
			playerText = this.model.get("maxPlayers") + " players";
		}else{
			playerText = this.model.get("minPlayers") + " to " + this.model.get("maxPlayers") + " players";
		}
		return {
			image: this.model.get("image"),
			name: this.model.get("name"),
			description: this.model.get("description"),
			players: playerText,
			selected: this.model.get("selected"),
			options: this.generateOptions(this.model.get("options"))
		};
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

	getOptionVals: function(){
		var options = {};
		var self = this;
		_.forEach(this.model.get("options"), function(option){
			options[option] = self.$(self.ui[option]).val();
		});
		return options;
	},

	validateOptions: function(){
		var roomOptions = this.getOptionVals();
		var self = this;
		var validity;
		var errors = [];
		_.forEach(this.model.get("options"), function(option){
			validity = self.validateOption(option, roomOptions[option]);
			if(!validity.isValid){
				errors.push(validity.message);
			}
		});
		console.log(errors);
		if(errors.length==0){
			self.clearErrors();
			return true;
		}else{
			self.showErrors(errors);
			return false;
		}
	},

	validateOption: function(option, value){
		var returnVal = {
			isValid: false,
			message: ""
		};
		switch(option){
			case "roomName":
				if(value.length == 0 || value.length > 25){
					returnVal.isValid = false;
					returnVal.message = "Invalid room name.";
					break;
				}
			case "roomPassword":
				if(value.length > 25){
					returnVal.isValid = false;
					returnVal.message = "Password must be less than 25 characters.";
					break;
				}
			default:
				returnVal.isValid = true;
		}
		return returnVal;
	},

	showErrors: function(errors){
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

	startGame: function(options){
	}
});

module.exports = GameItemView;
