var Marionette = require("backbone.marionette");
var common = require("../common");
var ChatItemView = require("./chatItemView");

var ChatCollectionView = Marionette.CollectionView.extend({
	childView: ChatItemView,
	tagName: "ul"
});

module.exports = ChatCollectionView;
