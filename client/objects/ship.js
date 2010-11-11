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
    this.landFactory = null;
    this.landingTick = 0;
    
    this.traveling = false;
    this.nextPlanet = null;
    this.travelTicks = 0;
    this.arriveTick = 0;
    this.stopped = false;
    this.travelBezier = null;
    this.travelAcceleration = 0;
    
    this.$.shipList.push(this);
}

Ship.prototype.destroy = function() {
    var index = this.$.shipList.indexOf(this);
    if (index !== -1) {
        this.player.shipCount--;
        if (this.landing && this.orbit <= 1) {
       //    this.$.effectExplosion(this.player.color, this.planet,
       //                            0, this.landFactory.r, 0, 3);
            
            this.planet.removeShip(this);
        
        } else if (!this.traveling) {
            this.$.effectExplosion(this.player.color, this.planet,
                                   this.orbit, this.r, this.rs, 8);
            
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
        this.rs = this.getRotationSpeed();
        if (!this.inOrbit) {
            var ospeed = this.rs * this.$.shipToOrbitSpeed;
            var orbitDiff = Math.ceil(this.$.shipOrbit / ospeed);
            if (this.landing) {
                this.r = this.wrapAngle(this.or + this.direction * this.rs * tickDiff);
                var l = 1 / (this.landingTick - this.tickOffset) * Math.max(this.landingTick - this.getTick(), 0);
                this.orbit = this.$.shipOrbit * l;
            
            } else {
                this.r = this.wrapAngle(this.or + this.direction * this.rs
                                        * Math.max(tickDiff - orbitDiff * 0.35, 0));  
                
                this.orbit = tickDiff * ospeed;
                if (this.orbit >= this.$.shipOrbit) {
                    this.inOrbit = true;
                    this.orbit = this.$.shipOrbit;
                    this.or = this.r;
                    this.tickOffset += (tickDiff - Math.round((this.orbit - this.$.shipOrbit) / this.rs));
                }
            }
        
        } else {
            this.orbit = this.$.shipOrbit;
            this.r = this.wrapAngle(this.or + this.direction * this.rs * tickDiff); 
        }
    }
};

// Drawing ---------------------------------------------------------------------
Ship.prototype.clear = function(sx, sy) {
    if (this.$.shipVisbile(this, sx, sy)) {
        this.$.fbg.clearRect(this.x - 4 - sx, this.y - 4 - sy, 8, 8);
    }
};

Ship.prototype.draw = function(sx, sy) {
    this.calculatePosition();
    if (this.$.shipVisbile(this, sx, sy)) {
        
        // inFlight
        if (this.nextPlanet) {
            this.$.drawDark(this.player.color);
         
        // Scheduled to land   
        } else if (this.landing) {
            this.$.drawShaded(this.player.color);
        
        // Stationed
        } else {
            this.$.drawColor(this.player.color);
        }
        
        // Start/Landing Alpha
        var orbitDiff = 1 / this.$.shipOrbit
                        * (this.$.shipOrbit - this.orbit);
        
        this.$.drawAlpha(Math.max(1 - orbitDiff, 0.05));
        
        // Start/Landing angle
        var dr = 0;
        if (this.landing) {
            dr = -Math.PI / 2 * Math.max(orbitDiff, orbitDiff * 0.5);
        
        } else if (!this.inOrbit) {
            dr = Math.PI / 2 * Math.max(orbitDiff, orbitDiff * 0.5);
        }
        
        // Bomber
        if (this.type === 'bomb') {
            this.$.drawCircle(this.x, this.y, 1.5, true);
        
        } else {
            var r = 0;
            if (!this.traveling) {
                if (this.direction === 1) {
                    r = this.r * Math.PI / 180 - dr;
                
                } else {
                    r = this.r * Math.PI / 180 - Math.PI + dr;
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

Ship.prototype.attackFactory = function(factory) {
    if (!this.attacked) {
        this.attacked = true;
        this.$.effectExplosion(this.player.color, this.planet, 3, factory.r, 0, 5);
    }
};

Ship.prototype.attack = function(other) {
    if (!this.attacked) {
        var attack = false;

        this.attacked = true;
        this.$.effectExplosion(this.player.color, this.planet,
                               other.orbit, other.r, other.rs, 4);
    }
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
    var t = 1 - 1 / this.travelTicks * (this.arriveTick - this.getTick());
    var m = 0.5 * this.travelAcceleration + this.startSpeed;
    var d = 0.5 * this.travelAcceleration * t * t + this.startSpeed * t;
    t = 1 / m * d;
    
    this.x = this.travelBezier.mx(t);
    this.y = this.travelBezier.my(t);
    this.r = this.wrapAngle(this.travelBezier.mr(t) * 180 / Math.PI);
};

Ship.prototype.getPointInOrbit = function(planet, r, e) {
    var orbit = Math.max(this.orbit, 3) + planet.size + e;
    r = r * Math.PI / 180;
    return {x: planet.x + Math.cos(r) * orbit,
            y: planet.y + Math.sin(r) * orbit};
    
};

Ship.prototype.getNextRotationSpeed = function() {
    return Math.round(Math.PI / this.nextPlanet.size
                      * this.$.shipSpeed * 100) / 100;
    
};

Ship.prototype.getRotationSpeed = function() {
    return Math.round(Math.PI / this.planet.size
                      * this.$.shipSpeed * 100) / 100;
    
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


// Network ---------------------------------------------------------------------
Ship.prototype.initTravel = function(tick, or, pid, arrive, travel) {
    this.planet.removeShip(this);
    this.orbit = this.$.shipOrbit;
    this.nextPlanet = this.$.planets[pid]; 
    
    this.r = this.or = or;
    this.tickOffset = tick;
    
    this.arriveTick = arrive;
    this.travelTicks = travel;
    this.travelAngle = Math.round(this.$.coreAngle(this.planet, this.nextPlanet));
    
    // Bezier curve path
    var a = this.getPointInOrbit(this.planet, this.or, 0);
    var b = this.getPointInOrbit(this.planet, this.travelAngle, 2);
    
    var c = this.getPointInOrbit(this.nextPlanet, (this.travelAngle + 180) % 360, 2);
    var d = this.getPointInOrbit(this.nextPlanet, (this.travelAngle + 180 + 20 * this.direction) % 360, 0);
    this.travelBezier = new Bezier(a, b, c, d, 100);
    
    this.startSpeed = this.rotationToMovement(this.planet.size, this.getRotationSpeed());
    var end = this.rotationToMovement(this.nextPlanet.size, this.getNextRotationSpeed());
    this.travelAcceleration = (end - this.startSpeed) / 1;
};

Ship.prototype.rotationToMovement = function(size, rs) {
    var r = this.r * Math.PI / 180;
    var rr = (this.r + rs) * Math.PI / 180;
    var orbit = size + this.orbit;
    var dx = Math.cos(r) * orbit - Math.cos(rr) * orbit;
    var dy = Math.sin(r) * orbit - Math.sin(rr) * orbit;
    return Math.sqrt(dx * dx + dy * dy);
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
        this.planet = this.$.planets[d[2]];
        this.player = this.$.players[d[3]];
        this.player.shipCount++;
        
        this.tickOffset = this.tickInit = d[4];
        this.r = this.or = d[5];
        this.planet.addShip(this);
        
        // Already landing
        if (this.landing) {
            this.landFactory = this.planet.factories[d[6]];
            this.landingTick = d[7];
        
        // Already traveling
        } else if (this.next && this.traveling) {
            this.initTravel(d[4], d[5], d[6], d[7], d[8]);
        
        // Already sent
        } else if (this.next) {
            this.nextPlanet = this.$.planets[d[6]];
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
            var tick = Math.floor(this.$.tickCount);
            this.initTravel(tick, d[2], d[3], tick + d[4], d[4]);
        
        // Landing
        } else if (this.landing) {
            this.landFactory = this.planet.factories[d[2]];
            this.landingTick = d[3];
            this.or = this.r;
            this.tickOffset = Math.floor(this.$.tickCount);
        
        // Stop
        } else if (this.stopped) {
            this.nextPlanet = null;
        
        // Finish travel
        } else {
            this.finishTravel(d[2], d[3]);
            
            // Restart
            if (this.landFactory) {
                this.landFactory = false;
            }
        }
    }
};


// Bezier Curve ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function Bezier(a, b, c, d, points) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    
    this.length = 0;
    this.points = points; 
    this.arcs = new Array(this.points + 1);
    this.arcs[0] = 0;
    
    var ox = this.x(0), oy = this.y(0);
    for(var i = 1; i <= this.points; i += 1) {
        var x = this.x(i / this.points), y = this.y(i / this.points);
        var dx = ox - x, dy = oy - y;        
        this.length += Math.sqrt(dx * dx + dy * dy);
        this.arcs[i] = this.length;
        ox = x, oy = y;
    }
}


// Prototype -------------------------------------------------------------------
Bezier.prototype = {
    map: function(u) {
        var targetLength = u * this.length;
        var low = 0, high = this.points, index = 0;
        while (low < high) {
            index = low + (((high - low) / 2) | 0);
            if (this.arcs[index] < targetLength) {
                low = index + 1;
            
            } else {
                high = index;
            }
        }
        if (this.arcs[index] > targetLength) {
            index--;
        }
        
        var lengthBefore = this.arcs[index];
        if (lengthBefore === targetLength) {
            return index / this.points;
        
        } else {
            return (index + (targetLength - lengthBefore)
                   / (this.arcs[index + 1] - lengthBefore)) / this.points;
        }
    },
    
    mx: function (u) {
        return this.x(this.map(u));
    },
    
    my: function (u) {
        return this.y(this.map(u));
    },
    
    mr: function(u) {
        return this.r(this.map(u));
    },
    
    x: function (t) {
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
               + 3 * ((1 - t) * (1 - t)) * t * this.b.x
               + 3 * (1 - t) * (t * t) * this.c.x
               + (t * t * t) * this.d.x;
    },
    
    y: function (t) {
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
               + 3 * ((1 - t) * (1 - t)) * t * this.b.y
               + 3 * (1 - t) * (t * t) * this.c.y
               + (t * t * t) * this.d.y;
    },
    
    r: function(t) {
        return Math.atan2(this.y(t) - this.y(t + 0.01),
                          this.x(t) - this.x(t + 0.01));
    }
};

