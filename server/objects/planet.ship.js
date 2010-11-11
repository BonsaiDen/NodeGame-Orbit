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


// Orbit Planet Ships ----------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    addShip: function(ship) {
        this.playerShips.get(ship.player).add(ship);
        this.ships.add(ship);
    },
    
    removeShip: function(ship) {
        this.playerShips.get(ship.player).remove(ship);
        this.ships.remove(ship);
    },
    
    initShips: function() {
        if (this.player.isHuman()) {
            this.shipSpawn = 5;
        
        } else {
            this.shipSpawn = Math.floor(this.shipMax / 5);
        }
    },
    
    sendShips: function(player, targetPlanet, count, readyOnly) {
        var ships = this.getNearestShips(player, this.angleBetween(targetPlanet));
        ships.each(function(ship) {
            if (!ship.isTraveling && !ship.targetFactory && !ship.isLanding
                && !ship.targetPlanet && ship.inOrbit) {
                
                var diff = ship.angleDifference(this.angleBetween(targetPlanet));
                if (Math.abs(diff) / ship.getRotationSpeed() > 20) {
                    if (ship.calculateTravelRoute(targetPlanet)) {
                        count--;
                        if (count === 0) {
                            return true;
                        }   
                    }
                }
            }
        }, this);
        
        if (!readyOnly && count > 0) {
            ships.each(function(ship) {
                if (!ship.isTraveling && !ship.isLanding && !ship.nextPlanet) {
                    if (ship.calculateTravelRoute(targetPlanet)) {
                        count--;
                        if (count === 0) {
                            return true;
                        }
                    }
                }
            }, this);
        }
    },
    
    sendShipsToPlanet: function(ships, planet, count, readyOnly) {
        ships.each(function(ship) {
            if (count > 0 && ship.sendToPlanet(planet, readyOnly)) {
                count--;
            
            } else if (count === 0) {
                return true;
            }
        });
        return count;
    },
    
    getNearestShips: function(player, angle) {
        return this.playerShips.get(player).sort(function(a, b) {
            var ra = a.direction === 1
                        ? ((a.angle + a.rspeed) - angle + 360) % 360
                        : (angle - (a.angle - a.rspeed) + 360) % 360;
        
            var rb = b.direction === 1
                        ? ((b.angle + b.rspeed) - angle + 360) % 360
                        : (angle - (b.angle - b.rspeed) + 360) % 360;
            
            return rb - ra;
        });
    },
    
    getShipReadyCount: function(player) {
        var count = 0;
        this.playerShips.get(player).each(function(ship) {
            if (ship.isReady()) {
                count++;
            }
        }, this);
        return count;
    },
    
    getPlayerShipCount: function(player) {
        return this.playerShips.get(player).length;
    },
    
    stopShips: function(player) {
        this.playerShips.get(player).each(function(ship) {
            ship.stop(false);
        });
    },
    
    stopShipsTo: function(player) {
        player.ships.each(function(ship) {
            if (ship.isTargeting(this)) {
                ship.stop(true);
            }
        }, this);
    },
    
    shipOrbitDistance: function(ship, otherPlanet) {
        return this.surfacecDistance(otherPlanet) - ship.orbit * 2;
    },
    
    shipMaximum: function(player) {
        return this.playerShips.get(player).length >= this.shipMax;
    },
    
    removeAllShips: function() {
        this.ships.each(function(ship) {
            ship.destroy();
        });
    }
};

