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
    this.health = 100;
    this.type = type;
    this.shipsNeeded = 10;
    this.shipsTaken = complete ? this.shipsNeeded : 0;
    this.build = complete;
    
    this.rateStep = 30;
    this.rate = 140;
    
    if (complete) {
        this.planet.factoryCompleteCount++;
    }
    this.planet.factoryCount++;
    planet.factoryID++;
}
exports.Factory = Factory;


// Stuff -----------------------------------------------------------------------
Factory.prototype.produce = function(modifier) {
    if (!this.build) {
        if (this.getTick() % 4 === 0) {
            this.callShip();
        }
    
    } else {
        var maxCount = this.player.id === 0 ? this.planet.maxCount * 0.5 : this.planet.maxCount; 
        this.rateStep++;
        
        if (this.player.shipCount < this.player.shipMaxCount) {
            if (this.planet.getPlayerShipCount(this.player) < maxCount) {
                var typeCount = (maxCount / this.planet.factoryCount)
                                * this.planet.getPlayerFactoryTypeCount(this.player, this.type);
                
                if (this.planet.getPlayerTypeShipCount(this.player, this.type) < typeCount) {
                    var rate = this.planet.spawnShipCount > 0 ? 30 : this.rate * modifier;
                    if (this.rateStep >= Math.floor(rate)) {
                        this.planet.createShip(this.type, this.player, this.r, false);
                        this.rateStep = 0;
                    }
                }
            }
        }
    }
};


// Ships -----------------------------------------------------------------------
Factory.prototype.addShip = function(ship) {
    this.shipsTaken++;
    ship.destroy();
    
    if (this.shipsTaken === this.shipsNeeded) {
        this.build = true;
        this.health = 100;
        this.rateStep = 0;
        this.planet.factoryCompleteCount++;
        this.planet.checkPlayer(true);
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
            var ship = ships[i];
            var diff = this.$.coreDifference(ship.r, this.r);
            if ((ship.direction === 1 && diff > 0)
                || (ship.direction === -1 && diff < 0)) {
                
                if (Math.abs(diff) > 15 && Math.abs(diff) <= 30) {
                    if (ship.land(this)) {
                        get--;
                        if (get === 0) {
                            break;
                        }
                    }
                }
            }
        }
    }
};

Factory.prototype.destroy = function(noCheck) {
    if (this.planet.factories[this.id]) {
        this.health = 0;
        this.planet.factoryCount--;
        if (this.build) {
            this.planet.factoryCompleteCount--;
        }
        this.planet.factoriesDestroyed.push(this.id);
        delete this.planet.factories[this.id];
        if (!noCheck) {
            this.planet.checkPlayer();
        }
    }
};


// Helpers ---------------------------------------------------------------------
Factory.prototype.getTick = function() {
    return this.$.getTick();
};

