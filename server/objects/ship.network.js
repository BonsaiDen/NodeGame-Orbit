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


// Orbit Ship Network ----------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
 
    createMessage: function() {
        return this.toMessage(true);
    },
    
    updateMessage: function() {
        return this.toMessage(false);
    },
    
    destroyMessage: function() {
        return [this.id];
    },
    
    update: function() {
        this.updated = true;
    },

    toMessage: function(create) {
        var msg = [];
        
        // Ship Flags
        var flags = 0;
        flags += create ? 1 : 0;
        flags += this.isTraveling ? 2: 0;
        flags += this.inOrbit ? 4 : 0;
        flags += this.isLanding ? 8 : 0;
        flags += this.nextPlanet ? 16 : 0;
        flags += this.hasTraveled ? 32 : 0;
        flags += this.direction === 1 ? 64 : 0;
        flags += this.hasStopped ? 128 : 0;
        
        // Basic fields
        msg.push(flags);
        msg.push(this.id);
        
        // Ship created
        if (create) {
            msg.push(this.planet.id);
            msg.push(this.player.id);
            msg.push(this.offsetTick);
            msg.push(this.offsetAngle);
            
            // Ship created while isLanding
            if (this.isLanding) {
                msg.push(this.targetFactory.id);
                msg.push(this.landingTick);
                
            // Ship created in travel
            } else if (this.nextPlanet && this.isTraveling) {
                msg.push(this.nextPlanet.id);
                msg.push(this.arriveTick);
                msg.push(this.travelTicks);
            
            // Ship created and already sent
            } else if (this.nextPlanet) {
                msg.push(this.nextPlanet.id);
            }
        
        // Ship Updates
        } else {
            
            // Ship sent
            if (this.nextPlanet && !this.isTraveling) {
                msg.push(this.nextPlanet.id);
                
                // Ship has just arrived
                if (this.hasTraveled) {
                    msg.push(this.offsetAngle);
                    msg.push(this.planet.id);
                }
            
            // Ship starts travel
            } else if (this.nextPlanet && this.isTraveling) {
                msg.push(this.offsetAngle);
                msg.push(this.nextPlanet.id);
                msg.push(this.travelTicks);
            
            // Ship isLanding
            } else if (this.isLanding) {
                msg.push(this.targetFactory.id);
                msg.push(this.landingTick);
            
            // Ship finishes travel 
            } else if (!this.hasStopped) {
                msg.push(this.offsetAngle);
                msg.push(this.planet.id);
            }
        }
        return msg;
    }
};
   
