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


// Clients ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Client(server, conn, name) {
    this.$$ = server;
    this.$conn = conn;
    this.info = name + ' [' + conn.id + ']';
    this.id = this.$$.clientID;
    this.gameID = -1;
    this.name = name;
}

exports.Client = Client;


// Events ----------------------------------------------------------------------
Client.prototype.onJoin = function(game, watch) {
    this.$ = game;
    this.gameID = this.$.id;
    this.$$.log('++', this.info, 'joined Game #' + this.gameID);
    this.$.addPlayer(this, watch);
}

Client.prototype.onMessage = function(msg) {

    // Send Ships
    if (msg.send && this.validateMessage(msg.send, ['number', 'number',
                                                    'string', 'number'])) {
        
        this.$.onMessage('send', msg.send, this);
    
    // Stop ships
    } else if (msg.stop && this.validateMessage(msg.stop, ['number', 'string'])) {
        this.$.onMessage('stop', msg.stop, this);
    }
};

Client.prototype.onRemove = function() {
    this.$$.log('++ ', this.info, ' left Game #' + this.gameID);
    this.$.removePlayer(this.id);
};


// Network ---------------------------------------------------------------------
Client.prototype.validateMessage = function(msg, types) {
    if (!msg instanceof Array) {
        return false;
    }
    
    if (msg.length !== types.length) {
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
    this.$$.send(this.$conn, type, msg);
};

Client.prototype.close = function() {
    this.$conn.close();
};

