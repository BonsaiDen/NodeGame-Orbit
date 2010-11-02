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
var util = require('util');

var BISON = require('./libs/bison');
var Game = require('./game').Game;
var Client = require('./client').Client;


// Server ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Server(port) {
    
    // Logs
    this.showStatus = true;
    this.logs = [];
    
    
    // Clients
    this.maxClients = 8;
    this.clientCount = 0;
    this.clients = {};
    this.clientID = 0;
    
    // Game
    this.game = new Game(this);
    
    // Socket
    var that = this;
    this.port = port;
    this.bytesSend = 0;
    this.bytesSendLast = 0;
    
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
    
    
    // Info and Start
    this.startTime = this.getTime();
    this.status();
    process.addListener('SIGINT', function(){that.onShutdown()})
    
    this.game.run();
    this.$.listen(port);
}


// Helpers ---------------------------------------------------------------------
Server.prototype.getTime = function() {
    return new Date().getTime();
};

Server.prototype.timeDiff = function(time) {
    return this.time - time;
};

Server.prototype.log = function(str) {
    if (this.showStatus) {
        this.logs.push([this.getTime(), str]);
        if (this.logs.length > 16) {
            this.logs.shift();
        }

    } else {
        console.log(str);
    }
};

Server.prototype.toSize = function(size) {
    var t = 0;
    while(size >= 1024 && t < 2) {
        size = size / 1024;
        t++;
    }
    return Math.round(size * 100) / 100 + [' bytes', ' kib', ' mib'][t];
};

Server.prototype.toTime = function(time) {
    var t = Math.round((time - this.startTime) / 1000);
    var m = Math.floor(t / 60);
    var s = t % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
};

Server.prototype.status = function(end) {
    var that = this;
    if (!this.showStatus) {
        return;
    }
    
    var stats = '    Running ' + this.toTime(this.getTime()) + ' | '
                + this.game.playerCount
                + ' Player(s) / '
                + (this.clientCount - this.game.playerCount)
                + ' Viewer(s) / '
                + this.game.ships.length
                + ' Ships(s)\n    Traffic '
                + this.toSize(this.bytesSend)
                + ' | '
                + this.toSize((this.bytesSend - this.bytesSendLast) * 2)
                + '/s\n';
    
    this.bytesSendLast = this.bytesSend;
    for(var i = this.logs.length - 1; i >= 0; i--) {
        stats += '\n      ' + this.toTime(this.logs[i][0])
                            + ' ' + this.logs[i][1];
    }
    util.print('\x1b[H\x1b[J# NodeGame: Orbit at port '
              + this.port + '\n' + stats + '\n\x1b[s\x1b[H');
    
    if (!end) {
        setTimeout(function() {that.status(false)}, 500);
    
    } else {
        util.print('\x1b[u\n');
    }
};


// Login -----------------------------------------------------------------------
Server.prototype.checkLogin = function(msg) {
    if (msg instanceof Array && msg.length === 2
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
                if (name !== null) {
                    conn.$clientID = this.addClient(conn, name);
                }
            
            } else if (conn.$clientID) {
                this.clients[conn.$clientID].onMessage(msg);
            }
        
        } catch (e) {
            this.log('!! Error: ' + e);
            conn.close();
        }
    }
};

Server.prototype.onShutdown = function() {
    this.status(true);
    process.exit(0);
};


// Clients ---------------------------------------------------------------------
Server.prototype.addClient = function(conn, name) {
    this.clientID++;
    this.clients[this.clientID] = new Client(this, conn, name);
    this.clients[this.clientID].onInit();
    this.clientCount++;
    return this.clientID;
};

Server.prototype.removeClient = function(id) {
    if (this.clients[id]) {
        this.clientCount--;
        this.clients[id].onRemove();
        delete this.clients[id];
    }
};


// Network ---------------------------------------------------------------------
Server.prototype.broadcast = function(type, msg) {
    msg.unshift(type);
    msg = BISON.encode(msg);
    for(var i in this.clients) {
        var c = this.clients[i];
        this.bytesSend += c.$conn.send(msg);
    }
};

Server.prototype.send = function(conn, type, msg) {
    msg.unshift(type);
    this.bytesSend += conn.send(BISON.encode(msg));
};


// Start the Server ------------------------------------------------------------
// -----------------------------------------------------------------------------
new Server(28785);


