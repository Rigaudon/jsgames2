![JSGames v2](./static/images/logo.png "JSGames v2")

# JSGames v2
A stateless Nodejs game server using Socket.io and Backbone/Marionette.
Currently, Connect Four and Exploding Kittens are implemented.

# Local Setup
Developed in node `6.10.0`, npm `4.3.0`.
Run `npm install`, then `npm start`.
For development, run `npm run server`.

# To do
- Implement games
	- Exploding Kittens expansion
	- Exploding Kittens Sort button
	- Uno
	- Pictionary ?
	- Dominion 
	- Othello ?
	- Cards against humanity ?
- Add Spectate mode
- Add who's online list to chat

# Bugs
- Exploding Kittens:
	- When leaving room as the last person while exploding, does not give host back option to restart game
	- When seeing the future with < 3 cards, not valid position text
	- Playing favor/cat on player with no cards in hand