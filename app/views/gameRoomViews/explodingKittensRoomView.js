var _ = require("lodash");
var fs = require("fs");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var ProgressBar = require("progressbar.js");
var CardView = require("./cardView");
var EKCardView = CardView.extend({
  partialImagePath: "/static/images/assets/explodingKittens/",
});
var CardGameView = require("./cardGameView");
var common = require("../../common");
var Promise = require("bluebird");

var ExplodingKittensRoomView = CardGameView.extend({
  gameClient: ExplodingKittensClient,
  cardView: EKCardView,
  viewTemplate: fs.readFileSync("./app/templates/gameRooms/explodingKittens.html", "utf8"),
  playerTemplate: fs.readFileSync("./app/templates/partials/cardPlayer.html", "utf8"),
  className: CardGameView.prototype.className + " explodingKittensRoom",
  modelEvents: _.assign({
    "effect:stf": "seeTheFuture",
    "effect:atf": "alterTheFuture",
    "do:favor": "showFavor",
    "ek:drawn": "onEKDrawn",
    "ek:defused": "onEKDefused",
    "player:exploded": "onPlayerExploded",
    "timer:set": "onSetTimer",
    "topdeck:implode": "showImplodingKitten",
    "ik:drawn": "onDrawImplodingKitten",
    "topdeck:safe": "showCardBack",
    "card:remove": "removeCard",
  }, CardGameView.prototype.modelEvents),

  regions: _.assign({
    "timer": ".timer",
    "choose": ".chooseOptions",
  }, CardGameView.prototype.regions),

  events: _.assign({
    "click @ui.deck": "drawCard",
    "click @ui.card": "onClickCard"
  }, CardGameView.prototype.events),

  cardPathRoot: "/static/images/assets/explodingKittens/",

  renderCards: function(gameState){
    CardGameView.prototype.renderCards.call(this, gameState);
    var self = this;
    $(self.ui.pile).sortable({
      animation: 150,
      group: {
        name: "pile",
        put: function(to, from, el){
          var card = el.card;
          return self.onPut(card);
        }
      },
      onAdd: function(evt){
        var card = evt.item.card;
        self.onCardSelected(card);
      }
    });
    if (gameState.pile && gameState.pile.length){
      var topCard = gameState.pile[gameState.pile.length - 1];
      $(this.ui.pile).css("background-image", "url(" + this.pathForCard(topCard) + ")");
    }
  },

  onPut: function(card){
    var gameState = this.model.get("gameState");
    var inHand = gameState.hand.filter(function(handCard){
      return handCard.id == card.id;
    });
    if (this.model.isExploding){
      return inHand.length && (card.type == "defuse" || card.type == "nope");
    }
    switch (card.type){
    case "cat":
      return this.model.isMyTurn() && inHand.length >= 2;
    case "nope":
      return inHand.length > 0;
    default:
      return this.model.isMyTurn() && inHand.length;
    }
  },

  onCardSelected: function(card){
    if (!this.onPut(card)){
      this.onPlayInvalid();
      return;
    }
    $(this.regions.hand).prepend($(this.ui.pile).find(".card").detach());
    switch (card.type){
    case "feral":
      this.onPlayFeral(card);
      break;
    case "favor":
    case "cat":
    case "tattack":
      this.pickPlayer(card);
      break;
    case "stf":
    case "atf":
    case "bdraw":
    case "reverse":
    case "attack":
    case "skip":
    case "shuffle":
    case "defuse":
    case "nope":
      this.onPlay(card);
      break;
    default:
      throw new Error("Invalid Card Type!");
    }
  },

  pickPlayer: function(card){
    var self = this;
    this.showPickPlayerModal(
      card,
      function(pid){
        //a player is picked
        self.model.playCard({
          card: card,
          target: pid
        });
      },
      function(){
        //Modal was closed (cancelled or completed)
        //May not be necessary...
        $(self.regions.hand).prepend($(self.ui.pile).find(".card").detach());
      }
    );
  },

  cardPlayed: function(options){
    //Render card to top of pile, animate and show status
    var fromEl = this.model.getPlayerById(options.from).el;
    var self = this;
    var player = self.model.getPlayerById(options.from);
    var statusText = player.name + " played a " + options.card.name;
    if (options.with){
      statusText += " with a " + options.with.name;
    }
    if (options.to){
      statusText += " on " + self.model.getPlayerById(options.to).name;
    }
    $(self.regions.status).text(statusText);
    this.animateCardMove(fromEl, this.ui.pile, options.card.image)
      .then(function(){
        //show card image on pile bg
        $(self.ui.pile).css("background-image", "url(" + self.pathForCard(options.card.image) + ")");
      });
    window.playSound(this.cardSounds);
    this.playCardSound(options.card);
  },

  removeCard: function(options){
    this.removeCardFromHand(options.card, options.amount);
  },

  playCardSound: function(card){
    switch (card.type){
    case "nope":
      window.playSound("nope");
      break;
    default:
      break;
    }
  },

  seeTheFuture: function(future){
    var texts = ["Next Card", "2<sup>nd</sup> Card", "3<sup>rd</sup> Card"];
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Seeing the future");
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var self = this;
    if (!future.cards.length){
      bodyEl.prepend($("<div>").text("There are no cards left!"));
    }
    while (future.cards.length){
      let card = future.cards.shift();
      let cardView = $("<div>");
      cardView.addClass("pickCard");
      let cardImg = $("<img>");
      cardImg.attr("src", self.pathForCard(card.image));
      cardView.append(cardImg);
      cardView.append($("<span>").html(texts.shift() || "..."));
      bodyEl.append(cardView);
    };
    chooseEl.off("hidden.bs.modal");
    chooseEl.modal({
      show: true,
      backdrop: false,
      keyboard: true
    });
  },

  alterTheFuture: function(future){
    var texts = ["Next Card", "2<sup>nd</sup> Card", "3<sup>rd</sup> Card"];
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Altering the future");
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var closeBtn = chooseEl.find(".closeModal").detach();
    var self = this;
    if (!future.cards.length){
      bodyEl.prepend($("<div>").text("There are no cards left!"));
    }
    var numCards = future.cards.length;
    var sortableView = $("<div>");
    sortableView.addClass("alterTheFuture");
    var i = 0;
    while (future.cards.length){
      let card = future.cards.shift();
      let cardImg = $("<img>");
      cardImg.attr("data-order", i);
      cardImg.attr("src", self.pathForCard(card.image));
      let wrapper = $("<div>");
      wrapper.append(cardImg);
      sortableView.append(wrapper);
      i++;
    };
    bodyEl.append(sortableView);
    sortableView.sortable({
      animation: 150
    });

    var orderText = $("<div>");
    orderText.addClass("orderText");
    for (var i = 0; i < numCards; i++){
      let text = $("<span>");
      text.html(texts.shift());
      orderText.append(text);
    }
    bodyEl.append(orderText);
    var footerEl = chooseEl.find(".modal-footer");
    var submitBtn = $("<button>");
    submitBtn.addClass("btn-big");
    submitBtn.text("Accept");
    submitBtn.click(function(){
      var newOrder = [];
      $(".alterTheFuture").find("img").each(function(){
        newOrder.push($(this).attr("data-order"));
      });
      self.model.alterTheFuture(newOrder);
      chooseEl.modal("hide");
    });
    footerEl.append(submitBtn);

    chooseEl.off("hidden.bs.modal").on("hidden.bs.modal", function(){
      chooseEl.find(".modal-dialog").prepend(closeBtn);
      footerEl.empty();
    });
    chooseEl.modal({
      show: true,
      backdrop: true,
    });
  },

  onPlayFeral: function(feral){
    var validCards = this.model.getValidFeral();
    if (!validCards.length){
      this.onPlayInvalid();
      return;
    }
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Play Feral Cat With");
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var self = this;
    _.forEach(validCards, function(validCard){
      let cardView = $("<div>");
      cardView.addClass("smallCard");
      let cardImg = $("<img>");
      cardImg.attr("src", self.pathForCard(validCard.image));
      cardView.append(cardImg);
      cardView.on("click", function(){
        self.showPickPlayerModal(
          feral,
          function(pid){
            self.model.playCard({
              card: feral,
              target: pid,
              with: validCard
            });
          },
          function(){}
        );
      });
      bodyEl.append(cardView);
    });
    chooseEl.off("hidden.bs.modal");
    chooseEl.modal({
      show: true,
      backdrop: false
    });
  },

  showFavor: function(message){
    var sourcePlayer = this.model.getPlayerById(message.source);
    var targetPlayer = this.model.getPlayerById(message.target);
    $(this.regions.status).text(targetPlayer.name + " is doing a favor for " + sourcePlayer.name);
    if (message.target != this.model.socket.id){
      return;
    }
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Pick a card to give " + sourcePlayer.name);
    var closeBtn = chooseEl.find(".closeModal").detach();
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var self = this;
    _.forEach(this.model.get("gameState").hand, function(card){
      let cardView = $("<div>");
      cardView.addClass("smallCard");
      let cardImg = $("<img>");
      cardImg.attr("src", self.pathForCard(card.image));
      cardView.append(cardImg);
      cardView.on("click", function(){
        chooseEl.modal("hide");
        self.model.giveFavor({
          card: card,
          target: message.source
        });
      });
      bodyEl.append(cardView);
    });
    chooseEl.off("hidden.bs.modal").on("hidden.bs.modal", function(){
      chooseEl.find(".modal-dialog").prepend(closeBtn);
    });
    chooseEl.modal({
      show: true,
      backdrop: "static",
    });
  },

  showImplodingKitten: function(){
    $(this.ui.deck).css("background-image", "url(" + this.pathForCard("impldktn") + ")");
  },

  showCardBack: function(){
    $(this.ui.deck).css("background-image", "url(" + this.pathForCard("back") + ")");
  },

  onDrawImplodingKitten: function(){
    $(this.regions.status).text("The Imploding Kitten has been drawn!");
    this.showCardAndFlipIntoDeck("impldktn");
  },

  showCardAndFlipIntoDeck: function(card){
    //TODO: move this into a template
    var placeholder = $("<div>");
    placeholder.addClass("placeHolder");
    $(this.ui.deck).append(placeholder);

    var containerEl = $("<div>");
    containerEl.addClass("flipCardContainer");
    var cardEl = $("<div>");
    containerEl.append(cardEl);
    cardEl.addClass("flipCard");
    var front = $("<div>");
    front.addClass("front");
    front.addClass("card");
    front.css("background-image", "url(" + this.pathForCard(card) + ")");
    var back = $("<div>");
    back.addClass("back");
    back.addClass("card");
    back.css("background-image", "url(" + this.pathForCard("back") + ")");
    cardEl.append(front);
    cardEl.append(back);
    cardEl.toggleClass("flipped");
    $(this.ui.deck).append(containerEl);
    containerEl.css("left", "0");

    setTimeout(function(){
      new Promise(function(resolve){
        containerEl.bind(common.finishTransition, resolve);
        containerEl.css("left", "-100%");
      }).then(function(){
        return new Promise(function(resolve){
          cardEl.toggleClass("flipped");
          setTimeout(resolve, 1500);
        });
      }).then(function(){
        return new Promise(function(resolve){
          containerEl.unbind(common.finishTransition).bind(common.finishTransition, resolve);
          containerEl.css("left", "0");
        });
      }).then(function(){
        containerEl.remove();
        placeholder.remove();
      });
    }, 100);
  },

  onEKDrawn: function(message){
    var self = this;
    var player = this.model.getPlayerById(message.player);
    $(this.regions.status).text(player.name + " drew an Exploding Kitten!");
    this.animateCardMove(this.ui.deck, this.ui.pile, message.card)
      .then(function(){
        $(self.ui.pile).css("background-image", "url(" + self.pathForCard(message.card.image) + ")");
      });
    this.renderCardCounts();
  },

  timer: undefined,
  onSetTimer: function(message){
    if (this.timer){
      this.timer.destroy();
    }
    this.timer = new ProgressBar.Circle(this.regions.timer, {
      color: "red",
      duration: message.length,
      strokeWidth: 8,
    });
    this.timer.set(1);
    var self = this;
    this.timer.animate(0, function(){
      this.destroy();
      self.timer = undefined;
    });
  },

  onEKDefused: function(message){
    var player = this.model.getPlayerById(message.player);
    $(this.regions.status).text(player.name + " defused the exploding kitten. It was placed back into the deck.");
    this.renderCardCounts();
    window.playSound("defuse");
  },

  onPlayerExploded: function(message){
    var player = this.model.getPlayerById(message.player);
    $(this.regions.status).text(player.name + " exploded!");
    player.el.addClass("exploded");
    this.renderCardCounts();
    if (this.model.isMe(message.player)){
      $(this.regions.hand).find(".card").remove();
      $(".preview").css("display", "none");
    }
    window.playSound("explode");
  },

  showPickPlayerModal: function(card, callback, onCancel){
    var self = this;
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Play " + card.name + " on:");
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var playerRegions = $(".playtable > .player");
    _.forEach(playerRegions, function(el){
      var playerId = $(el).attr("data-id");
      if (playerId == self.player.get("pid") || $(el).css("display") == "none" || self.model.isExploded(playerId)){
        return;
      }
      var playerEl = $(el).clone();
      playerEl.click(function(){
        chooseEl.modal("hide");
        callback(playerId);
      });
      bodyEl.append(playerEl);
    });
    chooseEl.off("hidden.bs.modal").on("hidden.bs.modal", onCancel.bind(false));
    chooseEl.modal({
      show: true,
      backdrop: false,
      keyboard: true
    });
  },

  renderPlayers: function(players){
    CardGameView.prototype.renderPlayers.call(this, players);
    var self = this;
    players.forEach(function(player){
      var playerEl = player.el;
      playerEl.attr("data-id", player.id);
      if (self.model.isExploded(player.id)){
        playerEl.addClass("exploded");
      }
    });
  },
});

module.exports = ExplodingKittensRoomView;
