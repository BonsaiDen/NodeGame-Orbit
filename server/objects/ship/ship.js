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


// Orbit Ship ------------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitShip(planet, player, angle) {
    this.game = planet.game;
    this.id = this.game.shipID++;
    this.player = player;
    
    planet.addShip(this);
    this.player.ships.add(this);
    this.game.ships.add(this);
    this.updated = false;
    this.destroyed = false;
    
    // Angles
    this.offsetAngle = angle;
    this.angle = angle;
    this.travelAngle = -1;
    this.rspeed = 0;
        
    // Planets
    this.planet = planet;
    this.targetPlanet = null;
    this.nextPlanet = null;
    this.movePlanets = [];
    
    // Travel
    this.isTraveling = false;
    this.hasTraveled = false;
    this.travelTicks = 0;
    this.arriveTick = 0;
    
    // Landing
    this.targetFactory = null;
    this.isLanding = false;
    this.landingTick = 0;
    
    // Orbit
    this.inOrbit = false;
    this.orbit = 0;
    
    // Others
    this.health = this.game.shipHealth; 
    this.hasStopped = false;
    this.hasAttacked = false;   
    this.direction = this.planet.getBestDirection(this.player, this.angle);    
    this.offsetTick = this.getTick();
}
exports.object = OrbitShip;


// Prototype -------------------------------------------------------------------
OrbitShip.extend('objects/ship/angle', 'objects/ship/network',
                 'objects/ship/travel', 'objects/ship/helper',
                 'objects/ship/landing');

OrbitShip.extend({
    
    tick: function() {
        this.hasAttacked = false;
        
        // Orbit & Angle
        if (!this.isTraveling) {
            this.rspeed = this.getRotationSpeed();
            this.calculateOrbit();
        }
        
        // Start isLanding
        if (this.targetFactory) {
            this.checkLanding();
        }
        
        // Start traveling
        if (this.inOrbit && this.nextPlanet !== null && !this.isTraveling) {
            this.checkTravel()
        }
        
        // Finish traveling
        if (this.isTraveling && this.getTick() === this.arriveTick) {
            this.finishTravel();
        }
    },
    
    destroy: function() {
        this.planet.removeShip(this);
        this.player.ships.remove(this);
        this.destroyed = true;
    },
    
    reset: function() {
        if (this.updated) {
            this.hasTraveled = false;
        }
        this.updated = false;
        this.hasStopped = false;
        this.destroyed = false;
    },
    
    // Combat ------------------------------------------------------------------
    attackShip: function(otherShip) {
        if (!this.hasAttacked && otherShip.isAlive()) {
            otherShip.damage(this.game.shipToShipDamage);
        }
    },
    
    attackPlanetFactories: function(planet) {
        if (!this.hasAttacked && this.isAlive()) {
            planet.factories.each(function(factory) {
                if (this.player !== factory.player && factory.isAlive()) {
                    var angle = Math.abs(this.angleDifference(factory.angle));
                    if (angle <= this.getRotationSpeed() * 5) {
                        factory.damage(this.game.shipToFactoryDamage);
                        return true;
                    }
                }
            }, this);
        }
    },
    
    damage: function(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    },
    
    // Commands ----------------------------------------------------------------    
    landAtFactory: function(factory) {
        if (!this.nextPlanet && !this.isTraveling && this.inOrbit
            && !this.targetFactory && !this.isLanding) {
            
            this.targetFactory = factory;
            return true;
        
        } else {
            return false;
        }
    },

    stop: function(to) {
        if (this.nextPlanet && !this.isTraveling) {
            this.nextPlanet = this.targetPlanet = null;
            this.hasStopped = true;
            this.update();
        
        } else if (to && this.targetPlanet && this.isTraveling) {
            this.targetPlanet = this.nextPlanet;
        }
    },
    
    // Helpers -----------------------------------------------------------------
    isAlive: function() {
        return this.health >= 0
    },
    
    isReady: function() {
        return this.isHalfReady() && !this.targetFactory;
    },
    
    isHalfReady: function() {
        return this.isControlable() && !this.targetPlanet;
    },
    
    isControlable: function() {
        return !this.isLanding && !this.isTraveling;
    },
    
    isTargeting: function(planet) {
        return planet === this.targetPlanet;
    },
    
    isHuman: function() {
        return this.player.isHuman();
    },
    
    isNeutral: function() {
        return this.player.isNeutral();
    },
    
    getTick: function() {
        return this.game.getTick();
    },
    
    log: function(msg) {
        var ship = 'Ship #' + this.id;
        this.player.log('[' + ship + '] ' + msg);
    }
});

