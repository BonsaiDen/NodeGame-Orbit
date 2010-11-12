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


// Orbit Game Planet Methods ---------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_PLANETS_INIT = 5;
var MSG_PLANETS_UPDATE = 6;


exports.methods = {
    
    tickPlanets: function() {
        this.planets.eachCall('tick');    
        this.planetsUpdateAll();
    },
    
    planetsSetup: function() {
        this.planetsAddPlayerData(this.playerNeutral);
        this.planets.each(function(planet) {
            planet.initNodes();
            planet.initPlayer(this.playerNeutral, true);
        }, this);
    },
    
    // Network -----------------------------------------------------------------
    planetsInit: function(client) {
        var inits = [];
        this.planets.each(function(planet) {
            inits.push(planet.initMessage());
        });
        client.send(MSG_PLANETS_INIT, [inits]);
    },
    
    planetsUpdateAll: function() {
        this.clients.each(function(client) {
            this.planetsUpdate(client);
        }, this);
        
        this.planets.each(function(planet) {
            planet.updated = false;
        }, this);
    },
    
    planetsUpdate: function(client) {
        var updates = [];
        this.planets.each(function(planet) {
            if (planet.updated) {
                updates.push(planet.updateMessage()); 
            }
        });
        if (updates.length > 0) {
            client.send(MSG_PLANETS_UPDATE, [updates]);
        }
    },
    
    // Player Data -------------------------------------------------------------
    planetsAddPlayerData: function(player) {
        this.planets.each(function(planet) {
            planet.playerShips.put(player.id, new HashList());
        });
    },
    
    planetsRemovePlayerData: function(player) {
        this.planets.each(function(planet) {
            planet.playerShips.remove(player);
        });
    },
    
    // Additional Player functions ---------------------------------------------
    planetsStartPlayer: function(player) {
        this.planets.each(function(planet) {
            if (planet.isStartable()) {
                planet.initPlayer(player, true);
                return true;
            }
        }, this);
    },
    
    planetsDestroyPlayer: function(player) {
        player.planets.each(function(planet) {
            planet.makeNeutral();
        });
    }
};

