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
var OrbitPlayer = require('./../objects/player').OrbitPlayer;



// Orbit Game Player Methods ---------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_PLAYER_ADD = 1;
var MSG_PLAYER_REMOVE = 2;


exports.methods = {
    
    tickPlayers: function() {
        this.players.each(function(player) {
            if (player.clientDropped) {
                var droppedCount = this.getTick() - player.clientDroppedTick;
                if (droppedCount > this.playerMaxDrop) {
                    player.quit(true);
                }
            }
        }, this);
    },
    
    playerCreate: function(client, neutral) {
        var player = new OrbitPlayer(this, client, neutral);
        this.players.add(player);
        this.broadcastNot(MSG_PLAYER_ADD,
                          [player.id, player.name, player.color,
                           player.isNeutral()], [client]);
        
        this.planetsAddPlayerData(player);
        this.planetsStartPlayer(player);
        return player;
    },
    
    playerRemove: function(player) {
        this.removePlayerShips(player);
        this.planetsRemovePlayerData(player);
        this.playerColors.remove(player);
        this.players.remove(player);
        this.playerHumanCount--;
        
        this.factoriesUpdateAll();
        this.planetsUpdateAll();
        this.shipsUpdateAll();
        this.broadcastNot(MSG_PLAYER_REMOVE, [player.id], [player.client]);
    },
    
    removePlayerShips: function(player) {
        this.ships.each(function(ship) {
            if (ship.player === player) {
                ship.destroy();
            }
        });
    },
    
    playersInit: function(client) {
        this.players.each(function(player) {
            client.send(MSG_PLAYER_ADD, [player.id, player.name, player.color]);
        });
    }
};

