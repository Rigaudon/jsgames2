var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var NamePickerView = require("./namePickerView");
var GameRoomsView = require("./gameRoomsView");

var RootView = Marionette.View.extend({
	className: "root",
	template: _.template(fs.readFileSync("./app/templates/rootView.html", "utf8")),

	modelEvents: {
		"change:pid" 	: "onPidChange",
		"change:ready"	: "loadGameRooms",
		"change:name"	: "onNameChange"
	},

	regions: {
		contentRegion: 	".content",
		loadingRegion: 	".loading",
		logoRegion:  	".logo"
	},

	//Should only be called when the user connects
	onPidChange: function(){
		var self = this;
		var cSelector = this.$(this.regions.contentRegion);
		var logoSelector = this.$(this.regions.logoRegion);
		
		//Chrome fix
		var renderedNamePicker = false;

		//When the loading message fades,
		cSelector.one(common.finishTransition, function(){
			//Move logo out of screen
			logoSelector.addClass("expanded");
		});

		//When the logo moves off the screen,
		logoSelector.one(common.finishTransition, function(){
			//Remove the logo
			logoSelector.remove();
			self.$el.addClass("noInvert");
			if(renderedNamePicker){
				return;
			}

			renderedNamePicker = true;
			//Show name picker
			self.showChildView("contentRegion", new NamePickerView({model: self.model}));
			cSelector.css("opacity", 1);
		});

		//Fade out the loading message
		cSelector.css("opacity", 0);
	},

	loadGameRooms: function(){
		this.showChildView("contentRegion", new GameRoomsView({model: this.model}));
		this.$(this.regions.contentRegion).css("opacity", 1);
	},

	onNameChange: function(){
		this.$(this.regions.contentRegion).css("opacity", 0);
	}
});

module.exports = RootView;
