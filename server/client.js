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


var MSG_SEND = ['number', 'number', 'string', 'number'];
var MSG_STOP = ['number', 'string', 'boolean'];
var MSG_BUILD = ['number', 'string'];


// Clients ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Client(server, conn, name, hash) {
    this.$$ = server;
    this.conn = conn;
    this.info = '[' + conn.id + ']';
    this.id = this.$$.clientID;
    this.playerHash = hash;
    this.gameID = -1;
    this.name = name;
    this.player = null;
}

exports.Client = Client;


// Events ----------------------------------------------------------------------
Client.prototype.onJoin = function(game, watch) {
    this.$ = game;
    this.gameID = this.$.id;
    this.$$.log('++', this.info, 'joined Game #' + this.gameID);
    this.$.addClient(this, watch);
};

Client.prototype.onRejoin = function() {
    this.$$.log('++', this.info, 're-joined Game #' + this.gameID);
};

Client.prototype.onMessage = function(msg) {
    if (msg.send && this.validateMessage(msg.send, MSG_SEND)) {
        this.$.onMessage('send', msg.send, this);
    
    } else if (msg.stop && this.validateMessage(msg.stop, MSG_STOP)) {
        this.$.onMessage('stop', msg.stop, this);
    
    } else if (msg.build && this.validateMessage(msg.build, MSG_BUILD)) {
        this.$.onMessage('build', msg.build, this);
    }
};

Client.prototype.onRemove = function() {
    this.$$.log('--', this.info, 'left Game #' + this.gameID);
    this.$.removeClient(this);
};


// Network ---------------------------------------------------------------------
Client.prototype.validateMessage = function(msg, types) {
    if (!msg instanceof Array || msg.length !== types.length) {
        return false;
    }
    
    for(var i = 0, l = msg.length; i < l; i++) {
        if (typeof msg[i] !== types[i]) {
            return false;
        }
    }
    return true;
};

Client.prototype.send = function(type, msg) {
    this.$$.send(this.conn, type, msg);
};

Client.prototype.close = function() {
    this.conn.close();
};

