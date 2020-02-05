var io = require('socket.io')(process.env.PORT || 7777)

var Player = require('./Classes/Player.js')
var Bullet = require('./Classes/Bullet.js')

console.log('Server has started')

var players = []
var sockets = []
var bullets = []

//Updates
setInterval(() => {
    bullets.forEach(bullet => {
        var isDestroyed = bullet.onUpdate()

        if(isDestroyed){
            var index = bullets.indexOf(bullet)
            if(index > -1){
                bullets.splice(index, 1)

                var returnData = {
                    "id": bullet.id
                }

                for(var playerID in players){
                    sockets[playerID].emit("serverUnspawn", returnData)
                }

            }
        } else {
            var returnData = {
                "id": bullet.id,
                "position": {
                    "x": bullet.position.x,
                    "y": bullet.position.y
                }
            }

            for (var playerID in players) {
                sockets[playerID].emit("updatePosition", returnData)
            }
        }
    })
}, 100, 0);

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

    socket.on("fireBullet", function(data){
        var bullet = new Bullet();
        bullet.name = "Bullet";
        bullet.position.x = data.position.x
        bullet.position.y = data.position.y
        bullet.direction.x = data.direction.x
        bullet.direction.y = data.direction.y

        bullets.push(bullet)

        var returnData = {
            "name": bullet.name,
            "id": bullet.id,
            "position": {
                "x": bullet.position.x,
                "y": bullet.position.y
            },
            "direction": {
                "x": bullet.direction.x,
                "y": bullet.direction.y
            }
        }
        socket.emit('serverSpawn', returnData)
        socket.broadcast.emit('serverSpawn', returnData)
    })

    socket.on('disconnect', function(){
        console.log("A player has disconnected")
        delete players[thisPlayerID]
        delete sockets[thisPlayerID]
        socket.broadcast.emit('disconnected', player)
    })
})

function interval(func, wait, time){
    var interv = function(w, t){
        return function(){
            if(typeof t === "undefined" || t-- > 0){
                setTimeout(interv, w);
                try {
                    func.call(null);
                } catch(e){
                    t = 0;
                    throw e.toString();
                }
            }
        }
    }(wait, time);

    setTimeout(interv, wait);
}