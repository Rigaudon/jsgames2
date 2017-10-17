var Room = require("./room");
var _ = require("lodash");

var hostCommands = ["startGame", "kickOpponent"];
var commands = ["makeMove"];

var ConnectFourRoom = Room.extend({
	initialize: function(options){
		Room.prototype.initialize.call(this, options);
		this.set("gameState", {
			boardState: this.initBoardState(),
			turn: "undefined"
		})
	},

	initBoardState: function(){
		//Represented as [column][row] for ease of calculation
		/*
		[0,5]...[6,5]
		[0,4]   . .
		[0,3]  .  .
		[0,2] .   .
		[0,1].    .
		[0,0]...[6,0] 
		*/
		var boardState = new Array(7);
		for(var i=0; i<boardState.length; i++){
			boardState[i] = new Array(6);
			boardState[i].fill(-1);
		}
		return boardState;
	},

	prettifyGameState: function(){
		var gameState = this.get("gameState");
		var boardState = gameState.boardState;
		var prettyState = [];
		prettyState.push("_______________");
		for(var i=0; i<6; i++){
			var lineStr = "|";
			for(var j=0; j<7; j++){
				if(boardState[j][5-i] == -1){
					lineStr+= "_|";
				}else{
					lineStr+= boardState[j][5-i] + "|";
				}
			}
			prettyState.push(lineStr);
		}
		if(gameState.turn){
			prettyState.push(gameState.turn + "'s turn.");
		}
		return prettyState;
	},

	playerJoin: function(playerModel){
		Room.prototype.playerJoin.call(this, playerModel);
		if(this.get("players").length == this.get("maxPlayers")){
			this.set("status", 1);
		}
		this.emitToAllExcept(playerModel.id);
	},

	executeCommand: function(options, playerId){
		var self = this;
		var command = options.command;
		var players = self.get("players");
		var gameState = self.get("gameState");
		if(commands.indexOf(command) > -1){
			switch(command){
				case "makeMove":
					self.makeMove(playerId, options.column);
				break;
			}
		}else if(hostCommands.indexOf(command) > -1 && this.get("host").id == playerId){
			switch(command){
				case "startGame":
					if(players.length == 2){
						self.set("status", 2);
						gameState.highlight = undefined;
						gameState.turn = Math.floor(Math.random() * 2); //Random player starts
						gameState.colors = {};
						gameState.colors[0] = "blue";
						gameState.colors[1] = "yellow";
						gameState.playerNum = {};
						gameState.playerNum[self.get("players").at(0).get("name")] = 0;
						gameState.playerNum[self.get("players").at(1).get("name")] = 1;
						gameState.boardState = this.initBoardState();
						self.emitToAllExcept();
						self.progressTurn();
					}
				break;
				case "kickOpponent":
					var otherPlayer = players.filter(function(player){ return player.id != playerId; })[0];
					if(otherPlayer){
						self.kickPlayer(otherPlayer);
					}
				break;
			}
		}
	},

	kickPlayer: function(player){
		this.collection.playerLeave(player.get("socket"));
		player.get("socket").emit("leaveRoom");
	},

	progressTurn: function(){
		if(this.isPlaying()){
			var gameState = this.get("gameState");
			gameState.turn = (gameState.turn + 1) % this.get("maxPlayers");
			this.emitPlayerTurn();
		}
	},

	emitPlayerTurn: function(){
		if(this.isPlaying()){
			var currentPlayer = this.get("players").at(this.get("gameState").turn);
			this.io.in(this.get("channel")).emit("gameMessage", {
				message: "turn",
				turn: currentPlayer.get("name")
			});	
		}
	},

	isPlaying: function(){
		return this.get("status") == 2;
	},

	makeMove: function(playerId, col){
		var gameState = this.get("gameState");
		if(this.validateMove(playerId, col)){
			var row = gameState.boardState[col].indexOf(-1);
			gameState.boardState[col][row] = gameState.turn;
			this.io.in(this.get("channel")).emit("gameMessage", {
				"message": "madeMove",
				"move": col,
				"player": this.get("players").at(this.get("gameState").turn).get("name"),
				"playerNum": this.get("gameState").turn
			});
			var winningPosition = this.checkForWin(col, row);
			if(winningPosition){
				this.io.in(this.get("channel")).emit("gameMessage", {
					"message": "victory",
					"player": this.get("players").at(this.get("gameState").turn).get("name")
				});
				this.set("status", 1);
				this.get("gameState").highlight = winningPosition;
				this.get("gameState").turn = undefined;
				this.emitToAllExcept();
			}else{
				this.progressTurn();
			}
		}
	},

	validateMove(playerId, col){
		var gameState = this.get("gameState");
		if(this.get("players").at(gameState.turn).id != playerId){
			return false;
		}
		if(gameState.boardState[col][5] == -1){
			return true;
		}
		return false;
	},

	checkForWin: function(col, row){
		return 	this.checkRowForWin(row) || 
				this.checkColForWin(col) || 
				this.checkForwardDiagForWin(col, row) || 
				this.checkBackwardDiagForWin(col, row);
	},

	checkRowForWin: function(row){
		var board = this.get("gameState").boardState;
		var inARow = 0;
		var prev = -1;
		for(var i=0; i<board.length; i++){
			if(board[i][row] == -1){
				inARow = 0;
			}else if(board[i][row] == prev){
				inARow++;
				if(inARow >= 4){
					return [[i, row],
							[i-1, row],
							[i-2, row],
							[i-3, row]];
				}
			}else{
				prev = board[i][row];
				inARow = 1;
			}
		}
		return false;
	},

	checkColForWin: function(col){
		var boardCol = this.get("gameState").boardState[col];
		var inARow = 0;
		var prev = -1;
		for(var i=0; i<boardCol.length; i++){
			if(boardCol[i] == -1){
				inARow = 0;
			}else if(boardCol[i] == prev){
				inARow++;
				if(inARow >= 4){
					return [[col, i],
							[col, i-1],
							[col, i-2],
							[col, i-3]];
				}
			}else{
				prev = boardCol[i];
				inARow = 1;
			}
		}
		return false;
	},

	checkForwardDiagForWin: function(col, row){
		var edge = Math.min(col, row);
		col -= edge;
		row -= edge;
		var board = this.get("gameState").boardState;
		var inARow = 0;
		var prev = -1;
		while(board[col] != undefined && board[col][row] != undefined){
			if(board[col][row] == -1){
				inARow = 0;
			}else if(board[col][row] == prev){
				inARow++;
				if(inARow >= 4){
					return [[col, row],
							[col-1, row-1],
							[col-2, row-2],
							[col-3, row-3]];
				}
			}else{
				prev = board[col][row];
				inARow = 1;
			}
			col++;
			row++;
		}
		return false;
	},

	checkBackwardDiagForWin: function(col, row){
		var edge = Math.min(col, 5-row);
		col -= edge;
		row += edge;
		var board = this.get("gameState").boardState;
		var inARow = 0;
		var prev = -1;
		while(board[col] != undefined && board[col][row] != undefined){
			if(board[col][row] == -1){
				inARow = 0;
			}else if(board[col][row] == prev){
				inARow++;
				if(inARow >= 4){
					return [[col, row],
							[col-1, row+1],
							[col-2, row+2],
							[col-3, row+3]];
				}
			}else{
				prev = board[col][row];
				inARow = 1;
			}
			col++;
			row--;
		}
		return false;
	}
});

module.exports = ConnectFourRoom;
