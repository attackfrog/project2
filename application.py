import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Dict of channels (each being lists of message dicts)
channels = {
    "General": [{
        "username": "attackfrog",
        "timestamp": 1532213192656,
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


@socketio.on("get messages")
def messages(channel):
    if channels[channel]:
        emit("old messages", channels[channel])
    else:
        emit("channel missing")
