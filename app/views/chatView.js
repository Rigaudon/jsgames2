var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var ChatCollectionView = require("./ChatCollectionView");

var ChatView = Marionette.View.extend({
	className: "chatViewContainer",
	template: _.template(fs.readFileSync("./app/templates/chatView.html", "utf8")),
	regions: {
		main: ".chatMain",
		messageList: ".messageList",
	},

	modelEvents:{
		"add:message" : "messageAdded",
	},

	ui: {
		inputMessage: ".inputMessage textarea",
		collapse: ".collapseChat",
	},

	events: {
		"click @ui.collapse" : "collapseChat",
		"keypress @ui.inputMessage": "onChatInput",
	},
 
	onRender: function(){
		var self = this;
		this.showChildView("messageList", new ChatCollectionView({collection: self.model.messageCollection}));
	},

	onChatInput: function(e){
		var keycode = (e.keyCode ? e.keyCode : e.which);
	    if(keycode == '13'){
	        this.sendChatMessage($(e.target).val().trim());
	        this.$(e.target).val("");
	        e.preventDefault();
	        return false;
	    }
	},

	sendChatMessage: function(message){
		this.model.sendChatMessage(message.trim());
	},

	messageAdded: function(){
		//Stick to bottom
		var scrollDiv = this.$(this.regions.messageList);
		if(Math.abs(scrollDiv[0].scrollHeight-scrollDiv.scrollTop() - scrollDiv.outerHeight()) < 50){
			scrollDiv.scrollTop(scrollDiv[0].scrollHeight);
		}
	},

	collapseChat: function(){
		this.$(this.regions.main)
			.toggleClass("open")
			.toggleClass("closed");

		this.$(this.ui.collapse).find("span")
			.toggleClass("glyphicon-chevron-right")
			.toggleClass("glyphicon-chevron-left");
	}

});

module.exports = ChatView;