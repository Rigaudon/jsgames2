# JSGames v2
A Marionette/Websocket based Nodejs game server.

# Local Setup
Developed in node 4.5.0, npm 4.1.2.
Run npm install, then npm start.

#To dos
- Implement games
- Redo server side toJSON of controllers
	- fix the io references in controller
	- fix cloning in controller in withoutPassword
	- add socket to the user model, then reference it instead of using socket's namespace
- Rename old "gameRoom" references to "lobby"
- Add console
- Add controller for chat 
	- Add channel for chat when new room is made
- More dynamic templates
- Add player color selection to settings
- Add theme selection to settings
- Add who's online tab to chat
- Redo game selection screen (IP)
	- Add background?
	- Fix alert formatting
	- Add selection styles to tabs?
