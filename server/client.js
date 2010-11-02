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

var Game = require('./game').Game;


// Clients ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Client(server, conn, name, gameID, watch) {
    this.$$ = server;
    
    // Create a new game or join an existing one
    if (!this.$$.games[gameID]) {
        this.$ = this.$$.games[gameID] = new Game(this.$$, gameID);
        this.$$.gameCount++;
    
    } else {
        this.$ = this.$$.games[gameID];
    }
    
    // Stuff
    this.$conn = conn;
    this.info = name + ' [' + conn.id + ']';
    this.id = this.$$.clientID;
    this.gameID = gameID;
    this.name = name;
    
    this.$$.log('++ ' + this.info + ' joined Game #' + this.gameID);
    this.$.addPlayer(this, watch);
}

exports.Client = Client;


// Events ----------------------------------------------------------------------
Client.prototype.onMessage = function(msg) {

    // Send Ships
    if (msg.send && msg.send instanceof Array && msg.send.length === 4) {
        var data = msg.send;
        if (typeof data[0] === 'number' && typeof data[1] === 'number'
            && typeof data[2] === 'string' && typeof data[3] === 'number') {
            
            this.$.onMessage('send', data, this);
        }
    
    // Stop ships
    } else if (msg.stop && msg.stop instanceof Array && msg.stop.length === 2) {
        var data = msg.stop;
        if (typeof data[0] === 'number' && typeof data[1] === 'string') {
            this.$.onMessage('stop', data, this);
        }
    }
};

Client.prototype.onRemove = function() {
    this.$$.log('++ ' + this.info + ' left Game #' + this.gameID);
    this.$.removePlayer(this.id);
};


// Network ---------------------------------------------------------------------
Client.prototype.send = function(type, msg) {
    this.$$.send(this.$conn, type, msg);
};

Client.prototype.close = function() {
    this.$conn.close();
};

