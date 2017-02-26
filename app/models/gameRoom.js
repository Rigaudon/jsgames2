var _ = require("lodash");
var Backbone = require("backbone");
var games = require("../games.json");
var gamesCollection = new Backbone.Collection(games);

var GameRoom = Backbone.Model.extend({

	initialize: function(options){
		this.socket = options.socket;
	},

	getOptions: function(){
		if(this.get("game")){
			return gamesCollection.get(this.get("game")).get("options");
		}
	},

	validateOptions: function(roomOptions){
		var self = this;
		var validity;
		var errors = [];
		_.forEach(this.getOptions(), function(option){
			validity = self.validateOption(option, roomOptions[option]);
			if(!validity.isValid){
				errors.push(validity.message);
			}
		});
		if(errors.length==0){
			self.trigger("clear:errors");
			return true;
		}else{
			self.set("errors", errors);
			self.trigger("show:errors");
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

	setOptions: function(options){
		var self = this;
		this.set("options", _.extend(options, {
			gameId: gamesCollection.get(self.get("game")).get("id")
		}));
	},

	begin: function(){
		console.log(this.get("options"));
		this.socket.emit("createRoom", this.get("options"));
	}

});

module.exports = GameRoom;
