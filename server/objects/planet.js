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
var Factory = require('./factory').Factory;


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Planet(game, id, x, y, size, start, nodes, maxCount, maxFactories) {
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
    this.nodes = nodes;
    this.spawnShipCount = 0;
    this.maxCount = maxCount;
    this.maxFactories = maxFactories;
    this.factoriesDestroyed = [];
    
    this.factoryR = Math.floor(360 * Math.random());
    this.factoryID = 1;
    this.factoryCount = 0;
    this.factories = {};
    
    this.initNeutral(true, true, true);
}
exports.Planet = Planet;


// Players ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Planet.prototype.initPlayer = function(player, start, factories) {
    if (!this.ships[player.id]) {
        this.ships[player.id] = {fight: [], bomb: [], def: []};
    }
     
    if (start) {
        this.removeNeutral();
        this.player = player; 
        if (factories) {
            this.createFactory('fight', true, false);
            this.createFactory('bomb', true, false);
            this.createFactory('def', true, false);
            this.spawnShipCount = 15;
        }
    }
};

Planet.prototype.initNeutral = function(ships, orbit, factories) {
    this.player = this.$.neutralPlayer;  
    if (factories) {
        var count = Math.floor(this.maxFactories / 1.5);
        for(var i = 0; i < count; i++) {
            var type = this.$.factoryTypes[Math.floor(Math.random() * this.$.factoryTypes.length)];
            this.createFactory(type, true, true);
        }
        this.spawnShipCount = Math.floor(this.maxCount / 2.5);
    }
};

Planet.prototype.updatePlayer = function() {
    this.player.shipMaxCount += this.maxCount;
    this.player.planetCount++;
};

Planet.prototype.removePlayer = function(player) {
    this.removePlayerShips(player);
    if (this.player === player) {
        this.removeFactories();
        this.initNeutral(true, false, false);
    }
    delete this.ships[player.id];
};

Planet.prototype.removeNeutral = function() {
    this.removePlayerShips(this.$.neutralPlayer);
    this.removeFactories();
};

Planet.prototype.checkPlayer = function() {
    if (this.getPlayerFactoryCount(this.player) === 0) {
        var master = null;
        var max = 0;
        for(var i in this.factories) {
            var count = this.getPlayerFactoryCount(this.factories[i].player);
            if (count > max) {
                master = this.factories[i].player;
                max = count;
            }
        }
        
        if (master) {
            this.initPlayer(master, false, false);
        
        } else {
            this.initNeutral();
        }
        this.$.updatePlanets(this);
    }
};


// Factories -------------------------------------------------------------------
// -----------------------------------------------------------------------------
Planet.prototype.createFactory = function(type, complete, neutral) {
    if (this.factoryCount >= this.maxFactories) {
        return
    }
    
    var fdiff = Math.round(360 / this.maxFactories);
    var p = 0, r = 0, found = false;
    while(!found) {
        found = true;
        r = Math.round(this.factoryR + (p % 2 === 0 ? 0 - fdiff * p : fdiff * p));
        while (r >= 360) {
            r -= 360;
        }
        while (r < 0) {
            r += 360;
        }
        for(var i in this.factories) {
            if (this.factories[i].r === r) {
                found = false;
                break;
            }
        }
        p++;
    }
    new Factory(this, r, this.player, type, complete);
};

Planet.prototype.removeFactories = function() {
    for(var i in this.factories) {
        this.factories[i].destroy();
    }
};


// Ships -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Planet.prototype.createShip = function(type, player, r, orbit) {
    var ship = new Ship(this.$, type, this, player, r, orbit);
    this.$.ships.push(ship);
    if (this.spawnShipCount > 0) {
        this.spawnShipCount--;
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

Planet.prototype.removePlayerShips = function(player) {
    var ships = this.ships[player.id];
    for(var t in ships) {
        for(var i = 0; i < ships[t].length; i++) {
            ships[t][i].destroy(true);
            this.shipCount--;
        }
        ships[t] = [];
    }

};


// Update Planets --------------------------------------------------------------
// -----------------------------------------------------------------------------
Planet.prototype.tick = function() {
    var maxRate = [1, 0.80, 0.90, 1.0, 1.2, 1.5, 1.75, 2.25, 2.75];
    var rate = 3;
    if (this.player.planetCount < maxRate.length && this.player.id !== 0) {
        rate = maxRate[this.player.planetCount];
    }
    
    for(var i in this.factories) {
        var f = this.factories[i];
        f.produce(rate);
    }
};


// Combat ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
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
                
                var s = ships[e];
                var ds = Math.abs(this.$.coreDifference(s.r, c.r));
                if (!s.traveling && s.health > 0
                    && ds <= c.getRotationSpeed() * 7) {
                    
                    if (s.player !== c.player) {
                        c.attack(s);
                        s.attack(c);
                        break;
                    }
                
                } else {
                    break;
                }
            }
            
            if (!c.attacked) {
                for(var e in this.factories) {
                    var f = this.factories[e];
                    var ds = Math.abs(this.$.coreDifference(f.r, c.r));
                    if (ds <= c.getRotationSpeed() * 7 && f.player !== c.player) {
                        c.attackFactory(f);
                        break;
                    }
                }
            }
        }
    }
};

// Commands --------------------------------------------------------------------
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
    
    // First get the ships that will leave the planet the soonest
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && !ship.traveling
            && ship.targetPlanet === null && ship.inOrbit) {
            
            var diff = this.$.coreDifference(ship.r, travelAngle);
            if (Math.abs(diff) >= 15) {
                
                ship.send(target);
                amount--;
            }
        }
    }
    
    // If we still need more, then get some of the others
    for(var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        if (amount > 0 && !ship.traveling && !ship.nextPlanet) {
            ship.send(target);
            amount--;
        }
    }
};

Planet.prototype.stop = function(player, type, to) {
    if (to) {
        for(var i = 0, l = this.$.ships.length; i < l; i++) {
            var ship = this.$.ships[i];
            if (ship.nextPlanet === this || ship.targetPlanet === this) {
                ship.stop();
            }
        }
    
    } else {
        var ships = this.ships[player.id][type];
        for(var i = 0, l = ships.length; i < l; i++) {
            ships[i].stop();
        }
    }
};


// Helpers ---------------------------------------------------------------------
Planet.prototype.getPlayerShipCount = function(player) {
    return this.ships[player.id]['fight'].length
           + this.ships[player.id]['def'].length
           + this.ships[player.id]['bomb'].length;
};

Planet.prototype.getPlayerFactoryCount = function(player) {
    var count = 0;
    for(var i in this.factories) {
        if (this.factories[i].player === player) {
            count++;
        }
    }
    return count;
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

