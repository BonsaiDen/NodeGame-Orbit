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
function Planet(game, id, x, y, size, start, nodes) {
    this.$ = game;
    this.id = id;
    this.player = this.$.neutralPlayer;
    
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
    this.maxCount = Math.floor(this.size * 0.65);
    this.nodes = nodes;
    
    this.initNeutral(true, true);
}
exports.Planet = Planet;


// Player Handling -------------------------------------------------------------
Planet.prototype.reset = function() {
    this.rateStep = 0;
    this.rate = 100;
};

Planet.prototype.initPlayer = function(player, start) {
    if (!this.ships[player.id]) {
        this.ships[player.id] = {fight: [], bomb: [], def: []};
    }
    this.player = player;
    this.rateStep = 0;
    this.rate = Math.floor((this.start ? 4000 : 9000) / this.size * 0.5);
    
    if (start) {
        this.removeNeutral();
        this.createShips('fight', this.player, 3, false);
    }
};

Planet.prototype.initNeutral = function(ships, orbit) {
    this.player = this.$.neutralPlayer;
    this.rateStep = 0;
    this.rate = Math.floor(8000 / this.size);
    
    if (ships) {
        var count = Math.ceil(this.maxCount / 5);
        this.createShips('fight', this.player, count, orbit);
    }
};

Planet.prototype.updatePlayer = function() {
    this.player.shipMaxCount += this.maxCount;
    this.player.planetCount++;
};

Planet.prototype.checkPlayer = function() {
    var locals = this.getPlayerShipCount(this.player);
    if (locals === 0) {
        var master = null;
        var max = 0;
        for(var i in this.ships) {
            var count = this.getPlayerShipCount(this.$.players[i]);
            if (count > max) {
                master = this.$.players[i];
                max = count;
            }
        }
        if (master) {
            this.initPlayer(master);
            this.$.updatePlanets(this);
            return true;
        }
    }
    return false;
};

Planet.prototype.removePlayer = function(player) {
    this.removeShips(player);
    if (this.player === player && !this.checkPlayer()) {
        this.initNeutral(true, false);
    }
    delete this.ships[player.id];
};

Planet.prototype.removeNeutral = function() {
    this.removeShips(this.$.neutralPlayer);
};

Planet.prototype.removeShips = function(player) {
    var ships = this.ships[player.id];
    for(var t in ships) {
        for(var i = 0; i < ships[t].length; i++) {
            ships[t][i].destroy();
            i--;
        }
    }
};


// Production Ticking ----------------------------------------------------------
Planet.prototype.tick = function() {
    if (this.player) {
        this.rateStep++;
        
        var maxCount = this.player.id === 0 ? this.maxCount * 0.5 : this.maxCount;
        if (this.rateStep > this.rate) {
            if (this.player.shipCount < this.player.shipMaxCount) {
                
                if (this.getPlayerShipCount(this.player) < maxCount) {
                    this.createShip('fight', this.player, false);
                }
            }
            this.rateStep = 0;
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
    
    for(var i = 0, l = ships.length; i < l; i++) {
        var c = ships[i];
        if (c.inOrbit && c.health > 0 && !c.traveling) {
            for(var e = i + 1;; e++) {
                if (e === l) {
                    e = 0;
                }
                if (e === i) {
                    break;
                }
                
                var rs = Math.round(Math.PI / this.size * this.$.shipSpeeds[c.type] * 100) / 100 * 2.5;
                var s = ships[e];
                var ds = Math.abs(this.$.coreDifference(s.r, c.r));
                if (!s.traveling && s.health > 0 && ds <= rs * 3) {
                    if (s.player !== c.player) {
                        c.attack(s);
                        s.attack(c);
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
                        player, Math.floor(Math.random() * 360), orbit);
    
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
        if (this.shipCount === 0 && this.player !== ship.player) {
            this.initPlayer(ship.player);
            this.$.updatePlanets(this);
        }
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
    
    // Take over planets
    if (ship.player === this.player) {
        this.checkPlayer();
    }
};

Planet.prototype.send = function(player, target, type, amount) {
    var ships = this.ships[player.id][type];
    var travelAngle = this.$.coreAngle(this, target);
    ships.sort(function(a, b) {
        var ra = a.direction === 1 ? ((a.r + a.rs) - travelAngle + 360) % 360
                                   : (travelAngle - (a.r - a.rs) + 360) % 360;
    
        var rb = b.direction === 1 ? ((b.r + b.rs) - travelAngle + 360) % 360
                                   : (travelAngle - (b.r - b.rs) + 360) % 360;
        
        return rb - ra;
    });
    
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && !ship.traveling && ship.targetPlanet === null && ship.inOrbit) {
            ship.send(target);
            amount--;
        }
    }
    
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && !ship.traveling && (ship.targetPlanet !== null || !ship.inOrbit)) {
            ship.send(target);
            amount--;
        }
    }
};

Planet.prototype.stop = function(player, type) {
    var ships = this.ships[player.id][type];
    for(var i = 0, l = ships.length; i < l; i++) {
        ships[i].stop();
    }
}


// Helpers ---------------------------------------------------------------------
Planet.prototype.getPlayerShipCount = function(player) {
    return this.ships[player.id]['fight'].length
           + this.ships[player.id]['def'].length
           + this.ships[player.id]['bomb'].length;
};

Planet.prototype.getPreferedDirection = function(player, type) {
    var ships = this.ships[player.id][type];
    var left = 0, right = 0;
    for(var i = 0, l = ships.length; i < l; i++) {
        if (ships[i].direction === 1) {
            left++;
        
        } else {
            right++;
        }
    }
    return left > right ? -1 : 1;
};

Planet.prototype.getTick = function() {
    return this.$.getTick();
};

