document.addEventListener('DOMContentLoaded', () => {
    const defaultChannel = "General";
    
    setTimeout(scrollToBottom, 100); // something else was scrolling it back up again...
    
    // Compile Handlebars templates
    const channelTemplate = Handlebars.compile(document.querySelector('#channel-template').innerHTML);
    const messageTemplate = Handlebars.compile(document.querySelector('#message-template').innerHTML);
    
    // Connect to websocket
    try {
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    }
    catch (exception) {
        alert(`Failed to connect to websocket. (${exception})`);
    }
    
    // "Register" the user
    socket.on('connect', () => {
        username = localStorage.getItem('username');
        if (!username)
            registerUser('Please choose a username: ');
        else
            setUsername(username);
        
        if (localStorage.getItem('channel') === null)
            switchChannels(defaultChannel);
        else
            switchChannels(localStorage.getItem('channel'));
    });

    socket.on('username taken', username => {
        localStorage.removeItem('username');
        registerUser(`${username} is taken. Please choose a different username: `);
    })

    socket.on('username registered', username => {
        setUsername(username);
    });
    
    // Get channels and go to current/default channel
    socket.emit('get channels');
    socket.on('channel list', channelnames => {
        let channelList = document.querySelector('#channels');
        channelList.innerHTML = channelTemplate({'channels': channelnames});
        
        highlightActiveChannel();
        activateChannelLinks();
    });
    
    // If user somehow tried to enter an invalid channel, redirect to default
    socket.on('channel missing', () => {
        switchChannels(defaultChannel);
    });
    
    // Enter a channel and receive its archived messages
    socket.on('enter channel', data => {
        localStorage.setItem('channel', data.channel)
        
        const messageBox = document.querySelector('#messages');
        messageBox.innerHTML = "";
        
        for (var i in data.messages)
            messageBox.innerHTML += renderMessage(data.messages[i]);
        
        scrollToBottom();
        highlightActiveChannel();
        activateChannelLinks();
    });
    
    // Receive new incoming messages
    socket.on('new message', (message) => {
        document.querySelector('#messages').innerHTML += renderMessage(message);
        scrollToBottom();
    });

    
    // Make "create new channel" button functional
    document.querySelector('#toggle-new-channels').onclick = toggleNewChannelBox;

    // Make "new channel" form functional
    document.querySelector('#new-channel').onsubmit = () => {
        const input = document.querySelector('#new-channel input');
        if (input.value.length < 3)
            alert('Channel names must be at least 3 characters.');
        else {
            socket.emit('new channel', input.value);
            input.value = '';
            toggleNewChannelBox();
        }
    };

    // Make chat box functional
    document.querySelector('#chat-box').onsubmit = () => {
        const chatEntry = document.querySelector('#chat-entry');
        if (chatEntry.value.length > 0) {
            socket.emit('send message', {
                'username': localStorage.getItem('username'),
                'channel': localStorage.getItem('channel'),
                'message': chatEntry.value
            });
            chatEntry.value = '';
        }
        return false;
    }
    
    // Make channel links functional
    activateChannelLinks = () => {
        document.querySelectorAll('#channels a').forEach(link => {
            if (link.classList.contains('active')) {
                link.onclick = () => { return false; };
            }
            else {
                link.onclick = () => { 
                    switchChannels(link.innerText);
                    return false;
                };
                
            }
        });
    };
    
    
    // Prompt user for a username and try to register it if it's a good one
    registerUser = message => {
        while (!localStorage.getItem('username')) {
            let username = prompt(message);
            if (!username || username.length < 3) {
                alert('Your username must be at least 3 characters.');
                continue;
            }
            else {
                socket.emit('new user', {'username': username});
                localStorage.setItem('username', username);
            }
        }
    };
    
    setUsername = username => {
        document.querySelector('#username').innerHTML = username;
    };
    
    highlightActiveChannel = () => {
        let activeChannel = localStorage.getItem('channel');
        document.querySelectorAll('#channels a').forEach(link => {
            if (link.innerText == activeChannel) {
                link.classList.add('active');
            }
            else if (link.classList.contains('active')) {
                link.classList.remove('active');
            }
        })
    };
    
    switchChannels = newChannel => {
        const oldChannel = localStorage.getItem('channel');
        // if user is just reentering their current channel, pass 0 as a falsy value for the old one
        socket.emit('switch channel', {
            'new': newChannel,
            'old': (oldChannel == newChannel || oldChannel === null) ? 0 : oldChannel
        });
    };

    renderMessage = message => {
        const timestamp = new Date(message.timestamp);
        const time = timestamp.toLocaleTimeString();
        const date = timestamp.toLocaleDateString();
        return messageTemplate({
            'username': message.username, 
            'time': time,
            'date': date,
            'message': message.message,
        });
    };
});

scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
};

toggleNewChannelBox = () => {
    const form = document.querySelector('#new-channel');
    if (form.style.display !== 'flex') {
        form.style.display = 'flex';
        form.querySelector('input').focus();
    }
    else
        form.style.display = 'none';
    return false;
};
