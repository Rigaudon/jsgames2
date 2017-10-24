var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var SideBarView = Marionette.View.extend({
	className: "fullWidth fullHeight",
	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/sideBarView.html", "utf8"), this.templateContext());
	}, 

	templateContext: function(){
		return {
			color: this.model.get("color")
		};
	},

	regions: {
		"sideBarItems": ".sideBarItems"
	},

	ui: {
		"collapse": ".collapseSideBar",
		"colorPicker": ".colorPicker",
		"sound": ".volumeControl"
	},

	events: {
		"click @ui.collapse": "collapseSideBar",
		"blur @ui.colorPicker": "pickColor",
		"click @ui.sound": "toggleSound"
	},

	collapseSideBar: function(){
		this.$(this.regions.sideBarItems)
			.toggleClass("open")
			.toggleClass("closed");

		this.$(this.ui.collapse).find("span")
			.toggleClass("glyphicon-chevron-right")
			.toggleClass("glyphicon-chevron-left");
	},

	pickColor: function(){
		var newColor = $(this.ui.colorPicker).val();
		if(newColor != this.model.get("color")){
			this.model.pickColor(newColor);
		}
	},

	toggleSound: function(){
		window.soundsEnabled = !window.soundsEnabled;
		$(this.ui.sound).toggleClass("glyphicon-volume-up").toggleClass("glyphicon-volume-off");
	}
});

module.exports = SideBarView;
