var _ = require("lodash");
var fs = require("fs");
var UnoClient = require("../../models/unoClient");
var CardGameView = require("./cardGameView");
var CardView = require("./cardView");
var UnoCardView = CardView.extend({
  partialImagePath: "/static/images/assets/uno/",
});
var UnoRoomView = CardGameView.extend({
  gameClient: UnoClient,
  cardView: UnoCardView,
  viewTemplate: fs.readFileSync("./app/templates/gameRooms/uno.html", "utf8"),
  playerTemplate: fs.readFileSync("./app/templates/partials/cardPlayer.html", "utf8"),
  className: CardGameView.prototype.className + " unoRoom",
  modelEvents: _.assign({
    "update:deck": "renderCardCounts"
  }, CardGameView.prototype.modelEvents),

  regions: _.assign({
    "choose": ".chooseOptions",
  }, CardGameView.prototype.regions),

  events: _.assign({
    "click @ui.deck": "drawCard",
    "click @ui.card": "onClickCard"
  }, CardGameView.prototype.events),

  cardPathRoot: "/static/images/assets/uno/",
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
      var topCard = this.model.getTopCard();
      if (topCard){
        $(this.ui.pile).css("background-image", "url(" + this.pathForCard(topCard) + ")");
      }
    }
  },

  onPut: function(){
    return this.model.isMyTurn();
  },

  onCardSelected: function(card){
    if (!this.onPut(card)){
      this.onPlayInvalid();
      return;
    }
    $(this.regions.hand).prepend($(this.ui.pile).find(".card").detach());
    if (card.type == "wild" || card.type == "wild4"){
      this.showColorModal(card);
    } else {
      this.onPlay(card);
    }
  },

  cardPlayed: function(options){
    //Render card to top of pile, animate and show status
    var fromEl = this.model.getPlayerById(options.from).el;
    var self = this;
    var player = self.model.getPlayerById(options.from);
    var statusText = player.name + " played " + options.card.name;
    $(self.regions.status).text(statusText);
    if (options.remove){
      //remove options.remove.card x options.remove.amount from hand
      self.removeCardFromHand(options.remove.card, options.remove.amount);
    }
    this.animateCardMove(fromEl, this.ui.pile, options.card.image)
      .then(function(){
        //show card image on pile bg
        $(self.ui.pile).css("background-image", "url(" + self.pathForCard(options.card.image) + ")");
      });
    window.playSound(this.cardSounds);
  },

  showColorModal: function(card){
    var self = this;
    var chooseEl = $(this.regions.choose);
    chooseEl.find(".modal-header").text("Pick a color");
    var bodyEl = chooseEl.find(".modal-body");
    bodyEl.empty();
    var colors = ["red", "yellow", "green", "blue"];
    colors.forEach(function(color){
      var cardWrapper = $("<div></div>");
      var cardEl = $("<img/>");
      cardWrapper.addClass("pickCard");
      cardEl.attr("src", self.pathForCard(color + card.type));
      cardEl.click(function(){
        chooseEl.modal("hide");
        card.color = color;
        card.image = card.color + card.type;
        self.model.playCard({
          card: card,
        });
      });
      cardWrapper.append(cardEl);
      bodyEl.append(cardWrapper);
    });
    chooseEl.off("hidden.bs.modal");
    chooseEl.modal({
      show: true,
      backdrop: false,
      keyboard: true
    });
  },
});

module.exports = UnoRoomView;
