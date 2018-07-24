import os
from datetime import datetime
import requests

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Maximum number of messages per channel to keep in server memory
MAX_SAVED_MESSAGES = 100;

# Dict of channels (each being lists of message dicts)
channels = {
    "General": [{
        "username": "attackfrog",
        "timestamp": "2018-07-23T17:16:32.082467+00:00",
        "message": """Welcome to Chatterbox! Get the conversation started, or get information from Wikipedia on a topic by typing, 
                      for example, '?wikipedia chatbot'"""
    }]
}

# Set of users
users = { "Wikipedia Bot" }

# Set up User Agent so Wikipedia will accept API calls
headers = requests.utils.default_headers()
headers.update({
    "User-Agent": "CS-33 Chatterbox 1.0 (attackfrog)"
})

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
        
        # send query to Wikipedia Bot if appropriate
        if message["message"].startswith("?wikipedia "):
            wiki_bot(message["message"], message["channel"])
        
        # prune old messages
        while len(channels[message["channel"]]) > MAX_SAVED_MESSAGES:
            channels[message["channel"]].pop(0)


def wiki_bot(query, channel):
    # strip "?wikipedia " from the query and convert spaces to underscores
    query = query.replace(" ", "_")[11:]
    response = requests.get(f"https://en.wikipedia.org/w/api.php?action=query&format=json&titles={query}&prop=extracts&exintro&explaintext",
                            headers=headers)
    data = response.json()
    pageid = list(data["query"]["pages"].keys())[0]
    
    if pageid == "-1":
        # Page does not exist, send error message
        message({
            "username": "Wikipedia Bot",
            "channel": channel,
            "message": "That page doesn't exist on Wikipedia."
        })
    elif data["query"]["pages"][pageid]["extract"] == "":
        message({
            "username": "Wikipedia Bot",
            "channel": channel,
            "message": "That page exists, but the summary was blank. It may redirect to another page. Try adjusting your query."
        })
    else:
        message({
            "username": "Wikipedia Bot",
            "channel": channel,
            "message": data["query"]["pages"][pageid]["extract"]
        })
