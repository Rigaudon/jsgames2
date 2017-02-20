var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var NamePickerView = require("./namePickerView");

var RootView = Marionette.View.extend({
	className: "root",
	template: _.template(fs.readFileSync("./app/templates/rootView.html", "utf8")),

	modelEvents: {
		"change:pid" : "onPidChange"
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
		cSelector.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
			if(renderedNamePicker){
				return;
			}

			renderedNamePicker = true;
			//Show name picker
			self.showChildView("contentRegion", new NamePickerView({model: self.model}));
			cSelector.css("opacity", 1);
			//Move logo out of screen
			logoSelector.css("top", "-50%");
		});

		//When the logo moves off the screen,
		logoSelector.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
			//Remove the logo
			logoSelector.remove();
		});

		//Fade out the loading message
		cSelector.css("opacity", 0);
		
	}
});

module.exports = RootView;