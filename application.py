import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Dict of channels (themselves dicts as well)
channels = {
    "general": [{
        "username": "attackfrog",
        "timestamp": 1532213192656,
        "message": "This right here is a test message, know what I'm saying?"
    }]
}

# Set of users
users = {
    "testusername",
    "jack"
}

@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("new user")
def register(data):
    username = data["username"]
    if username in users:
        emit("username taken", username)
    else:
        emit("username registered", username)
