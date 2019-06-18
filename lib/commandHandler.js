// Takes in command, and array of arguments
// Example:
// !kick Milo Sawyer => command=help, args=[ Milo, Sawyer ]
module.exports = (command, args, userSocket, roomSockets) => {
    switch(command.toLowerCase()) {
        case 'coin':
            var result = Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails';
            publicSend(`${userSocket.username} flipped ${result}`, roomSockets);
            break;
        default:
            privateSend(`Command !${command} doesn't exist.`, userSocket);
    }
}

function privateSend (message, socket, type) {
    // Sends message to current user
    socket.send({ message, type: type || 'update' });
}

function publicSend (message, roomSockets, type) {
    roomSockets.forEach(socket => {
        socket.send({ message, type: type || 'update' });
    });
}