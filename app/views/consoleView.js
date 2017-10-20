var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var ConsoleView = Marionette.View.extend({
	className: "console",
	template:  _.template(fs.readFileSync("./app/templates/consoleView.html", "utf8")),
	ui: {
		"input": ".consoleInput",
		"output": ".consoleOutput"
	},
	events: {
		"keydown @ui.input": "onKeyDown",
		"click": "focusInput"
	},

	requestPointer: -1,

	onRender: function(){
		var self = this;
		var responses = this.model.consoleResponses;
		responses.on("add", function(message){
			var $output = $(self.ui.output);
			$output.append(message.get("message") + "\n");
			$output.scrollTop($output[0].scrollHeight);
		});
		responses.on("reset", function(){
			$(self.ui.output).empty();
		});
	},

	onKeyDown: function(e){
		var keycode = (e.keyCode ? e.keyCode : e.which);
	    if(keycode == 13){
		    var target = $(e.target);
	    	var request = target.val().trim();
	    	if(request.length > 0){
		    	this.model.consoleMessage(request);
		    	target.val("");
		    	this.requestPointer = -1;
	    	}
	    }else if(keycode == 38){ //up arrow
	    	if(this.requestPointer < 0){
	    		this.requestPointer = this.model.consoleRequests.length - 1;
	    	}else{
	    		this.requestPointer--;
	    	}
	    	if(this.requestPointer >= 0){
		    	var target = $(e.target);
	    		target.val(this.model.consoleRequests[this.requestPointer]);
	    	}
	    }else if(keycode == 40){ //down arrow
	    	if(this.requestPointer > 0){
	    		this.requestPointer++;
		    	var target = $(e.target);
	    		target.val(this.model.consoleRequests[this.requestPointer]);
	    	}
	    }
	},

	focusInput: function(){
		$(this.ui.input).focus();
	}

});

module.exports = ConsoleView;
