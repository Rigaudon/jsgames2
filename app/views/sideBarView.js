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
		"colorPicker": ".colorPicker"
	},

	events: {
		"click @ui.collapse": "collapseSideBar",
		"blur @ui.colorPicker": "pickColor"
	},

	collapseSideBar: function(){
		this.$(this.regions.sideBarItems)
			.toggleClass("open")
			.toggleClass("closed");

		this.$(this.ui.collapse).find("span")
			.toggleClass("glyphicon-cog")
			.toggleClass("glyphicon-chevron-left");
	},

	pickColor: function(){
		var newColor = $(this.ui.colorPicker).val();
		if(newColor != this.model.get("color")){
			this.model.pickColor(newColor);
		}
	},
});

module.exports = SideBarView;
