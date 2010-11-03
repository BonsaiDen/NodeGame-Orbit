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
    this.player = null;
    
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
    this.player.shipCount--;
    this.$.effectExplosion(this.player.color, this.planet, this.orbit, this.r, 8);
    this.planet.removeShip(this);
};


// Interpolation ---------------------------------------------------------------
Ship.prototype.tick = function() {
    if (!this.traveling) {
        var tickDiff = this.getTick() - this.tickAngle;
        var rs = Math.round(Math.PI / this.planet.size * this.$.shipSpeed * 100) / 100;
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
Ship.prototype.clear = function(sx, sy) {
    
    if (this.$.shipVisbile(this, sx, sy)) {
        this.$.fbg.clearRect(this.x - 3 - sx, this.y - 3 - sy, 6, 6);
    }
};

Ship.prototype.draw = function(sx, sy) {
    this.calculatePosition();
    if (this.$.shipVisbile(this, sx, sy)) {
        
        // inFlight
        if (this.nextPlanet) {
            this.$.drawShaded(this.player.color);
        
        // Stationed
        } else {
            this.$.drawColor(this.player.color);
        }
        
        this.$.drawCircle(this.x, this.y, 1.5, true);
    }
};

Ship.prototype.attack = function(other) {
    this.$.effectExplosion(this.player.color, this.planet,
                           other.orbit, other.r, 4);
    
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


// Newtwork --------------------------------------------------------------------
Ship.prototype.initTravel = function(pid, r, arrive, travel) {
    this.planet.removeShip(this);
    this.orbit = this.$.shipOrbits[this.type];
    this.nextPlanet = this.$.planets[pid];
    this.r = this.or = r;
    this.tickAngle = this.getTick();

    this.arriveTick = arrive;
    this.travelTicks = travel;
    this.travelDistance = this.$.coreOrbit(this, this.planet, this.nextPlanet);
    this.travelAngle = Math.round(this.$.coreAngle(this.planet, this.nextPlanet));
};

Ship.prototype.finishTravel = function(pid, or) {
    this.planet.removeShip(this);
    this.planet = this.$.planets[pid];
    this.planet.addShip(this);
    this.r = this.or = or;
    this.tickAngle = this.getTick();
    if (!this.next) {
        this.nextPlanet = null;
    }
};

Ship.prototype.update = function(d) {
    this.traveling = !!(d[0] & 2);
    this.inOrbit = !!(d[0] & 4);
    this.next = !!(d[0] & 16);
    this.traveled = !!(d[0] & 32);
    this.direction = (d[0] & 64) ? 1 : -1;
        
    // Create
    if (d[0] & 1) {
        this.type = this.$.shipTypes[d[2]];
        this.planet = this.$.planets[d[3]];
        this.player = this.$.players[d[4]];
        this.player.shipCount++;
        
        this.tickInit = d[5];
        this.tickAngle = this.getTick();
        this.or = d[6];
        this.planet.addShip(this);
        
        // Already traveling
        if (this.next && this.traveling) {
            this.initTravel(d[7], d[6], d[8], d[9]);
        
        // Already sent
        } else if (this.next) {
            this.nextPlanet = this.$.planets[d[7]];
        }
    
    // Send // Arrive
    } else if (d[0] & 8) {
        
        // Sent
        if (this.next && !this.traveling) {
            this.planet.addShip(this);
            this.nextPlanet = this.$.planets[d[2]];
            
            // Has just finished traveling
            if (this.traveled) {
                this.finishTravel(d[3], d[4]);
            }
        
        // Start Travel
        } else if (this.next && this.traveling) {
            this.initTravel(d[2], d[3], d[4], d[5]);
        
        // Finish travel
        } else {
            this.finishTravel(d[2], d[3]);
        }
    
    // Sync
    } else {
        this.or = d[2];
        this.tickAngle = this.getTick();
    }
};

