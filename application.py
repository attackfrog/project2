import os
from datetime import datetime

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Dict of channels (each being lists of message dicts)
channels = {
    "General": [{
        "username": "attackfrog",
        "timestamp": "2018-07-23T17:16:32.082467+00:00",
        "message": "Welcome to Chatterbox! Why don't you get the conversation started?"
    }]
}

# Set of users
users = { "0" }

@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("new user")
def register(data):
    username = data["username"]
    if username in users:
        emit("username taken", username)
    else:
        users.add(username)
        emit("username registered", username)


@socketio.on("get channels")
def channel_list():
    emit("channel list", list(channels.keys()))


@socketio.on("new channel")
def new_channel(channel_name):
    channels[channel_name] = []
    emit("channel list", list(channels.keys()), broadcast=True)


@socketio.on("switch channel")
def join_channel(channel_update):
    if channel_update["old"]:
        leave_room(channel_update["old"])
    join_room(channel_update["new"])
    
    if channel_update["new"] in channels.keys():
        emit("enter channel", {
            "channel": channel_update["new"],
            "messages": channels[channel_update["new"]]
        })
    else:
        emit("channel missing")


@socketio.on("send message")
def message(message):
    if message["channel"] not in channels.keys():
        emit("channel missing")
    else:
        new_message = {
            "username": message["username"],
            "timestamp": datetime.now().astimezone().isoformat(),
            "message": message["message"]
        }
        channels[message["channel"]].append(new_message)
        emit("new message", new_message, room=message["channel"])
        
        # prune old messages
        while len(channels[message["channel"]]) > 100:
            channels[message["channel"]].pop(0)
