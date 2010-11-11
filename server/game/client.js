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
var HashList = require('./../libs/hashlist').HashList;


// Orbit Game Client Methods ---------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_GAME_JOIN = 3;
var MSG_GAME_INIT = 4;
var MSG_GAME_TICK = 7;

exports.methods = {
    
    tickClients: function() {
        if (this.getTick() % 30 === 0) {
            this.broadcast(MSG_GAME_TICK, [this.tickCount]);
        }
    },
    
    clientAdd: function(client) {
        if (!this.clients.has(client)) {
            client.factories = new HashList();
            client.ships = new HashList();
            client.game = this;
            
            this.clients.add(client);
            if (!this.clientReconnect(client)) {
                if (!this.players.full() && !client.gameWatch) {
                    this.playerCreate(client, false);
                }
            }
            this.clientInit(client);
        }
    },
    
    clientRemove: function(client) {
        if (client && this.clients.remove(client)) {
            client.factories.clear();
            client.ships.clear();
            if (this.players.contains(client.player)) {
                client.player.disconnect();
            }
        }
    },
    
    clientInit: function(client) {
        client.send(MSG_GAME_TICK, [this.tickCount]);
        client.send(MSG_GAME_INIT, [this.id, this.map.width, this.map.height,
                                    this.planetCombatTickRate,
                                    this.shipSpeed, this.shipOrbit,
                                    this.shipToOrbitSpeed]);
        
        this.playersInit(client);
        this.planetsInit(client);
        this.factoriesUpdate(client);
        this.shipsUpdate(client);
        
        var join = client.player ? [client.player.id, client.player.gameHash]
                                 : [null, null];
        
        client.send(MSG_GAME_JOIN, join);
    },
    
    clientReconnect: function(client) {
        if (!client.gameWatch) {
            return this.players.each(function(player) {
                if (player.clientDropped && player.checkHash(client)) {
                    player.connect(client, true);
                    return true;
                }
            });
        }
        return false;
    }
};

