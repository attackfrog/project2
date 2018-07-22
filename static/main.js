document.addEventListener('DOMContentLoaded', () => {
    setTimeout(scrollToBottom, 100); // something else was scrolling it back up again...

    // Connect to websocket
    try {
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    }
    catch {
        alert("Failed to connect to websocket.");
    }

    socket.on('connect', () => {
        registerUser('Please choose a username: ');
    });

    socket.on('username taken', username => {
        localStorage.removeItem('username');
        registerUser(`${username} is taken. Please choose a different username: `);
    })

    socket.on('username registered', username => {
        document.querySelector('#username').innerHTML = username;
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
});

scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
};
