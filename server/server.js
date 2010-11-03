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


var ws = require('./libs/ws');
var BISON = require('./libs/bison');
var Client = require('./client').Client;
var Game = require('./game').Game;
var Status = require('./status').Status;


// Server ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Server(port, status) {
    
    // Clients
    this.maxClients = 8;
    this.clientCount = 0;
    this.clients = {};
    this.clientID = 1;
    
    // Game
    this.gameCount = 0;
    this.games = {};
    
    // Socket
    var that = this;
    this.port = port;
    this.bytesSend = 0;
    
    this.$ = new ws.Server(this.flash);
    this.$.onConnect = function(conn) {
        if (this.clientCount >= this.maxClients) {
            conn.close();
            return;
        }
    };
    
    this.$.onMessage = function(conn, msg) {
        that.onMessage(conn, msg);
    };
    
    this.$.onClose = function(conn) {
        that.removeClient(conn.$clientID);
    };
    
    process.addListener('SIGINT', function(){that.onShutdown()})
    this.$.listen(port);
    
    
    // Status
    this.status = null;
    if (status) {
        this.status = new Status(this);
        this.status.update();
    }
}

Server.prototype.log = function() {
    if (this.status) {
        this.status.log.apply(this.status, arguments);
    
    } else {
        console.log.apply(console, arguments);
    }
};


// Events ----------------------------------------------------------------------
Server.prototype.onMessage = function(conn, msg) {
    if (msg.length > this.maxChars) {
        this.log('!! Message longer than ' + this.maxChars + ' chars');
        conn.close();
    
    } else {
       try {
            
            // Login or Message
            var msg = BISON.decode(msg);
            if (!conn.$clientID && this.checkLogin(msg)) {
                var name = this.checkName(msg[1]);
                var game = this.checkGame(msg[2]);
                var watch = this.checkWatch(msg[3]);
                if (name !== null) {
                    conn.$clientID = this.addClient(conn, name, game, watch);
                }
            
            } else if (conn.$clientID) {
                this.clients[conn.$clientID].onMessage(msg);
            }
        
        } catch (e) {
            if (this.status) {
                this.status.logError(e);
                
            } else {
                console.log(e.stack);
            }
            conn.close();
        }
    }
};

Server.prototype.onShutdown = function() {
    if (this.status) {
        this.status.update(true);
    }
    process.exit(0);
};


// Validation -------------------------------------------------------------------
Server.prototype.checkLogin = function(msg) {
    if (msg instanceof Array && msg.length >= 3
        && msg[0] === 'init' && typeof msg[1] === 'string') {
        
        return true;
    
    } else {
        return false;
    }
};

Server.prototype.checkName = function(name) {
    name = name.trim();
    if (name.length >= 2 && name.length <= 15) {
        return name;
        
    } else {
        return null;
    }
};

Server.prototype.checkGame = function(game) {
    if (typeof game === 'number') {
        if (game >= 0 && game <= 12) {
            return game;
        }
    }
    return 0;
};

Server.prototype.checkWatch = function(watch) {
    if (typeof watch === 'boolean') {
        return watch;
    }
    return false;
};


// Clients & Players -----------------------------------------------------------
Server.prototype.addClient = function(conn, name, gameID, watch) {
    this.clientID++;
    this.clients[this.clientID] = new Client(this, conn, name);
    this.clientCount++;
    this.addClientToGame(this.clients[this.clientID], gameID, watch);
    return this.clientID;
};

Server.prototype.addClientToGame = function(client, gameID, watch) {
    if (!this.games[gameID]) {
        this.games[gameID] = new Game(this, gameID);
        this.gameCount++;
    }
    client.onJoin(this.games[gameID], watch);
};

Server.prototype.removeClient = function(id) {
    if (this.clients[id]) {
        this.clientCount--;
        this.clients[id].onRemove();
        delete this.clients[id];
    }
};


// Network ---------------------------------------------------------------------
Server.prototype.broadcast = function(type, msg, clients) {
    msg.unshift(type);
    msg = BISON.encode(msg);
    for(var i in clients) {
        this.bytesSend += clients[i].$conn.send(msg);
    }
};

Server.prototype.send = function(conn, type, msg) {
    msg.unshift(type);
    this.bytesSend += conn.send(BISON.encode(msg));
};


// Start the Server ------------------------------------------------------------
// -----------------------------------------------------------------------------
new Server(28785, true);


