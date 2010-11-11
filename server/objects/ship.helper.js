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


// Orbit Ship Helpers ----------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    inAngleDifference: function(targetAngle, minAngle, maxAngle) {
        var angle = this.game.angleDifference(this.angle, targetAngle)
                    / this.getRotationSpeed();
        
        var pAngle = Math.abs(angle);
        var dir = this.direction;
        
        if ((dir === 1 && angle > 0) || (dir === -1 && angle < 0)) {
            return pAngle <= maxAngle && pAngle > minAngle;
            
        } else {
            return false;
        }
    },
    
    wrapAngle: function(r) {
        r = (r + 360) % 360;
        if (r < 0) {
            r += 360;
        }
        return r;
    },
    
    getRotationSpeed: function() {
        return Math.round(Math.PI / this.planet.size
              * this.game.shipSpeed * 100) / 100;
    },
    
    getNextRotationSpeed: function() {
        return Math.round(Math.PI / this.nextPlanet.size
               * this.game.shipSpeed * 100) / 100;
    },
    
    angleDifference: function(angle) {
        return this.game.angleDifference(this.angle, angle);
    }
};

