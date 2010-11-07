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
    this.factoryCompleteCount = 0;
    this.factories = {};
    
    this.neutralTick = 0;
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
        this.removePlayerShips(this.$.neutralPlayer);
        this.removeFactories(true);
        this.player = player; 
        if (factories) {
            this.createFactory(player, -1, 'fight', true);
            this.spawnShipCount = 5;
        }
    
    } else {
        this.player = player; 
    }
};

Planet.prototype.initNeutral = function(ships, orbit, factories) {
    this.player = this.$.neutralPlayer;  
    this.neutralTick = Math.floor(this.getTick() + 300 + (600 * Math.random()));
    if (factories) {
        var count = Math.max(1, Math.floor(this.maxFactories / 3));
        for(var i = 0; i < count; i++) {
            this.createFactory(this.player, -1, 'fight', true);
        }
        this.spawnShipCount = Math.floor(this.maxCount / 8);
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

Planet.prototype.checkPlayer = function(build) {
    if (this.getPlayerCompleteFactoryCount(this.player) === 0 || build) {
        var master = null;
        var max = 0;
        for(var i in this.factories) {
            var count = this.getPlayerCompleteFactoryCount(this.factories[i].player);
            if (count > max) {
                master = this.factories[i].player;
                max = count;
            }
        }
        
        if (master) {
            this.initPlayer(master, false, false);
            for(var i in this.factories) {
                if (this.factories[i].player !== master) {
                    this.factories[i].destroy();
                }
            }
        
        } else {
            var oldPlayer = this.player;
            this.initNeutral();
            for(var i in this.factories) {
                if (this.factories[i].player === oldPlayer) {
                    this.factories[i].destroy();
                }
            }
        }
        this.$.updatePlanets(this);
    }
};


// Factories -------------------------------------------------------------------
// -----------------------------------------------------------------------------
Planet.prototype.createFactory = function(player, place, type, complete) {
    if (this.factoryCount >= this.maxFactories) {
        return
    }
    
    var fdiff = Math.round(360 / this.maxFactories);
    if (place === -1) {
        var random = [];
        for(var p = 0; p < this.maxFactories; p++) {
            var r = this.factoryR + p * fdiff;
            var found = false;
            for(var i in this.factories) {
                if (this.factories[i].r === r) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                random.push(r);
            }
        }
        random.sort(function(a, b) {return (Math.random() * 2) - 1});
        new Factory(this, random[0], player, type, complete);
        
    } else if (place >= 0 && place < this.maxFactories) {   
        var found = false;
        var r = this.factoryR + place * fdiff;
        for(var p = 0; p < this.maxFactories; p++) {
            for(var i in this.factories) {
                if (this.factories[i].r === r) {
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            new Factory(this, r, player, type, complete);
        }
    }
};

Planet.prototype.buildFactory = function(player, place, type) {
    if (player === this.player) {
        this.createFactory(player, place, type, false);
    
    } else if (this.player === this.$.neutralPlayer
               && this.factoryCompleteCount === 0
               && this.getPlayerFactoryCount(player) === 0) {
        
        var found = false;
        for(var i = 0; i < this.nodes.length; i++) {
            if (this.$.planets[this.nodes[i]].player === player) {
                found = true;
                break;
            }
        }
        
        if (found) {
            this.createFactory(player, place, type, false);
        }
    }
};

Planet.prototype.removeFactories = function(noCheck) {
    for(var i in this.factories) {
        this.factories[i].destroy(noCheck);
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
    var maxRate = [1, 0.50, 0.90, 1.0, 1.2, 1.4, 1.6, 1.7, 2];
    var rate = 2.1;
    if (this.player.planetCount < maxRate.length && this.player.id !== 0) {
        rate = maxRate[this.player.planetCount];
    }
    
    for(var i in this.factories) {
        this.factories[i].produce(rate);
    }
    
    // neutral AI
    if (this.player === this.$.neutralPlayer
        && this.getTick() % 45 === 0 && Math.random() > 0.7) {
        
        this.tickAI();
    }
};

Planet.prototype.tickAI = function() {
    var build = this.getTick() > this.neutralTick;
    var factoryBuilt = false;
    var humansCount = this.getHumanShips();
    var neutralCount = this.getPlayerShipCount(this.player);
    
    // send some ships to surrounding neutral planets
    // check nearby planets
    for(var i = 0, l = this.nodes.length; i < l; i++) {
        var p = this.$.planets[this.nodes[i]];
        if (p.player === this.player) {
        
            // send help
            if (humansCount > neutralCount && neutralCount > 3) {
                for(var e = 0; e < this.$.shipTypes.length; e++) {
                    var type = this.$.shipTypes[e];
                    if (p.getShipReadyCount(this.player, type) > 2) { 
                        p.send(this.player, this, type, 1 + Math.floor(Math.random() * 2), true);
                    //    console.log('Send help');
                    }
                }
            
            // Build
            } else if (humansCount === 0 && !factoryBuilt) {
                
                // factories
                var neededShips = {fight: 0, def: 0, bomb: 0};
                for(var e in this.factories) {
                    var f = this.factories[e];
                    neededShips[f.type] += (f.shipsNeeded - f.shipsTaken);
                }
                
                if (build) {
                    if (p.getPlayerFactoryCount(this.player) < p.maxFactories) {
                        var all = p.getPlayerShipCount(this.player);
                        for(var e = 0; e < this.$.shipTypes.length; e++) {
                            var type = this.$.shipTypes[e];
                            var cur = this.getShipReadyCount(this.player, type);
                           // if (p.getHumanShips() * 1.5 < all) {
                            if (cur > 3 + neededShips[type]) {
                                p.buildFactory(this.player, -1, type);
                                factoryBuilt = true;
                            }
                          //  }
                        }
                    }
                }
                
                // send random ships
                var type = this.$.shipTypes[Math.floor(Math.random() * this.$.shipTypes.length)];
                if (this.getShipReadyCount(this.player, type) > this.maxCount / 3) { 
                    this.send(this.player, p, type, Math.floor(Math.random() * 2), true);
                }
                
                // send ships to build
                for(var e in p.factories) {
                    var f = p.factories[e];
                    if (!f.build) {
                        var available = p.getShipReadyCount(this.player, f.type);
                        var needed = (f.shipsNeeded - f.shipsTaken) - available;
                        if (needed > 0) {
                            this.send(this.player, p, f.type, needed, true);
                        }
                    }
                }
            }
        
        // send attack
        } else {
            var send = Math.floor(this.maxCount / 3);
            if (neutralCount >= send * 1.5 && p.getHumanShips() < send * 2) {
           //     console.log('send attack');
                this.send(this.player, p, 'fight', send, false);
            }
        }
    }
    if (build) {
        this.neutralTick = Math.floor(this.getTick() + 300 + (600 * Math.random()));
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
                    if (ds <= c.getRotationSpeed() * 5 && f.player !== c.player) {
                        c.attackFactory(f);
                        break;
                    }
                }
            }
        }
    }
};

// Commands --------------------------------------------------------------------
Planet.prototype.send = function(player, target, type, amount, readyOnly) {
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
        if (amount > 0 && !ship.traveling && !ship.landFactory && !ship.landing
            && ship.targetPlanet === null && ship.inOrbit) {
            
            var diff = this.$.coreDifference(ship.r, travelAngle);
            if (Math.abs(diff) >= 15) {
                
                ship.send(target);
                amount--;
            }
        }
    }
    
    // If we still need more, then get some of the others
    if (!readyOnly) {
        for(var i = 0; i < ships.length; i++) {
            var ship = ships[i];
            if (amount > 0 && !ship.traveling && !ship.nextPlanet) {
                ship.send(target);
                amount--;
            }
        }
    }
};

Planet.prototype.stop = function(player, type, to) {
    if (to) {
        for(var i = 0, l = this.$.ships.length; i < l; i++) {
            var ship = this.$.ships[i];
            if (ship.targetPlanet === this) {
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

Planet.prototype.getPlayerTypeShipCount = function(player, type) {
    return this.ships[player.id][type].length;
};

Planet.prototype.getHumanShips = function() {
    var count = 0;
    for(var id in this.ships) {
        if (id != this.$.neutralPlayer.id) { // DO!!! Type conversion
            count += this.ships[id]['fight'].length
                     + this.ships[id]['def'].length
                     + this.ships[id]['bomb'].length;
            
        }
    }
    return count;
};

Planet.prototype.getShipReadyCount = function(player, type) {
    var count = 0;
    var ships = this.ships[player.id][type];
    for(var i = 0, l = ships.length; i < l; i++) {
        if (!ships[i].traveling && !ships[i].nextPlanet) {
            count++;
        }
    }
    return count;
};

// Factories -------------------------------------------------------------------
Planet.prototype.getPlayerFactoryCount = function(player) {
    var count = 0;
    for(var i in this.factories) {
        if (this.factories[i].player === player) {
            count++;
        }
    }
    return count;
};

Planet.prototype.getPlayerCompleteFactoryCount = function(player) {
    var count = 0;
    for(var i in this.factories) {
        var f = this.factories[i];
        if (f.player === player && f.build) {
            count++;
        }
    }
    return count;
};

Planet.prototype.getPlayerFactoryTypeCount = function(player, type) {
    var count = 0;
    for(var i in this.factories) {
        var f = this.factories[i];
        if (f.player === player && f.type === type) {
            count++;
        }
    }
    return count;
};


// Direction -------------------------------------------------------------------
Planet.prototype.getPreferedDirection = function(player, type, travelAngle) {
    var min = 999;
    var factoryR = 999;
    for(var i in this.factories) {
        var f = this.factories[i];
        if (f.player === player && !f.build && f.type == type) {
            var r = this.$.coreDifference(travelAngle, f.r);
            if (Math.abs(r) > 30 && Math.abs(r) < min) {
                min = Math.abs(r);
                factoryR = r;
            }
        }
    }
    if (factoryR !== 999) {
        return factoryR > 0 ? 1 : -1
    }
    
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

