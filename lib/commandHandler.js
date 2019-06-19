// Takes in command, and array of arguments
// Example:
// !kick Milo Sawyer => command=help, args=[ Milo, Sawyer ]
module.exports = (command, args, userSocket, roomSockets) => {

    function privateSend (message, type, attributes) {
        // Sends message to current user
        userSocket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now(), ...(attributes || {}) });
    }

    function privateTargetedSend (message, socket, type, attributes) {
        // Sends message to current user
        socket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now(), ...(attributes || {}) });
    }
    
    function roomSend (message, type, attributes) {
        roomSockets.forEach(socket => {
            socket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now(), ...(attributes || {}) });
        });
    }
    
    function bulkSend (message, sockets, type, attributes) {
        sockets.forEach(socket => {
            socket.send({ command, message, type: type || 'command-response', parser: 'style', date: Date.now(), ...(attributes || {}) });
        });
    }

    switch(command.toLowerCase()) {
        case 'coin':
            var result = Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails';
            roomSend(`${userSocket.username} flipped ${result}`);
            break;
        case 'whisper':

            var [ destination, ...messageContentArray ] = args;
            var messageContent = messageContentArray.join(' ')

            // Did they supply a username and a message
            if(!destination) {
                privateSend('You must supply a username.');
                break;
            }

            if(!messageContent) {
                privateSend('You must supply a message.');
                break;
            }

            // Does user exist?
            var destinationUserSocket = roomSockets.find(s => s.username === args[0]);
            if(!destinationUserSocket) {
                privateSend(`User: ${destination} doesn't exist.`);
                break;
            }

            // Send the message
            privateTargetedSend(`${userSocket.username} whispers: ${messageContent}`, destinationUserSocket, 'whisper', { from: userSocket.username, to: destination });
            privateTargetedSend(`You whisper to ${destination}: ${messageContent}`, userSocket, 'whisper', { from: userSocket.username, to: destination });

            break;
        default:
            privateSend(`Command !${command} doesn't exist.`);
    }
}