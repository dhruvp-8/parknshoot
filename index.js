var io = require('socket.io')(process.env.PORT || 7777)

var Player = require('./Classes/Player.js')

console.log('Server has started')

var players = []
var sockets = []

io.on('connection', function(socket) {
    console.log("Connection made")

    var player = new Player()
    var thisPlayerID = player.id

    players[thisPlayerID] = player
    sockets[thisPlayerID] = socket


    // Tell the client that this is our id for the server
    socket.emit('register', {"id": thisPlayerID})
    socket.emit('spawn', {"id": thisPlayerID});
    socket.broadcast.emit('spawn', {"id": thisPlayerID})

    // Tell myself about everyone else in the game
    for(var playerID in player){
        if(playerID != thisPlayerID){
            socket.emit('spawn', {"id": players[playerID]})
        }
    }

    // Position Data from Client
    socket.on('updatePosition', function(data) {
        player.position.x = data.position.x
        player.position.y = data.position.y

        socket.broadcast.emit('updatePosition', player)
    })

    socket.on('updateRotation', function(data){
        player.tankRotation = data.tankRotation
        player.barrelRotation = data.barrelRotation

        socket.broadcast.emit('updateRotation', player)
    })

    socket.on('disconnect', function(){
        console.log("A player has disconnected")
        delete players[thisPlayerID]
        delete sockets[thisPlayerID]
        socket.broadcast.emit('disconnected', player)
    })
})