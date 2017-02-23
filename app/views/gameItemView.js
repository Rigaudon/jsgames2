var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var GameItemView = Marionette.View.extend({
	tagName: "li",
	template: _.template(fs.readFileSync("./app/templates/gameItem.html", "utf8")),
	triggers: {
		"click": "select:item"
	},
	//@TODO: HANDLEBARS, REMOVE THESE
	//@TODO: FIX UP EVERYTHING HERE
	regions: {
		"image": ".gameImageContainer",
		"name": ".gameInfoName",
		"players": ".gameInfoPlayers",
		"description": ".gameInfoDescription"
	},

	onRender: function(){
		this.$(this.regions.image).html("<img src='static/images/" + this.model.get("image") + "' width='150px' height='150px'>");
		this.$(this.regions.name).text(this.model.get("name"));
		this.$(this.regions.description).text(this.model.get("description"));
		if(this.model.get("maxPlayers") == this.model.get("minPlayers")){
			this.$(this.regions.players).text(this.model.get("maxPlayers") + " players");
		}else{
			this.$(this.regions.players).text(this.model.get("minPlayers") + " to " + this.model.get("maxPlayers") + " players");
		}
	}
});

module.exports = GameItemView;
