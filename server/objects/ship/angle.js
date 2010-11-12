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


// Orbit Ship Angle & Orbit ----------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    calculateOrbit: function() {
        var tickDiff = this.getTick() - this.offsetTick;
        if (!this.inOrbit) {
            if (this.isLanding) {
                this.calculateAngle(tickDiff);
                this.calculateLandingOrbit(tickDiff);
            
            } else {
                this.calculateRisingOrbit(tickDiff);
            }
        
        } else {
            this.orbit = this.game.shipOrbit;
            this.calculateAngle(tickDiff);            
        }
    },
    
    calculateAngle: function(tickDiff) {
        this.angle = this.wrapAngle(this.offsetAngle + this.direction
                                    * this.rspeed * tickDiff);
    },
    
    calculateLandingOrbit: function(tickDiff) {
        var p = 1 / (this.landingTick - this.offsetTick)
                * Math.max(this.landingTick - this.getTick(), 0);
        
        this.orbit = this.game.shipOrbit * p;
        if (this.orbit <= 0) {
            this.checkTargetFactory();
        }
    },
    
    calculateRisingOrbit: function(tickDiff) {
        var orbitSpeed = this.rspeed * this.game.shipToOrbitSpeed;
        var orbitDiff = Math.ceil(this.game.shipOrbit / orbitSpeed);
        this.angle = this.wrapAngle(this.offsetAngle + this.direction
                     * this.rspeed * Math.max(tickDiff - orbitDiff * 0.35, 0));
        
        this.orbit = tickDiff * orbitSpeed;
        if (this.orbit >= this.game.shipOrbit) {
            this.inOrbit = true;
            this.orbit = this.game.shipOrbit;
            this.offsetAngle = this.angle;
            
            var overHeight = (this.orbit - this.game.shipOrbit);
            var backTick = Math.round(overHeight / this.rspeed);
            this.offsetTick += (tickDiff - backTick);
        }
    }
};

