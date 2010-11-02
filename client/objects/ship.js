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
function Ship(game, id) {
    this.$ = game;
    
    this.type = 0;
    this.x = 0;
    this.y = 0;
    this.planet = null;
    this.id = id;
    this.player = null;;
    
    this.direction = 0;
    this.tickInit = 0;
    this.tickAngle = 0;
    
    this.or = 0;
    this.r = 0;
    this.rs = 0;
    this.orbit = 0;
    
    this.inOrbit = false;
    this.traveling = false;
    this.nextPlanet = null;
    this.travelTicks = 0;
    this.travelDistance = 0;
    this.arriveTick = 0;
}

Ship.prototype.destroy = function() {
    this.$.effectExplosion(this.player.color, this.planet, this.orbit, this.r, 9);
    this.planet.removeShip(this);
};


// Interpolation ---------------------------------------------------------------
Ship.prototype.tick = function() {
    if (!this.traveling) {
        var tickDiff = this.getTick() - this.tickAngle;
        var rs = Math.round(Math.PI / this.planet.size * this.$.shipSpeed * 100) / 100 
        this.r = (this.or + this.direction * rs * tickDiff + 360) % 360;
        
        tickDiff = this.getTick() - this.tickInit;
        if (!this.inOrbit) {
            this.orbit = tickDiff * this.$.shipToOrbitSpeed[this.type];
            if (this.orbit >= this.$.shipOrbits[this.type]) {
                this.inOrbit = true;
                this.orbit = this.$.shipOrbits[this.type];
            }
        
        } else {
            this.orbit = this.$.shipOrbits[this.type];
        }
    }
};

// Drawing ---------------------------------------------------------------------
Ship.prototype.draw = function() {
    this.calculatePosition();
    
    // inFlight
    if (this.nextPlanet) {
        this.$.drawShaded(this.player.color);
    
    // Stationed
    } else {
        this.$.drawColor(this.player.color);
    }
    this.$.drawWidth(1.5);
    this.$.drawCircle(this.x, this.y, 1, false);
};

Ship.prototype.attack = function(other) {
    this.$.effectExplosion(this.player.color, this.planet, other.orbit, other.r, 6);
};


// Helpers ---------------------------------------------------------------------
Ship.prototype.calculatePosition = function() {
    var orbit = this.orbit + this.planet.size;
    var r = this.r * Math.PI / 180;
    this.x = this.planet.x + Math.cos(r) * orbit;
    this.y = this.planet.y + Math.sin(r) * orbit;
    
    if (this.traveling) {
        var step = 100 / this.travelTicks;
        var delta = 1 - step * ((this.arriveTick - this.getTick()) / 100);
        r = this.travelAngle * Math.PI / 180;
        this.x += Math.cos(r) * this.travelDistance * delta;
        this.y += Math.sin(r) * this.travelDistance * delta;
    }
};

Ship.prototype.getTick = function() {
    return this.$.getTick();
};

