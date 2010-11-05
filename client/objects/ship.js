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
    this.tickOffset = 0;
    this.attacked = false;
    
    this.or = 0;
    this.r = 0;
    this.rs = 0;
    this.orbit = 0;
    
    this.inOrbit = false;
    this.landing = false;
    this.traveling = false;
    this.nextPlanet = null;
    this.travelTicks = 0;
    this.travelDistance = 0;
    this.arriveTick = 0;
    this.stopped = false;
    
    this.$.shipList.push(this);
}

Ship.prototype.destroy = function() {
    var index = this.$.shipList.indexOf(this);
    if (index !== -1) {
        this.player.shipCount--;
        if (!this.traveling) {
            this.$.effectExplosion(this.player.color, this.planet, this.orbit, this.r, this.rs, 8);
            this.planet.removeShip(this);
        }
        this.$.shipList.splice(index, 1);
        this.$.shipDestroyedList.push(this);
    }
};


// Interpolation ---------------------------------------------------------------
Ship.prototype.tick = function() {
    this.attacked = false;
    if (!this.traveling) {
        var tickDiff = this.getTick() - this.tickOffset;
        if (!this.inOrbit) {
            this.orbit = tickDiff * this.$.shipToOrbitSpeed[this.type];
            
            if (this.orbit >= this.$.shipOrbits[this.type]) {
                this.inOrbit = true;
                this.orbit = this.$.shipOrbits[this.type];
            }
        
        } else {
            this.orbit = this.$.shipOrbits[this.type];
        }
        
        this.rs = this.getRotationSpeed();
        this.r = this.wrapAngle(this.or + this.direction * this.rs * tickDiff);
    }
};

// Drawing ---------------------------------------------------------------------
Ship.prototype.clear = function(sx, sy) {
    if (this.$.shipVisbile(this, sx, sy)) {
        if (this.type === 'fight') {
            this.$.fbg.clearRect(this.x - 4 - sx, this.y - 4 - sy, 8, 8);
        
        } else if (this.type === 'def') {
            this.$.fbg.clearRect(this.x - 3 - sx, this.y - 3 - sy, 6, 6);
        }
    }
};

Ship.prototype.draw = function(sx, sy) {
    this.calculatePosition();
    if (this.$.shipVisbile(this, sx, sy)) {
        
        // inFlight
        if (this.nextPlanet) {
            this.$.drawDark(this.player.color);
        
        // Stationed
        } else {
            this.$.drawColor(this.player.color);
        }
        
        // Spawn Alpha
        var orbitDiff = 1 / this.$.shipOrbits[this.type]
                        * (this.$.shipOrbits[this.type] - this.orbit);
        
        this.$.drawAlpha(Math.max(1 - orbitDiff, 0));
        
        // Defender
        if (this.type === 'def') {
            this.$.drawCircle(this.x, this.y, 1.5, true);
        
        // Fighter
        } else {
            var r = 0;
            if (!this.traveling) {
                if (this.direction === 1) {
                    r = this.r * Math.PI / 180 - (Math.PI / 2 * orbitDiff);
                
                } else {
                    r = this.r * Math.PI / 180 - Math.PI
                        + (Math.PI / 2 * orbitDiff);
                }
            } else {
                r = this.r * Math.PI / 180 + Math.PI / 2;
            }
            
            this.$.fbg.save();
            this.$.fbg.translate(this.x, this.y);  
            this.$.fbg.rotate(r);
            this.$.fbg.beginPath();
            this.$.fbg.moveTo(0, 2.5);
            this.$.fbg.lineTo(-2, -2.5);
            this.$.fbg.lineTo(2, -2.5);
            this.$.fbg.lineTo(0, 2.5);
            this.$.fbg.closePath();
            this.$.fbg.fill();
            this.$.fbg.restore();
        }
        
        this.$.drawAlpha(1);
    }
};

Ship.prototype.attack = function(other) {
    if (!this.attacked) {
        this.$.effectExplosion(this.player.color, this.planet,
                               other.orbit, other.r, other.rs, 4);
    }
    this.attacked = false;
};


// Helpers ---------------------------------------------------------------------
Ship.prototype.calculatePosition = function() {
    if (!this.traveling) {
        var orbit = Math.max(this.orbit, 3) + this.planet.size;
        var r = this.r * Math.PI / 180;
        this.x = this.planet.x + Math.cos(r) * orbit;
        this.y = this.planet.y + Math.sin(r) * orbit;
        return;
    }
    
    // Bezier curve thingy between planets
    this.rs = this.getRotationSpeed();
    var a = this.getPointInOrbit(this.planet, this.or, 0);
    var b = this.getPointInOrbit(this.planet, this.travelAngle, 2);
    
    var c = this.getPointInOrbit(this.nextPlanet, (this.travelAngle + 180) % 360, 2);
    var d = this.getPointInOrbit(this.nextPlanet, (this.travelAngle + 180 + this.rs * 20 * this.direction) % 360, 0);
    
    var step = 100 / this.travelTicks;
    var delta = 1 - step * ((this.arriveTick - this.getTick()) / 100);
    this.bezier(this, a, b, c, d, Math.max(0.00, Math.min(delta, 0.99)));
    
    var p = {x: 0, y: 0};
    this.bezier(p, a, b, c, d, Math.max(0.01, Math.min(delta + 0.01, 1)));
    
    var dx = this.x - p.x, dy = this.y - p.y;
    this.r = this.wrapAngle(Math.atan2(dy, dx) * 180 / Math.PI);
};

Ship.prototype.getPointInOrbit = function(planet, r, e) {
    var orbit = Math.max(this.orbit, 3) + planet.size + e;
    r = r * Math.PI / 180;
    return {x: planet.x + Math.cos(r) * orbit,
            y: planet.y + Math.sin(r) * orbit};
    
};

Ship.prototype.getRotationSpeed = function() {
    return Math.round(Math.PI / this.planet.size
                      * this.$.shipSpeeds[this.type] * 100) / 100;
    
};

Ship.prototype.wrapAngle = function(r) {
    r = (r + 360) % 360;
    if (r < 0) {
        r += 360;
    }
    return r;
};

Ship.prototype.getTick = function() {
    return this.$.getTick();
};

// Bezier Helpers --------------------------------------------------------------
function linp(d, a, b, t) {
    d.x = a.x + (b.x - a.x) * t;
    d.y = a.y + (b.y - a.y) * t;
}

Ship.prototype.bezier = function(dest, a, b, c, d, delta) {
    var ab = {x:0, y: 0}, bc = {x:0, y: 0}, cd = {x:0, y: 0};
    var abbc = {x:0, y: 0}, bccd = {x:0, y: 0};
    linp(ab, a, b, delta);
    linp(bc, b, c, delta);
    linp(cd, c, d, delta);
    linp(abbc, ab, bc, delta);
    linp(bccd, bc, cd, delta);
    linp(dest, abbc, bccd, delta);
};

Ship.prototype.bezierDistance = function(a, b, c, d) {
    var o = {x: 0, y: 0};
    this.bezier(o, a, b, c, d, 0);
    var e = {x: 0, y: 0};
    var l = 0;
    for(var i = 0.05; i < 1; i += 0.05) {
        this.bezier(e, a, b, c, d, i);
        var dx = o.x - e.x, dy = o.y - e.y;
        l += Math.sqrt(dx * dx + dy * dy);
        o.x = e.x, o.y = e.y;
    }
    return l;
};


// Newtwork --------------------------------------------------------------------
Ship.prototype.initTravel = function(tick, or, pid, arrive, travel) {
    this.planet.removeShip(this);
    this.orbit = this.$.shipOrbits[this.type];
    this.nextPlanet = this.$.planets[pid]; 
    
    this.r = this.or = or;
    this.tickOffset = tick;
    
    this.arriveTick = arrive;
    this.travelTicks = travel;
    this.travelDistance = this.$.coreOrbit(this, this.planet, this.nextPlanet);
    this.travelAngle = Math.round(this.$.coreAngle(this.planet, this.nextPlanet));
};

Ship.prototype.finishTravel = function(or, pid) {
    this.planet = this.$.planets[pid];
    this.planet.addShip(this);
    this.r = this.or = or;
    this.tickOffset = Math.floor(this.$.tickCount);
    if (!this.next) {
        this.nextPlanet = null;
    }
};

Ship.prototype.update = function(d) {
    this.traveling = !!(d[0] & 2);
    this.inOrbit = !!(d[0] & 4);
    this.landing = !!(d[0] & 8);
    this.next = !!(d[0] & 16);
    this.traveled = !!(d[0] & 32);
    this.direction = (d[0] & 64) ? 1 : -1;
    this.stopped = !!(d[0] & 128);
        
    // Create
    if (d[0] & 1) {
        this.type = this.$.shipTypes[d[2]];
        this.planet = this.$.planets[d[3]];
        this.player = this.$.players[d[4]];
        this.player.shipCount++;
        
        this.tickOffset = this.tickInit = d[5];
        this.r = this.or = d[6];
        this.planet.addShip(this);
        
        // Already traveling
        if (this.next && this.traveling) {
            this.initTravel(d[5], d[6], d[7], d[8], d[9]);
        
        // Already sent
        } else if (this.next) {
            this.nextPlanet = this.$.planets[d[7]];
        }
    
    // Send // Arrive
    } else {
        
        // Sent
        if (this.next && !this.traveling) {
            this.nextPlanet = this.$.planets[d[2]];
            
            // Has just finished arrived
            if (this.traveled) {
                this.finishTravel(d[3], d[4]);
            }
        
        // Start Travel
        } else if (this.next && this.traveling) {
            this.initTravel(d[2], d[3], d[4], d[5], d[6]);
        
        // Stop
        } else if (this.stopped) {
            this.nextPlanet = null;
        
        // Finish travel
        } else {
            this.finishTravel(d[2], d[3]);
        }
    }
};

