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


// Ships -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Ship(game, type, planet, player, r, dir) {
    this.$ = game;
    this.id = this.$.shipID++;
    this.player = player;
    this.type = type;
    this.typeID = {fight: 0, bomb: 1, def: 2}[this.type];
    this.health = this.$.shipHealth[this.type];
    
    this.lastTick = this.getTick();
    
    this.x = 0;
    this.y = 0;
    this.rs = 0;
    this.r = r;
    this.orbit = 0;
    
    this.inOrbit = false;
    this.direction = dir;
    this.planet = planet;
    
    this.targetPlanet = null;
    this.nextPlanet = null;
    this.movePlanets = [];
    
    this.travelAngle = -1;
    this.traveling = false;
    this.traveled = false;
    this.travelTicks = 0;
    this.arriveTick = 0;
}
exports.Ship = Ship;

Ship.prototype.destroy = function() {
    this.planet.removeShip(this);
    var ships = this.$.ships;
    var index = ships.indexOf(this);
    if (index !== -1) {
        ships.splice(index, 1);
    }
};


// Commands --------------------------------------------------------------------
Ship.prototype.send = function(target) {
    this.movePlanets = this.$.corePath(this.planet, target, this.player);
    if (this.movePlanets.length > 0) {
        this.targetPlanet = this.movePlanets[this.movePlanets.length - 1];
        this.nextPlanet = this.movePlanets[0];
        this.travelAngle = Math.round(this.$.coreAngle(this.planet,
                                                       this.nextPlanet));
        
        this.updated = true;
        return true;
    
    } else {
        this.targetPlanet = null;
        this.nextPlanet = null;
        return false;
    }
};

Ship.prototype.attack = function(other) {
    other.health -= this.$.shipDamage[this.type];
    if (other.health <= 0) {
        other.destroy();
    }
};

// Updates ---------------------------------------------------------------------
Ship.prototype.tick = function() {
    
    // Orbit & Angle
    if (!this.traveling) {
        var maxOrbit = this.$.shipOrbits[this.type];
        if (this.orbit < maxOrbit) {
            this.orbit += this.$.shipToOrbitSpeed[this.type];
            if (this.orbit >= maxOrbit) {
                this.orbit = maxOrbit;
                this.inOrbit = true;
                this.planet.addShip(this);
            }
        }
        
        this.rs = Math.round(Math.PI / this.planet.size * this.$.shipSpeed * 100) / 100;
        this.r = (this.r + this.direction * this.rs + 360) % 360;
    }
    
    // Start Traveling
    if (this.nextPlanet !== null && !this.traveling) {
        if (Math.abs(this.$.coreDifference(this.r, this.travelAngle)) < this.rs) {
            this.updated = true;
            this.lastTick = this.getTick();
            this.planet.removeShip(this);
            this.r = this.travelAngle;
            
            this.travelTicks = Math.ceil(this.$.coreOrbit(this, this.planet,
                                                          this.nextPlanet));
            
            this.arriveTick = this.getTick() + this.travelTicks;
            this.traveling = true;
            this.traveled = false;
        }
    }
    
    // Finish Traveling
    if (this.traveling && this.getTick() === this.arriveTick) {
        this.updated = true;
        this.traveling = false;
        this.traveled = true;
        this.planet = this.nextPlanet;
        
        this.lastTick = this.getTick();
        this.r = (this.r + 180) % 360;
        this.direction = this.direction === 1 ? -1 : 1;
        
        this.nextPlanet.addShip(this);
        if (this.nextPlanet === this.targetPlanet) {
            this.nextPlanet = this.targetPlanet = null;
        
        } else if (!this.send(this.targetPlanet, this.getTick())) {
            this.nextPlanet = this.targetPlanet = null;
        
        } else {
            var dr = this.$.coreDifference(this.r, this.travelAngle);
            this.direction = dr >= 0 ? 1 : -1;
        }
    }
    
    // Fight
    if (!this.traveling) {
        // this.planet.getNearbyShip
    }
};


// Helpers ---------------------------------------------------------------------
Ship.prototype.getTick = function() {
    return this.$.getTick();
};

