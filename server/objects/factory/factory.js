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
var HashList = importLib('hashlist');
var Struct = importLib('struct');
var OrbitShip = importObject('ship');


// Orbit Planet ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitFactory(planet, player, angle, build) {
    this.planet = planet;
    this.game = this.planet.game;
    this.id = this.game.factoryID++;
    this.player = player;
    
    this.game.factories.add(this);
    this.planet.factories.add(this);
    this.player.factories.add(this);
    if (build) {
        this.planet.factoriesComplete.add(this);
    }
    
    this.updated = false;
    this.destroyed = false;
    
    this.health = this.game.factoryHealth;
    this.angle = angle;
    this.build = build;
    this.produceRate = 140;
    this.produceStep = 140;
    
    this.shipsRequired = 7;
    this.shipsUsed = build ? this.shipsRequired : 0;
    this.callingShips = 0;
}
exports.object = OrbitFactory;


// Prototype -------------------------------------------------------------------
OrbitFactory.prototype = {
    
    tick: function() {
        if (this.destroyed) {
            return;
        
        } else if (!this.build) {
            if (this.getTick() % 4 === 0) {
                this.callShip();
            }
        
        } else {
            this.produceStep++;
            this.produce(); 
        }
    },
    
    produce: function() {
        if (this.produceStep >= Math.floor(this.getProductionRate())) {
            if (!this.player.shipMaximum()
                && !this.planet.shipMaximum(this.player)) {
                
                if (this.planet.shipSpawn > 0) {
                    this.planet.shipSpawn--;
                }
                new OrbitShip(this.planet, this.player, this.angle);
            }
            this.produceStep = 0;
        }
    },
    
    getProductionRate: function() {
        return this.planet.shipSpawn > 0 ? 30
               : this.produceRate * this.player.getProductionModifier();
    },
    
    damage: function(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy(false);
        }
    },
    
    destroy: function(ingoreCheck) {
        this.destroyed = true;
        this.planet.factories.remove(this);
        this.planet.factoriesComplete.remove(this);
        this.player.factories.remove(this);
        
        if (this.build && !ingoreCheck) {
            this.planet.checkFactoryTakeover(false);
        }
    },
    
    // Ships -------------------------------------------------------------------
    callShip: function() {
        var ships = this.getNearestShips();
        var neededShips = this.shipsRequired - this.shipsUsed;
        this.callingShips = 0;
        ships.each(function(ship) {
            if (ship.targetFactory === this) {
                this.callingShips++;
                if (this.callingShips > neededShips) {
                    ship.targetFactory = null;
                }
            }
        }, this);
        
        var additionalShips = neededShips - this.callingShips;
        if (additionalShips > 0) {
            ships.each(function(ship) {
                if (!ship.targetFactory
                    && ship.inAngleDifference(this.angle, 20, 30)) {
                    
                    if (ship.landAtFactory(this)) {
                        additionalShips--;
                        if (additionalShips === 0) {
                            return true;
                        }
                    }
                }
            }, this);
        }
    },
    
    getNearestShips: function() {
        return this.planet.getNearestShips(this.player, this.angle);
    },
    
    useShip: function(ship) {
        if (!this.build) {
            ship.destroy();
            this.shipsUsed++;
            if (this.shipsUsed === this.shipsRequired) {
                this.build = true;
                this.health = this.game.factoryHealth;
                this.produceStep = 0;
                this.planet.factoriesComplete.add(this);
                this.planet.checkFactoryTakeover(true);
            }
            this.update();
        }
    },
    
    // Network -----------------------------------------------------------------
    update: function() {
        this.updated = true;
    },
    
    createMessage: function() {
        return [this.planet.id, this.id, this.angle, this.player.id,
                this.shipsUsed, this.shipsRequired];
    },
    
    updateMessage: function() {
        return [this.planet.id, this.id, this.shipsUsed];
    },
    
    destroyMessage: function() {
        return [this.planet.id, this.id];
    },
    
    createStructMessage: function() {
        return [this.planet.id, this.id, this.angle, this.player.id,
                this.shipsUsed, this.shipsRequired];
    },
    
    updateStructMessage: function() {
        var msg = new Struct();
        msg.writeInt8(this.planet.id).writeInt16(this.id);
        msg.writeInt8(this.shipsUsed);
        return msg;
    },
    
    destroyStructMessage: function() {
        return new Struct().writeInt8(this.planet.id).writeInt16(this.id);
    },
    
    // Helpers -----------------------------------------------------------------
    isAlive: function() {
        return this.health >= 0
    },
    
    isBuild: function() {
        return this.build;
    }, 
    
    isBuilding: function() {
        return !this.build;
    },
    
    needsShips: function() {
        return this.callingShips < (this.shipsRequired - this.shipsUsed);
    },
    
    requiredCount: function() {
        return this.shipsRequired;
    },
    
    angleDifference: function(angle) {
        return this.game.angleDifference(this.angle, angle);
    },
    
    isNeutral: function() {
        return this.player.isNeutral();
    },
    
    getTick: function() {
        return this.game.getTick();
    },
    
    log: function(msg) {
        var factory = 'Factory #' + this.id + ' of Player #' + this.player.id;
        this.planet.log('[' + factory + ']: ' + msg);
    }
};

