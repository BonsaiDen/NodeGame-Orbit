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


// Factory ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Factory(planet, r, player, type, complete) {
    this.planet = planet;
    this.$ = this.planet.$;
    this.player = player;
    this.id = planet.factoryID;
    this.typeID = this.$.factoryTypes.indexOf(type);
    this.planet.factories[this.id] = this;
    
    this.updated = false;
    this.r = r;
    this.health = 50;
    this.type = type;
    this.shipsNeeded = 5;
    this.shipsTaken = complete ? this.shipsNeeded : 0;
    this.build = complete;
    
    this.rateStep = 0;
    this.rate = this.player === this.$.neutralPlayer ? 400 : 50;
    
    this.planet.factoryCount++;
    planet.factoryID++;
}
exports.Factory = Factory;


// Stuff -----------------------------------------------------------------------
Factory.prototype.produce = function(modifier) {
    if (!this.build) {
        if (this.getTick() % 10 === 0) {
            this.callShip();
        }
    
    } else {
        var maxCount = this.player.id === 0 ? this.planet.maxCount * 0.5 : this.planet.maxCount; 
        this.rateStep++;
        if (this.player.shipCount < this.player.shipMaxCount) {
            if (this.planet.getPlayerShipCount(this.player) < maxCount) {
                var rate = this.planet.spawnShipCount > 0 ? 20 : this.rate * modifier;
                if (this.rateStep >= Math.floor(rate)) {
                    this.planet.createShip(this.type, this.player, this.r, false);
                    this.rateStep = 0;
                }
            }
        }
    }
};

Factory.prototype.addShip = function(ship) {
    this.shipsTaken++;
    ship.destroy();
    
    if (this.shipsTaken === this.shipsNeeded) {
        this.build = true;
        this.planet.checkPlayer();
    }
    this.updated = true;
};

Factory.prototype.callShip = function() {
    var ships = this.planet.ships[this.player.id][this.type];
    var needed = this.shipsNeeded - this.shipsTaken;
    var calling = 0;
    for(var i = 0, l = ships.length; i < l; i++) {
         if (ships[i].landFactory === this) {
            calling++;
         }
    }
    
    var get = needed - calling;
    if (get > 0) {
        ships.sort(function(a, b) {
            var ra = a.direction === 1 ? ((a.r + a.rs) - this.r + 360) % 360
                                       : (this.r - (a.r - a.rs) + 360) % 360;
        
            var rb = b.direction === 1 ? ((b.r + b.rs) - this.r + 360) % 360
                                       : (this.r - (b.r - b.rs) + 360) % 360;
            
            return rb - ra;
        });
        for(var i = 0, l = ships.length; i < l; i++) {
            var diff = this.$.coreDifference(this.r, ships[i].r);
            if (Math.abs(diff) < 90 / this.planet.maxFactories) {
                if (ships[i].land(this)) {
                    get--;
                    if (get === 0) {
                        break;
                    }
                }
            }
        }
    }
};

Factory.prototype.destroy = function() {
    if (this.planet.factories[this.id]) {
        this.planet.factoryCount--;
        this.planet.factoriesDestroyed.push(this.id);
        this.planet.checkPlayer();
        delete this.planet.factories[this.id];
    }
};


// Helpers ---------------------------------------------------------------------
Factory.prototype.getTick = function() {
    return this.$.getTick();
};

