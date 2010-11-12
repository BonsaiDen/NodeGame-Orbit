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


// Orbit Planet ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitPlanet(game, id, x, y, size, nodes, shipMax, factoryMax, start) {
    this.game = game;
    this.id = id;
    this.game.planets.add(this);
    this.updated = false;
    
    this.x = x;
    this.y = y;
    this.size = size;
    
    this.playerStart = start;
    this.player = null;
    this.playerShips = new HashList();
    this.enemyShips = new HashList();
    
    this.planetNodesIDS = nodes;
    this.planetNodes = new HashList();
    this.planetDistances = {};
    
    this.factories = new HashList();
    this.factoriesComplete = new HashList();
    this.factoryAngle = Math.floor(360 * Math.random());
    this.factoryMax = factoryMax;
    
    this.ships = new HashList();
    this.shipMax = shipMax;
    this.shipSpawn = 0;
    
    this.neutralTick = 0;
    this.neutralAttacked = false;
    this.neutralBorder = false;
}
exports.object = OrbitPlanet;


// Prototype -------------------------------------------------------------------
OrbitPlanet.extend('objects/planet/factory', 'objects/planet/ship',
                   'objects/planet/ai');

OrbitPlanet.extend({
    
    tick: function() {
        if (this.isNeutral() && this.getTick() % 45 === 0 && Math.random() > 0.7) {
            this.tickAI();
        }
        
        if (this.getTick() % this.game.planetCombatTickRate === 0) {
            this.tickCombat();
        }
    },
    
    initPlayer: function(player, start) {
        if (player !== this.player) {
            if (this.player) {
                this.player.planets.remove(this);
                this.player.shipMax -= this.shipMax;
            }
            
            this.player = player;
            this.player.planets.add(this);
            this.player.shipMax += this.shipMax;
            this.neutralTick = Math.floor(this.getTick() + 250 + (500 * Math.random()));
            this.updateEnemyShips();
            
            if (start) {
                this.removeAllShips();
                this.removeAllFactories();
                this.initFactories();
                this.initShips();
            
            } else {
                this.log('Now owned by Player #' + this.player.id);
            }
            this.update();
        }
    },
    
    makeNeutral: function() {
        this.removeFactories(this.player);
        this.initPlayer(this.game.playerNeutral, false);
    },
    
    initNodes: function() {
        var that = this;
        this.planetNodesIDS.forEach(function(node, i) {
            that.planetNodes.add(that.game.planets.get(node));
        });
    },
    
    // Distances ---------------------------------------------------------------
    getPlanetDistance: function(otherPlanet, direction) {
        if (otherPlanet.id in this.planetDistances) {
            return this.planetDistances[otherPlanet.id];
        }
        return false;
    },
    
    setPlanetDistance: function(otherPlanet, distance) {
        this.planetDistances[otherPlanet.id] = distance;
    },
    
    // Directions --------------------------------------------------------------
    getBestDirection: function(player, targetAngle) {
        if (player === this.player && this.enemyShips.length > 0) {
            return this.getBestShipFightDirection(targetAngle);
        
        } else {
            var dir = this.getBestFactoryDirection(player, targetAngle);
            if (dir === 0) {
                dir = this.getBestShipDirection(player, targetAngle);
            }
            return dir;
        }
    },
    
    getBestShipFightDirection: function(targetAngle) {
        return this.getShipsDirection(this.enemyShips, targetAngle);
    },
    
    getBestShipDirection: function(player, targetAngle) {
        return this.getShipsDirection(this.playerShips.get(player), targetAngle);
    },
    
    getShipsDirection: function(ships, targetAngle) {
        var left = 0, right = 0;
        ships.each(function(ship) {
            if (ship.direction === 1) {
                left++;
            
            } else {
                right++;
            }
        });
        return left >= right ? -1 : 1;
    },
    
    getBestFactoryDirection: function(player, targetAngle) {
        var minAngle = 361;
        var factoryAngle = 361;
        this.factories.each(function(factory) {
            if (factory.player === player && factory.isBuilding()) {
                var angle = factory.angleDifference(targetAngle);
                var pAngle = Math.abs(angle);
                if (pAngle > 30 && pAngle < minAngle) {
                    minAngle = pAngle;
                    factoryAngle = angle;
                }
            }
        });
        
        if (factoryAngle !== 361) {
            return factoryAngle > 0 ? -1 : 1;
        
        } else {
            return 0;
        }
    },
    
    // Combat ------------------------------------------------------------------
    tickCombat: function() {
        if (this.ships.length === 0) {
            return;
        
        } else if (this.playerShips.get(this.player).length === this.ships.length) {
            if (this.factories.length === this.getFactoryCount(this.player)) {
                return false;
            }
        }
        
        this.ships.sort(function(a, b) {
            return a.angle < b.angle;
        
        }).eachEach(function(shipA) {
            return shipA.inOrbit && shipA.isAlive() && !shipA.isTraveling; 
        
        }, function(shipA, shipB) {
            if (!shipB.isTraveling && shipB.isAlive()
                && shipA.player !== shipB.player) {
                
                var angle = Math.abs(shipA.angleDifference(shipB.angle));
                if (angle < shipA.getRotationSpeed() * 7) {
                    shipA.attackShip(shipB);
                    shipB.attackShip(shipA);
                    return true;
                }
            
            } else {
                return true;
            }
        
        }, function(shipA) {
            shipA.attackPlanetFactories(this);
        }, this);
    },
    
    // Network -----------------------------------------------------------------
    update: function() {
        this.updated = true;
    },
    
    initMessage: function() {
        return [this.id, this.x, this.y, this.size, this.player.id,
                this.shipMax, this.planetNodesIDS, this.factoryMax,
                this.factoryAngle];
    },
    
    updateMessage: function() {
        return [this.id, this.player.id, this.shipMax];
    },
    
    initStructMessage: function() {
        var msg = new Struct();
        msg.writeInt8(this.id).writeInt16(this.x).writeInt16(this.y);
        msg.writeInt8(this.size).writeInt8(this.player.id);
        msg.writeInt8(this.shipMax);
        msg.writeInt8Array8(this.planetNodesIDS);
        msg.writeInt8(this.factoryMax).writeDeg(this.factoryAngle);
        return msg;
    },
    
    updateStructMessage: function() {
        var msg = new Struct();
        msg.writeInt8(this.id).writeInt8(this.player.id).writeInt8(this.shipMax);
        return msg;
    },
    
    // Helpers -----------------------------------------------------------------
    angleBetween: function(otherPlanet) {
        return this.game.angleBetween(this, otherPlanet);
    },
    
    surfaceDistance: function(otherPlanet) {
        return this.game.distanceBeweetn(this, otherPlanet)
               - this.size - otherPlanet.size;
    },  
    
    isStartable: function() {
        return this.playerStart && this.isNeutral();
    },
    
    isNeutral: function() {
        return this.player.isNeutral();
    },
    
    getTick: function() {
        return this.game.getTick();
    },
    
    log: function(msg) {
        this.game.log('[Planet #' + this.id + '] ' + msg);
    }
});

