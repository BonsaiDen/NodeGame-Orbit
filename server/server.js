/*

  NodeGame: Orbit
  Copyright (c) 2010 Ivo Wetzel.

  All rights reserved.

  NodeGame: Orbit is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  NodeGame: Orbit is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  NodeGame: Orbit. If not, see <http://www.gnu.org/licenses/>.

*/


// Modules ---------------------------------------------------------------------
var lithium = require('lithium');
var bison = importLib('bison');
var HashList = importLib('hashlist');
var OrbitServerStatus = importModule('status');
var OrbitGame = importModule('game');


// Orbit Server ----------------------------------------------------------------
// -----------------------------------------------------------------------------
var ERROR_SERVER_FULL = 100;
var ERROR_INVALID_LOGIN = 200;


function OrbitServer(port, flash, max) {
    var that = this;
    this.clients = new HashList();
    this.maxClient = max;

    this.games = new HashList();
    this.maxGames = 12;

    this.server = new lithium.Server(function(remote) {

        remote.on('message', function(msg) {
            that.message(remote, msg);
        });

        remote.on('close', function() {
            that.close(remote);
        });

        that.connect(remote);

    }, bison.encode, bison.decode);

    this.server.listen(port);

    this.status = new OrbitServerStatus(this);
}
exports.module = OrbitServer;


// Prototype -------------------------------------------------------------------
OrbitServer.extend({
    connect: function(remote) {
        if (this.clients.length >= this.maxClients) {
            remote.send({error: ERROR_SERVER_FULL});
            remote.close();
            return false;
        }

        remote.accept();
    },

    broadcast: function(type, msg, clients, exclude) {
        msg.unshift(type);
        if (!clients || clients.length === 0) {
            this.server.send(msg);

        } else if (exclude) {
            this.clients.eachNot(clients, function(client) {
                client.remote.send(msg);
            });

        } else {
            this.clients.eachIn(clients, function(client) {
                client.remote.send(msg);
            });
        }
    },

    close: function(remote) {
        if (this.clients.has(remote)) {
            this.clients.get(remote).close();
            this.clients.remove(remote);
        }
    },

    message: function(remote, msg) {
        if (this.clients.has(remote)) {
            this.clients.get(remote).message(msg);

        } else {
            this.login(remote, msg);
        }
    },

    login: function(remote, msg) {
        if (msg instanceof Array

            // basic check
            && msg.length >= 3
            && msg[0] === 'init'

            // name check
            && typeof msg[1] === 'string'
            && msg[1].trim() !== ''
            && msg[1].trim().length >= 2
            && msg[1].trim().length <= 15

            // game id check
            && typeof msg[2] === 'number'
            && msg[2] >= 0
            && msg[2] <= this.maxGames

            // watch check
            && typeof msg[3] === 'boolean'

            // hash check
            && typeof msg[4] === 'string'
            && msg[4].trim().length <= 32

        // Valid
        ) {
            var name = msg[1].trim();
            var game = msg[2], watch = msg[3], hash = msg[4].trim();
            var client = new OrbitClient(this, remote, name, game, watch, hash);
            this.clients.add(client);

        // Invalid
        } else {
            this.log('Invalid login');
            remote.send({error: ERROR_INVALID_LOGIN});
            remote.close();
        }
    },

    addToGame: function(client) {
        if (!this.games.has(client.gameID)) {
            this.games.add(new OrbitGame(this, client.gameID));
        }
        this.games.get(client.gameID).clientAdd(client);
    },

    removeFromGame: function(client) {
        if (this.games.has(client.gameID)) {
            this.games.get(client.gameID).clientRemove(client);
        }
    },

    log: function(msg) {
        console.log('[Server]: ' + msg);
    }
});


// Orbit Client ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitClient(server, remote, name, game, watch, hash) {
    this.server = server;
    this.remote = remote;
    this.connID = this.remote.id;
    this.id = this.remote.id;

    this.name = name;
    this.player = null;
    this.gameWatch = watch;
    this.gameHash = hash;
    this.gameID = game;

    this.log('Connected');
    this.server.addToGame(this);
}


// Prototype -------------------------------------------------------------------
OrbitClient.extend({
    send: function(type, msg) {
        msg.unshift(type);
        this.remote.send(msg);
    },

    close: function() {
        this.server.removeFromGame(this);
        this.remote.close();
        this.log('Disconnected');
    },

    message: function(msg) {
        this.game.message(this, msg);
    },

    log: function(msg) {
        console.log('[Client ' + this.name + '@' + this.connID + ']: ' + msg);
    }
});

