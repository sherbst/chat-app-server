const io = require('socket.io')();
const commandHandler = require('./lib/commandHandler');
const sanitizeHtml = require('sanitize-html');

require('dotenv').config();

// { username: <username>, socket: <socket> }
var users = [];
// { roomName: <room name>, handle: <uuid> public: <Boolean>, users: [ username1, username2, ... ] }
var rooms = [
    {
        roomName: 'Default',
        handle: 'default',
        public: true,
        users: []
    }
];

io.on('connection', (socket) => {
    console.log('A socket connected.');

    socket.on('requestUsername', (rawRequestedUsername, ack) => {
        // Trim whitespace
        var requestedUsername = rawRequestedUsername.trim();
        // Did they request a username?
        if(requestedUsername) {
            // Is the username taken?
            if(users.every(u => u.username !== requestedUsername)) {
                // Requested username IS valid
                socket.username = requestedUsername;
                users.push({
                    socket,
                    username: requestedUsername
                });
                // Notify users
                updateActiveUsers();
                ack({ error: null, username: requestedUsername });

                socket.on('joinRoom', (roomHandle) => {
                    joinRoom(roomHandle, socket);
                    
                    socket.on('message', (message) => {
                        console.log(`Message from ${socket.username}: ${message.message}`)

                        // Sanitize HTML
                        message.message = sanitizeHtml(message.message, {
                            allowedTags: [],
                            allowedAttributes: {}
                        });

                        // Is it a command?
                        var commandPattern = /^\!(.+?)( .*)?$/;
                        if(commandPattern.test(message.message)) {
                            // It IS a command
                            var commandPortions = commandPattern.exec(message.message);
                            var command = commandPortions[1];
                            var args = commandPortions[2] ? commandPortions[2].trim().split(' ') : [];

                            // Sockets of all users in room
                            var roomSockets = rooms.find(r => r.handle === roomHandle)
                            .users.map(username => users.find(user => user.username === username).socket);

                            commandHandler(command, args, socket, roomSockets);
                        } else {
                            // Send message
                            io.to(roomHandle).send({ ...message, type: 'user', parser: 'style', from: socket.username, date: Date.now() });
                        }
                    });


                });

            } else {
                ack({ error: 'Username is taken.' })
            }
        } else {
            ack({ error: 'Please enter a username.' })
        }
    });

    socket.on('disconnect', () => {
        console.log('A socket disconnected.')
        // Is socket a user?
        if(socket.username && users.some(u => u.username === socket.username)) {
            // Remove user from users array
            users = users.filter(u => u.username !== socket.username);
            // Notify users
            updateActiveUsers();
            // Is part of room
            var currentRoom = rooms.find(r => r.users.some(u => u === socket.username))
            if(currentRoom) {
                // Leave room
                leaveRoom(socket);
                // Notify users
                updateRoomUsers(currentRoom.handle);
            }
        }
    })
});

io.listen(process.env.PORT);
console.log(`Listening on port ${process.env.PORT}.`);

function updateActiveUsers () {
    console.log(`${users.length} user(s) active.`);
}

function joinRoom (roomHandle, socket) {
    console.log(`${socket.username} joined room ${roomHandle}`);
    // Is user already in a room?
    var isInRoom = rooms.some(r => {
        return r.users.some(u => u === socket.username);
    });
    if(isInRoom) {
        // Remove them from their old room, so they can't be in 2 (or more) rooms at a time
        leaveRoom(socket);
    }
    socket.join(roomHandle);
    var roomIndex = rooms.findIndex(r => r.handle === roomHandle);
    // Does room exist?
    if(roomIndex === -1) {
        // Doesn't exist, let's add it now
        rooms.push({
            roomName: roomHandle,
            handle: roomHandle,
            public: false,
            users: []
        });
        roomIndex = rooms.findIndex(r => r.handle === roomHandle);
    }
    var room = rooms[roomIndex];
    var newRoom = {
        ...room,
        users: room.users.concat(socket.username)
    };
    rooms[roomIndex] = newRoom;
    updateRoomUsers(roomHandle);
}

function updateRoomUsers (roomHandle) {
    console.log(rooms.reduce((total, current) => {
        return total + current.users.length;
    }, 0) + ' users active in rooms.');
    var roomActiveUsers = rooms.find(r => r.handle === roomHandle).users
    io.to(roomHandle).emit('roomActiveUsers', roomActiveUsers);
}

function leaveRoom (socket) {
    rooms = rooms.map(r => {
        if(r.users.some(u => u === socket.username)) {
            var roomUsersWithoutUsername = r.users.filter(u => u !== socket.username);
            return { ...r, users: roomUsersWithoutUsername }
        } else {
            return r;
        }
    })
}