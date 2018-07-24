# Project 2: Chatterbox

*CSCI S-33 Web Programming with Python and JavaScript (Summer 2018)*

Chatterbox is a simple one-page web chat application. It supports usernames and channels, and stores up to 100 messages per channel in server-side memory. It also has a built-in Wikipedia chatbot, which responds to queries with the summary paragraph of Wikipedia articles.

It runs on Flask, and uses Bootstrap and Handlebars on the front end. It uses Socket.IO to relay messages and other information between client and server.

## Setup

* Install all requirements with `pip install -r requirements.txt`
* Start with `flask run`

## Files

* `application.py` - contains all server-side code
* `static/main.js` - contains all client-side code
* `templates/index.html` - contains the base html layout
* `static/main.css` - contains all custom styling

## Structure

Apart from the initial page load, all information in Chatterbox is passed through a Socket.IO connection. Server and client receive messages and send messages in response.

### Messages Sent By the Client

* `"new user"` - prompts the server to add the specified username to its list. It responds with `"username registered"` if the username was free, or `"username taken"` if it was not.
* `"get channels"` - prompts the server to return the list of chat channels
* `"new channel"` - prompts the server to add a new channel to its list
* `"switch channel"` - prompts the server to switch the user to a different chat channel, or enter a channel for the first time. This uses Socket.IO's "rooms" functionality to group users by channel.
* `"send message"` - sent when a user sends a new message to a channel. If the channel exists (and it should) the message is relayed to other users in the channel and stored server-side. The server also checks if it's a query to the Wikipedia bot, and then prunes old messages from the channel. If it is a Wikipedia bot query, the server sends an API request to Wikipedia, formats the information into a message, and sends the message to that channel under the name "Wikipedia Bot".

### Messages Sent By the Server

* `"connect"` - sent automatically when the client connects succesfully, this prompts the client to check if the user has a username yet, and request one if they don't. Usernames must be at least 3 characters long. Once the user has a username, the client sends them to the "General" channel, or their last visited channel if they are a returning user.
* `"username taken"` - prompts the client to ask the user for another username
* `"username registered"` - prompts the client to update the displayed username
* `"channel list"` - provides the list of channels on the server to the client. The client adds them to the menu on the left-hand side, highlights the one the user is currently in, and makes the others "links" which will bring the user to those channels. This is broadcast to all users when a user creates a new channel.
* `"channel missing"` - sent only if there's some unexpected error, this prompts the client to switch the user's channel to the default "General" channel
* `"enter channel"` - lets the client know it has successfully switched to a new channel, and provides the message history for that channel. The client renders the messages in the message area and updates the channel list highlighting and linking to reflect the new channel.
* `"new message"` - this message relays a message sent to a channel to all users in that channel. On receipt, the client renders the message in the chat area.
