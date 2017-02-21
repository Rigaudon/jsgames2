var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var NamePickerView = Marionette.View.extend({
	className: "namePicker",
	template: _.template(fs.readFileSync("./app/templates/namePickerView.html", "utf8")),
	
	modelEvents:{
		"change:name": "nameSet",
		"change:error": "showError"
	},

	ui: {
		"nameInput": ".nameInput", 
		"nameMessage": ".namePickerMsg"
	},

	onRender: function(){
		var self = this;
		this.$(this.ui.nameInput).keypress(function(e){
			var keycode = (e.keyCode ? e.keyCode : e.which);
		    if(keycode == '13'){
		    	self.$(self.ui.nameInput).prop("disabled", true);
		        self.requestName(self.$(self.ui.nameInput).val());
		    }
		});
	},

	requestName: function(name){
		this.model.requestName(name);
	},

	nameSet: function(){
		var self = this;
		this.$el.css("opacity", 0);

		self.$el.bind(common.finishTransition, function(){
			if(self.$el.css("opacity") == 0){
				self.remove();	
				self.model.set("ready", true);
			}
		});
			
	},

	showError: function(){
		this.$(this.ui.nameMessage)
			.removeClass("alert-info")
			.addClass("alert-warning")
			.css("display", "block")
			.text(this.model.get("error"))
			.css("opacity", 1);
		this.$(this.ui.nameInput).prop("disabled", false);
	}
});

module.exports = NamePickerView;
