var _ = require("lodash");
var Marionette = require("backbone.marionette");
var common = require("../../common");
var Promise = require("bluebird");

var playerSeats = [
  '.playerSeat',
  '.playerTwoSeat',
  '.playerThreeSeat',
  '.playerFourSeat',
  '.playerFiveSeat',
  '.playerSixSeat',
  '.playerSevenSeat',
  '.playerEightSeat',
  '.playerNineSeat'
];

var playerClass = [
  '',
  'onePlayer',
  'twoPlayers',
  'threePlayers',
  'fourPlayers',
  'fivePlayers',
  'sixPlayers',
  'sevenPlayers',
  'eightPlayers',
  'ninePlayers'
];

var CardGameView = Marionette.View.extend({
  initialize: function(options){
    this.player = options.player;
    this.model = new this.gameClient({player: options.player});
    this.player.gameClient = this.model;
  },

  statusCodes: ["Waiting for players", "Waiting to start", "Game has started", "Game has ended"],

  getTemplate: function(){
    return _.template(this.viewTemplate, this.templateContext());
  },

  className: "cardGameRoom",

  templateContext: function(){
    var numPlayers = this.model && this.model.get("players") ? this.model.get("players").length : 1;
    return {
      playerNum: playerClass[numPlayers],
      isHost: this.model.isHost(),
      controls: this.getOptions(),
      status: this.statusCodes[this.model.get("status")],
    };
  },

  getOptions: function() {
    var options = "";
    if(this.model.isHost()){
      var players = this.model.get("players");
      if(players.length >= 2 && !this.model.inProgress()){
        options += "<button class=\"startBtn btn-big\">Start Game</button>";
      }
    }
    options += "<button class='leaveBtn btn-big'>Leave Room</button>";
    return options;
  },

  modelEvents: {
    "update:room": "render",
    "self:draw": "selfDraw",
    "opponent:draw": "opponentDraw",
    "update:player": "updatePlayer",
    "card:move": "moveCard",
    "card:played": "cardPlayed",
    "player:win": "onPlayerWin",
    "card:invalid": "onPlayInvalid"
  },

  ui: {
    "leaveBtn": ".leaveBtn",
    "startBtn": ".startBtn",
    "deck": ".deck",
    "pile": ".pile",
    "invalid": ".invalidCard",
    "card": ".card"
  },

  regions: {
    "hand": ".heldCards",
    "table": ".playtable",
    "status": ".status",
    "controls": ".controls",
  },

  events: {
    "click @ui.leaveBtn": "leaveRoom",
    "click @ui.startBtn": "startRoom",
  },

  cardSounds: ["card1", "card2"],

  leaveRoom: function(){
    this.player.leaveRoom();
  },

  startRoom: function(){
    this.model.startRoom();
  },

  onRender: function(){
    var gameState = this.model.get("gameState");
    if(this.model.get("players")){
      this.renderPlayers(this.model.get("players"));
    }
    if(gameState && !_.isEmpty(gameState.hand)){
      this.renderCards(gameState);
      this.renderCardCounts();
    }
  },

  renderControls: function(){
    $(this.regions.controls).html(this.getOptions());
  },

  pathForCard: function(card){
    card = card.image ? card.image : card;
    return this.cardPathRoot + card + ".png";
  },

  renderCards: function(gameState){
    var self = this;
    var cardViewClass = this.cardView;
    gameState.hand.forEach(function(card){
      let cardView = new cardViewClass({card: card});
      cardView.render();
      $(self.regions.hand).prepend(cardView.$el);
    });
    $(self.regions.hand).sortable({
      animation: 150,
      draggable: ".card", //Not sure why, but self.ui.card doesn't work
      group: "hand"
    });
  },

  onClickCard: function(evt){
    var card = evt.currentTarget.card;
    this.onCardSelected(card);
  },

  onCardSelected: function(card){
    this.onPlay(card);
  },

  onPlay: function(card){
    this.model.playCard({
      card: card
    });
  },

  drawCard: function(){
    this.model.drawCard();
  },

  cardPlayed: function(options){
    //Render card to top of pile, animate and show status
    console.log("Card played");
    console.log(options);
  },

  moveCard: function(options){
    var from;
    var to;
    this.model.get("players").map(function(player){
      if(player.id == options.from){
        from = player;
      }
      if(player.id == options.to){
        to = player;
      }
    });
    if(from && to){
      var self = this;
      return this.animateCardMove(from.el, to.el, options.card)
      .then(function(){
        if(self.model.socket.id == options.from){
          //remove options.card from hand
          self.removeCardFromHand(options.card, 1);
          //statuses shouldnt be here
          $(self.regions.status).text("You gave " + options.card.name + " to " + to.name + ".");
        }else if(self.model.socket.id == options.to){
          //Add to options.card to hand
          self.addCardToOwnHand(options.card);
          $(self.regions.status).text("You got " + options.card.name + " from " + from.name + ".");
        }else{
          $(self.regions.status).text(to.name + " got a card from " + from.name + ".");
        }
      });
      window.playSound(this.cardSounds);
    }
  },

  removeCardFromHand: function(card, amount){
    var removed = 0;
    var cards = $(this.regions.hand).find(".card");
    _.forEach(cards, function(cardEl){
      if(removed < amount && cardEl.card && cardEl.card.id == card.id && cardEl.card.image == card.image){
        cardEl.remove();
        removed++;
      }
    });
  },

  onPlayInvalid: function(message){
    var el = $(this.ui.invalid);
    el.addClass("active");
    setTimeout(function(){
      el.removeClass("active");
    }, 100);
  },

  onPlayerWin: function(message){
    var player = this.model.getPlayerById(message.player);
    $(this.regions.status).text(player.name + " won!");
    window.showConfetti();
    window.playSound("victory");
    this.renderControls();
  },

  renderCardCounts: function(){
    this.renderDeckCount();
    this.renderPlayerCardCounts();
  },

  renderDeckCount: function(){
    var gameState = this.model.get("gameState");
    if(gameState){
      $(this.ui.deck).find(".numCards").text(gameState.deckCount || "");
      $(this.ui.pile).find(".numCards").text(gameState.pile.length || "");
    }
  },

  renderPlayerCardCounts: function(){
    this.model.get("players").forEach(function(player, i){
      var playerEl = $(playerSeats[i]);
      var handCountEl = playerEl.find(".numCards");
      handCountEl.text(player.handSize);
    });
  },

  renderPlayers: function(players){
    var self = this;
    players.forEach(function(player, i){
      var playerEl = $(playerSeats[i]);
      if(!playerEl.length){
        playerEl = $(self.playerTemplate);
        playerEl.addClass(playerSeats[i].replace(".", ""));
        $(self.regions.table).prepend(playerEl);
      }
      playerEl.css({
        "border-color": player.color,
        "background-color": player.color
      });
      playerEl.attr("data-id", player.id);
      var playerNameEl = playerEl.find(".playerName");
      playerNameEl.html(player.name);
      player.el = playerEl;

    });
    this.updatePlayer();
  },

  selfDraw: function(card){
    var self = this;
    this.animateCardMove(this.ui.deck, ".playerSeat", card.card.image)
    .then(function(){
      self.addCardToOwnHand(card.card);
    });
    $(this.regions.status).text("You drew a card");
  },

  opponentDraw: function(options){
    var opponentId = options.playerId;
    var opponent = this.model.get("players").filter(function(player){
      return player.id == opponentId;
    })[0];
    var self = this;
    this.animateCardMove(this.ui.deck, opponent.el)
    $(this.regions.status).text(opponent.name + " drew a card");
    this.renderPlayerCardCounts();
  },

  addCardToOwnHand: function(card){
    let cardView = new this.cardView({card: card});
    cardView.render();
    cardView.$el.card = card;
    $(this.regions.hand).prepend(cardView.$el);
    this.renderPlayerCardCounts();
  },

  animateCardMove: function(from, to, card){
    var self = this;
    return new Promise(function(resolve, reject){
      self.renderDeckCount();
      var fromEl = $(self.regions.table).find(from);
      var toEl = $(self.regions.table).find(to);
      var cardEl = $("<img class='animatedCard'>");
      cardEl.attr("src", self.pathForCard(card || "back"));
      cardEl.css({
        left: (fromEl.position().left + (fromEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
        top: (fromEl.position().top  + (fromEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
      });
      $(self.regions.table).append(cardEl);
      cardEl.css({
        left: (toEl.position().left + (toEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
        top: (toEl.position().top  + (toEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
      });

      var toPile = to == self.ui.pile;
      if(!toPile){
        cardEl.css("opacity", 0);
      }
      cardEl.bind(common.finishTransition, function(){
        resolve();
        if(toPile){
          cardEl.remove();
        }else if(cardEl.css("opacity") == 0){
          cardEl.remove();
        }
      });
    })
    .then(self.renderPlayerCardCounts.bind(self));
  },

  updatePlayer: function(){
    var gameState = this.model.get("gameState");
    if(gameState && gameState.turnPlayer){
      this.model.get("players").forEach(function(player, i){
        if(player.id == gameState.turnPlayer){
          player.el.addClass("active");
        }else{
          player.el.removeClass("active");
        }
      });
      if(this.model.isMe(gameState.turnPlayer)){
        window.playSound("ding");
      }
    }
  }
});

module.exports = CardGameView;
