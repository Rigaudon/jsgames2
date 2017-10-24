var _ = require("lodash");
var fs = require("fs");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var ProgressBar = require("progressbar.js");
var EKCardView = require("./explodingKittensCardView");
var CardGameView = require("./cardGameView");

var ExplodingKittensRoomView = CardGameView.extend({
  gameClient: ExplodingKittensClient,
  cardView: EKCardView,
  viewTemplate: fs.readFileSync("./app/templates/gameRooms/explodingKittens.html", "utf8"),
  playerTemplate: fs.readFileSync("./app/templates/partials/explodingKittens/player.html", "utf8"),
  className: "explodingKittensRoom",
  modelEvents: _.extend(CardGameView.prototype.modelEvents, {
    "effect:stf": "seeTheFuture",
    "do:favor": "showFavor",
    "ek:drawn": "onEKDrawn",
    "ek:defused": "onEKDefused",
    "player:exploded": "onPlayerExploded",
    "timer:set": "onSetTimer",
  }),

  regions: _.extend(CardGameView.prototype.regions, {
    "timer": ".timer",
    "choose": ".chooseOptions",
  }),

  events: _.extend(CardGameView.prototype.events, {
    "click @ui.deck": "drawCard",
    "click @ui.card": "onClickCard"
  }),


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
    if(gameState.pile && gameState.pile.length){
      var topCard = gameState.pile[gameState.pile.length - 1];
      $(this.ui.pile).css("background-image", "url(" + this.pathForCard(topCard) + ")");
    }
  },

  onPut: function(card){
    var gameState = this.model.get("gameState");
    var inHand = gameState.hand.filter(function(handCard){
      return handCard.id == card.id;
    });
    if(this.model.isExploding){
      return inHand.length && (card.type == "defuse" || card.type == "nope");
    }
    switch(card.type){
      case "cat":
        return this.model.isMyTurn() && inHand.length >= 2;
      case "nope":
        return inHand.length > 0;
      default:
        return this.model.isMyTurn() && inHand.length;
    }
    return true;
  },

  onCardSelected: function(card){
    if(!this.onPut(card)){
      this.onPlayInvalid();
      return;
    }
    $(this.regions.hand).prepend($(this.ui.pile).find(this.ui.card).detach());
    switch(card.type){
      case "favor":
      case "cat":
        this.pickPlayer(card);
        break;
      case "stf":
      case "attack":
      case "skip":
      case "shuffle":
      case "defuse":
      case "nope":
        this.onPlay(card);
        break;
      break;
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
        $(self.regions.hand).prepend($(self.ui.pile).find(this.ui.card).detach());
      }
    );
  },

  cardPlayed: function(options){
    //Render card to top of pile, animate and show status
    var fromEl = this.model.getPlayerById(options.from).el;
    var self = this;
    var player = self.model.getPlayerById(options.from);
    var statusText = player.name + " played " + options.card.name;
    if(options.to){
      statusText += " on " + self.model.getPlayerById(options.to).name;
    }
    $(self.regions.status).text(statusText);
    if(options.remove){
      //remove options.remove.card x options.remove.amount from hand
      self.removeCardFromHand(options.remove.card, options.remove.amount);
    }
    this.animateCardMove(fromEl, this.ui.pile, options.card.image)
    .then(function(){
      //show card image on pile bg
      $(self.ui.pile).css("background-image", "url(" + self.pathForCard(options.card.image) + ")");
    });
    window.playSound(this.cardSounds);
    this.playCardSound(options.card);
  },

  playCardSound: function(card){
    switch(card.type){
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
    if(!future.cards.length){
      bodyEl.prepend($("<div>").text("There are no cards left!"));
    }
    while(future.cards.length){
      let card = future.cards.shift();
      let cardView = $("<div>");
      cardView.addClass("card");
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

  showFavor: function(message){
    var sourcePlayer = this.model.getPlayerById(message.source);
    var targetPlayer = this.model.getPlayerById(message.target);
    $(this.regions.status).text(targetPlayer.name + " is doing a favor for " + sourcePlayer.name);
    if(message.target != this.model.socket.id){
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
      backdrop: 'static',
    });
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
    if(this.timer){
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
      self.timer.destroy();
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
    if(this.model.isMe(message.player)){
      $(this.regions.hand).find(this.ui.card).remove();
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
      if(playerId == self.player.get("pid") || $(el).css("display") == "none" || self.model.isExploded(playerId)){
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
    players.forEach(function(player, i){
      var playerEl = player.el;
      playerEl.attr("data-id", player.id);
      if(self.model.isExploded(player.id)){
        playerEl.addClass("exploded");
      }
    });
  },
});

module.exports = ExplodingKittensRoomView;
