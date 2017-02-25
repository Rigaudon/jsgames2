var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var ChatItemView = Marionette.View.extend({
	tagName: "li",
	className: "chatItem",
	template: _.template(fs.readFileSync("./app/templates/chatItem.html", "utf8")),
	
	regions: {
		time: ".chatTime",
		name: ".chatName",
		message: ".chatMessage"
	},

	initialize: function(){
		//@TODO: HANDLEBARS
	},

	onRender: function(){
		this.$(this.regions.time).text(this.formatDate());
		this.$(this.regions.name).text(this.formatName());
		this.$(this.regions.message).text(this.formatMessage());
	},

	formatDate: function(){
		return this.model.get("time");
	},

	formatName: function(){
		this.$(this.regions.name).css("color", this.model.get("color"));
		return this.model.get("name");
	},

	formatMessage: function(){
		return this.model.get("message");
	}

});

module.exports = ChatItemView;
