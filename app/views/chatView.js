var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var ChatItemView = Marionette.View.extend({
  tagName: "li",
  className: "chatItem",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/chatItem.html", "utf8"), this.templateContext());
  },

  regions: {
    time: ".chatTime",
    name: ".chatName",
    message: ".chatMessage"
  },

  templateContext: function(){
    return {
      time: this.formatDate(),
      name: this.formatName(),
      message: this.formatMessage(),
      color: this.model.get("color")
    };
  },

  formatDate: function(){
    return this.model.get("time");
  },

  formatName: function(){
    return this.model.get("name");
  },

  formatMessage: function(){
    return this.model.get("message");
  }

});

var ChatItemServerView = Marionette.View.extend({
  tagName: "li",
  className: function(){
    var myClass = "chatItemServer";
    if (this.model.get("class")){
      myClass += " " + this.model.get("class");
    }
    return myClass;
  },
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/chatItemServer.html", "utf8"), this.templateContext());
  },
  templateContext: function(){
    return {
      message: this.model.get("message")
    };
  }
});

var ChatCollectionView = Marionette.CollectionView.extend({
  childView: function(item){
    if (item.get("type") == "player"){
      return ChatItemView;
    } else {
      return ChatItemServerView;
    }
  },
  tagName: "ul"
});

var ChatView = Marionette.View.extend({
  className: "chatViewContainer",

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/chatView.html", "utf8"), this.templateContext());
  },

  regions: {
    main: ".chatMain",
    messageList: ".messageList",
  },

  modelEvents: {
    "add:message": "messageAdded",
    "change:channel": "render"
  },

  ui: {
    inputMessage: ".inputMessage textarea",
    collapse: ".collapseChat",
  },

  events: {
    "click @ui.collapse": "collapseChat",
    "keypress @ui.inputMessage": "onChatInput",
  },

  templateContext: function(){
    return {
      room: this.model.get("channel").display
    };
  },

  onRender: function(){
    var self = this;
    this.showChildView("messageList", new ChatCollectionView({ collection: self.model.messageCollection }));
  },

  onChatInput: function(e){
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == "13"){
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
    if (Math.abs(scrollDiv[0].scrollHeight - scrollDiv.scrollTop() - scrollDiv.outerHeight()) < 50){
      scrollDiv.scrollTop(scrollDiv[0].scrollHeight);
    }
  },

  collapseChat: function(){
    this.$(this.regions.main)
      .toggleClass("open")
      .toggleClass("closed");

    this.$(this.ui.collapse).find("span")
      .toggleClass("glyphicon-comment")
      .toggleClass("glyphicon-chevron-right");
  }

});

module.exports = ChatView;
