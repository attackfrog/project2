document.addEventListener('DOMContentLoaded', () => {
    const defaultChannel = "General";
    
    setTimeout(scrollToBottom, 100); // something else was scrolling it back up again...

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
        const template = Handlebars.compile(document.querySelector('#channel-template').innerHTML);
        let channelList = document.querySelector('#channels');
        channelList.innerHTML = template({'channels': channelnames});
        
        if (localStorage.getItem('channel') === null) {
            localStorage.setItem('channel', defaultChannel);
        }
        highlightActiveChannel();
    });
    
    // Get channel's messages
    socket.emit('get messages', localStorage.getItem('channel'));
    socket.on('channel missing', () => {
        localStorage.setItem('channel', defaultChannel);
        socket.emit('get messages', localStorage.getItem('channel'));
    });
    socket.on('old messages', messages => {
        messages.sort((a, b) => {
            return a.timestamp - b.timestamp;
        });
        const template = Handlebars.compile(document.querySelector('#message-template').innerHTML);
        const messageBox = document.querySelector('#messages');
        messageBox.innerHTML = "";
        
        for (var i in messages) {
            const timestamp = new Date(messages[i].timestamp);
            const time = timestamp.toLocaleTimeString();
            const date = timestamp.toLocaleDateString();
            messageBox.innerHTML += template({
                'username': messages[i].username, 
                'time': time,
                'date': date,
                'message': messages[i].message,
            });
        }
        scrollToBottom();
    });


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
        let channels = document.querySelector('#channels').querySelectorAll('a');
        for (let i = 0; i < channels.length; i++) {
            if (channels[i].innerText == activeChannel) {
                channels[i].classList.add('active');
            }
            else if (channels[i].classList.contains('active')) {
                channels[i].classList.remove('active');
            }
        }
    };
});

scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
};
