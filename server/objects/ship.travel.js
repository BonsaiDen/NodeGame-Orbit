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
var Bezier = require('./../libs/bezier.js').Bezier;


// Orbit Ship Traveling --------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    calculateTravelRoute: function(targetPlanet) {
        var planets = this.game.pathTo(this.planet, targetPlanet, this.player);
        if (planets.length > 0) {
            this.setTravelRoute(planets);
            return true;
        
        } else {
            this.targetPlanet = null;
            this.nextPlanet = null;
            return false;
        }
    },
    
    setTravelRoute: function(travelPlanets) {
        this.update();
        this.targetFactory = null;
        if (!this.nextPlanet) {
            this.hasTraveled = false;
        }
        
        this.travelPlanets = travelPlanets; 
        this.targetPlanet = travelPlanets[travelPlanets.length - 1];
        this.nextPlanet = travelPlanets[0];
        this.travelAngle = Math.round(this.game.angleBetween(this.planet,
                                                             this.nextPlanet));
    },
    
    checkTravel: function() {
        if (this.inAngleDifference(this.travelAngle, 15, 20)) {
            if (this.nextPlanet.player === this.player
                || this.planet.player === this.player) {
                
                if (!this.nextPlanet.shipMaximum(this.player)) {
                    this.startTravel();
                }
            
            } else {
                this.stop();
            }
        }
    },
    
    startTravel: function() {
        this.update();
        this.offsetAngle = this.angle;
        this.offsetTick = this.getTick();
        this.planet.removeShip(this);
        
        // Get chached travel distance or calculate it
        this.travelTicks = this.planet.getPlanetDistance(this.nextPlanet);
        if (this.travelTicks === false) {
            this.travelTicks = this.calculateTravelDistance();
            this.planet.setPlanetDistance(this.nextPlanet, this.travelTicks);
        }
        this.calculateTravelDirection();
        
        this.nextPlanet.addShip(this);
        this.arriveTick = this.getTick() + this.travelTicks;
        this.isTraveling = true;
        this.hasTraveled = false;
    },
    
    calculateTravelDirection: function() {
        if (this.travelPlanets.length > 1) {
            var ta = this.game.angleBetween(this.nextPlanet, this.travelPlanets[1]);
            var r = this.wrapAngle(this.travelAngle + 180);
            this.direction = this.game.angleDifference(r, Math.round(ta)) >= 0 ? 1 : -1;
        
        } else {
            this.direction = this.nextPlanet.getBestDirection(this.player, (this.travelAngle + 180) % 360);
        }
    },
    
    calculateTravelDistance: function() {
        var a = this.pointInOrbit(this.planet, this.offsetAngle, 0);
        var b = this.pointInOrbit(this.planet, this.travelAngle, 2);
        var c = this.pointInOrbit(this.nextPlanet, (this.travelAngle + 180) % 360, 2);
        var d = this.pointInOrbit(this.nextPlanet, (this.travelAngle + 180 + 20 * this.direction) % 360, 0);
        return Math.floor(new Bezier(a, b, c, d, 25).length * 1.05);
    },
    
    pointInOrbit: function(planet, r, e) {
        var orbit = Math.max(this.orbit, 3) + planet.size + e;
        r = r * Math.PI / 180;
        return {x: planet.x + Math.cos(r) * orbit,
                y: planet.y + Math.sin(r) * orbit};
    },
    
    finishTravel: function() {
        this.update();
        this.isTraveling = false;
        this.hasTraveled = true;
        this.offsetTick = this.getTick();
        
        var angle = this.travelAngle + 180 + (20 * this.direction);
        this.angle = this.offsetAngle = this.wrapAngle(angle);
        this.planet = this.nextPlanet;
        
        if (this.nextPlanet === this.targetPlanet) {
            this.nextPlanet = this.targetPlanet = null;
                
        } else if (!this.calculateTravelRoute(this.targetPlanet)) {
            this.nextPlanet = this.targetPlanet = null;
        
        } else {
            this.direction = this.angleDifference(this.travelAngle) >= 0 ? 1 : -1;
        }
    }
};

