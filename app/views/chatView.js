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
		messageList: ".messageList"
	},

	modelEvents:{
		"add:message" : "messageAdded"
	},

	ui: {
		inputMessage: ".inputMessage textarea"
	},

	onRender: function(){
		var self = this;
		this.showChildView("messageList", new ChatCollectionView({collection: self.model.messageCollection}));
		var inputSelector = this.$(this.ui.inputMessage);
		inputSelector.keypress(function(e){
			var keycode = (e.keyCode ? e.keyCode : e.which);
		    if(keycode == '13'){
		        self.sendChatMessage(inputSelector.val().trim());
		        inputSelector.val("");
		        e.preventDefault();
		        return false;
		    }
		});
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
	}

});

module.exports = ChatView;
