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


// Orbit Game Planet Methods ---------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_SHIPS_UPDATE = 8;
var MSG_SHIPS_DESTROY = 9;


exports.methods = {
    
    tickShips: function() {
        this.ships.eachCall('tick');    
        this.shipsUpdateAll();
    },
    
    shipsUpdateAll: function() {
        this.clients.each(function(client) {
            this.shipsUpdate(client);
        }, this);
        
        this.ships.each(function(ship) {
            if (ship.destroyed) {
                this.ships.remove(ship);
            }
            ship.reset();
        }, this);
    },
    
    shipsUpdate: function(client) {
        var updates = [];
        var destroys = [];
        this.ships.each(function(ship) {
            if (!client.ships.has(ship) && !ship.destroyed) {
                updates.push(ship.createMessage());
                client.ships.add(ship);
            
            } else if (ship.updated && !ship.destroyed) {
                updates.push(ship.updateMessage());
            
            } else if (ship.destroyed) {
                destroys.push(ship.destroyMessage());
                client.ships.remove(ship);
            }
        }, this);
        
        if (updates.length > 0) {
            client.send(MSG_SHIPS_UPDATE, [updates]);
        }
        if (destroys.length > 0) {
            client.send(MSG_SHIPS_DESTROY, [destroys]);
        }
    }
};

