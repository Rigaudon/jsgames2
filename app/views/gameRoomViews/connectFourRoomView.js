var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ConnectFourClient = require("../../models/connectFourClient");
var fs = require("fs");

var ConnectFourRoomView = Marionette.View.extend({
	initialize: function(options){
		this.player = options.player;
		this.model = new ConnectFourClient({socket: options.player.getSocket()});
	},

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/gameRooms/connectFour.html", "utf8"), this.templateContext());
	},

	className: "connectFourRoom",
	templateContext: function(){
		var opponentName = this.model.get("opponentName") || "Waiting for opponent...";
		var roomName = this.model.get("roomName") || "Connect Four";
		return {
			opponent: opponentName,
			controls: this.generateControls(),
			roomName: roomName
		};
	},

	modelEvents: {
		"update:room": "render"
	},

	generateControls: function(){
		//change me
		if(this.model.get("host") == this.player.getSocket().id){
			return "host options";
		}
		return "options";
	},

});

module.exports = ConnectFourRoomView;
