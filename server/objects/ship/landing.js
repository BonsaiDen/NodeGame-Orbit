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


// Orbit Ship Factory & Landing ------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    checkTargetFactory: function() {
        if (!this.targetFactory
            || !this.targetFactory.isAlive() || this.targetFactory.isBuild()) {
            
            this.targetFactory = null;
            this.offsetTick = this.getTick();
            this.offsetAngle = this.angle;
            this.isLanding = false;
            this.update();
        
        } else {
            this.targetFactory.useShip(this);
        }
    },
    
    checkLanding: function() {
        if (!this.isLanding && this.targetFactory.build) {
            this.targetFactory = null;
        
        } else if (!this.isLanding) {
            var diff = Math.abs(this.angleDifference(this.targetFactory.angle));
            if (this.inAngleDifference(this.targetFactory.angle, 20, 30)) {
                this.startLanding(diff);
            }
        }
    },
    
    startLanding: function(diff) {
        this.inOrbit = false;
        this.isLanding = true;
        this.landingTick = this.getTick() + Math.floor(diff / this.rspeed);
        this.offsetTick = this.getTick();
        this.offsetAngle = this.angle;
        this.update();
    }
};

