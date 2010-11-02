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


var Ship = require('./ship').Ship;


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Planet(game, x, y, size, start, id) {
    this.$ = game;
    this.id = id;
    this.player = null;
    
    this.start = start;
    this.size = size;
    this.x = x;
    this.y = y;
    
    this.ships = {};
    this.shipCount = 0;
    
    // Production
    this.rate = 10;
    this.count = 20;
}
exports.Planet = Planet;

Planet.prototype.reset = function() {
    this.count = 20;
    this.rate = 10;
};


// Production Ticking ----------------------------------------------------------
Planet.prototype.tick = function() {
    if (this.player) {
        this.rate--;
        if (this.rate === 0 && this.count > 0) {
            this.createShip('fight', this.player);
            this.rate = 10;
            this.count--;
        }
    }
};


// Ships -----------------------------------------------------------------------
Planet.prototype.createShip = function(type, player) {
    var ship = new Ship(this.$, type, this,
                        player, Math.floor(Math.random() * 360),
                        Math.random() * 2 > 1 ? 1 : -1);
    
    this.$.ships.push(ship);
};

Planet.prototype.addShip = function(ship) {
    if (this.ships[ship.player.id][ship.type].indexOf(ship) === -1) {
        this.ships[ship.player.id][ship.type].push(ship);
        this.shipCount++;
    }
};

Planet.prototype.removeShip = function(ship) {
    var ships = this.ships[ship.player.id][ship.type];
    var index = ships.indexOf(ship);
    if (index !== -1) {
        ships.splice(index, 1);
        this.shipCount--;
    }
};

Planet.prototype.send = function(player, target, type, amount) {
    var ships = this.ships[player.id][type];
    var travelAngle = this.$.coreAngle(this, target);
    ships.sort(function(a, b) {
        var ra = a.direction === 1 ? (a.r - travelAngle + 360) % 360
                                   : (travelAngle - a.r + 360) % 360;
    
        var rb = b.direction === 1 ? (b.r - travelAngle + 360) % 360
                                   : (travelAngle - b.r + 360) % 360;
        
        return rb - ra;
    });
    
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && ship.targetPlanet === null) {
            ship.send(target);
            amount--;
        }
    }
    
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && ship.targetPlanet !== null) {
            ship.send(target);
            amount--;
        }
    }
};

// Helpers ---------------------------------------------------------------------
Planet.prototype.getTick = function() {
    return this.$.getTick();
};

