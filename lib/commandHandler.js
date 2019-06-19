// Takes in command, and array of arguments
// Example:
// !kick Milo Sawyer => command=help, args=[ Milo, Sawyer ]
module.exports = (command, args, userSocket, roomSockets) => {
    switch(command.toLowerCase()) {
        case 'coin':
            var result = Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails';
            publicSend(`${userSocket.username} flipped ${result}`, roomSockets, null, command);
            break;
        default:
            privateSend(`Command !${command} doesn't exist.`, userSocket, null, command);
    }
}

function privateSend (message, socket, type, command) {
    // Sends message to current user
    socket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now() });
}

function publicSend (message, roomSockets, type, command) {
    roomSockets.forEach(socket => {
        socket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now() });
    });
}