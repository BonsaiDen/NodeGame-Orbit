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
    this.ships[this.$.neutralPlayer.id] =  {fight: [], bomb: [], def: []};
    this.shipCount = 0;
    
    // Production
    this.rateStep = 0;
    this.rate = 100;
    this.maxCount = 5;
    
    if (!start) {
        this.initNeutral();
    }
}
exports.Planet = Planet;


// Inits and Resets ------------------------------------------------------------
Planet.prototype.reset = function() {
    this.rateStep = 0;
    this.rate = 100;
    this.maxCount = 5;
};

Planet.prototype.initPlayer = function(player) {
    this.player = player;
    this.rateStep = 0;
    this.rate = 50;
    this.maxCount = 30;
};

Planet.prototype.initNeutral = function() {
    this.player = this.$.neutralPlayer;
    this.rateStep = 0;
    this.rate = 250;
    this.maxCount = Math.floor(this.size / 6);
    
    this.createShips('fight', this.player,
                     Math.floor(this.maxCount * (0.5 + Math.random() / 2)), true);
};


// Production Ticking ----------------------------------------------------------
Planet.prototype.tick = function() {
    if (this.player) {
        this.rateStep++;
        if (this.rateStep > this.rate) {
            if (this.getPlayerShipCount(this.player) < this.maxCount) {
                this.createShip('fight', this.player, false);
                this.rateStep = 0;
            }
        }
    }
};


// Combat ----------------------------------------------------------------------
Planet.prototype.tickCombat = function() {
    if (this.shipCount === 0) {
        return;
    }
    
    var ships = [];
    var tl = this.$.shipTypes.length;
    for(var p in this.ships) {
        for(var t = 0; t < tl; t++) {
            ships = ships.concat(this.ships[p][this.$.shipTypes[t]]);
        }
    }
    ships.sort(function(a, b) {
        return a.r < b.r;
    });
    
    var rs = Math.round(Math.PI / this.size * this.$.shipSpeed * 100) / 100 * 2;
    var fightDistance = rs * 3;
    for(var i = 0, l = ships.length; i < l; i++) {
        var c = ships[i];
        if (c.inOrbit && c.health > 0) {
            for(var e = i + 1;; e++) {
                if (e === l) {
                    e = 0;
                }
                if (e === i) {
                    break;
                }
                
                var s = ships[e];
                var ds = Math.abs(this.$.coreDifference(s.r, c.r));
                if (s.health > 0 && ds <= fightDistance) {
                    if (s.player !== c.player) {
                        c.attack(s);
                        break;
                    }
                
                } else {
                    break;
                }
            }
        }
    }
};


// Ships -----------------------------------------------------------------------
Planet.prototype.createShip = function(type, player, orbit) {
    var ship = new Ship(this.$, type, this,
                        player, Math.floor(Math.random() * 360),
                        Math.random() * 2 > 1 ? 1 : -1, orbit);
    
    this.$.ships.push(ship);
};

Planet.prototype.createShips = function(type, player, count, orbit) {
    for(var i = 0; i < count; i++) {
        this.createShip(type, player, orbit);
    }
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
Planet.prototype.getPlayerShipCount = function(player) {
    return this.ships[player.id]['fight'].length
           + this.ships[player.id]['def'].length
           + this.ships[player.id]['bomb'].length;
};

Planet.prototype.getTick = function() {
    return this.$.getTick();
};

