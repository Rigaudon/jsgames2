"use strict"
var RootView = require("./views/rootView");
var User = require("./models/user");
(new RootView({
	model: new User()
	})
).render();