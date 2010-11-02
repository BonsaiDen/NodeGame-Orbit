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
    this.$ = server.game;
    this.$conn = conn;
    this.info = conn.id;
    this.id = this.$$.clientID;
    this.ships = {};
    
    this.name = name;
    this.$$.log('++ ' + this.info + ' connected');
}
exports.Client = Client;


// Events ---------------------------------------------------------------------
Client.prototype.onInit = function() {
    this.$.addPlayer(this);
};

Client.prototype.onMessage = function(msg) {

    // Send Ships
    if (msg.send && msg.send instanceof Array && msg.send.length === 4) {
        var data = msg.send;
        if (typeof data[0] === 'number' && typeof data[1] === 'number'
            && typeof data[2] === 'string' && typeof data[3] === 'number') {
            
            this.$.onMessage('send', data, this);
        }
    }
};

Client.prototype.onRemove = function() {
    this.$$.log('++ ' + this.info + ' left');
    this.$.removePlayer(this);
};


// Network ---------------------------------------------------------------------
Client.prototype.send = function(type, msg) {
    this.$$.send(this.$conn, type, msg);
};

