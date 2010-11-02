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


// Player ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Player(game, id, name, color) {
    this.$ = game;
    this.name = name;
    this.color = color;
    this.id = id;
    this.$.players[id] = this;
    this.shipCount = 0;
    
    // GUI
    this.selectTick = 0;
    this.selectType = null;
    this.selectCount = 0;
    this.selectPlanet = null;
    this.select = false;
    
    // Update planets
    for(var i in this.$.planets) {
        if (!this.$.planets[i].ships[id]) {
            this.$.planets[i].ships[id] = {fight: [], bomb: [], def: []};
        }
    }
}

Player.prototype.remove = function() {
    for(var i in this.$.planets) {
        delete this.$.planets[i].ships[this.id];
    }
    delete this.$.players[this.id];
};


// Tick the GUI ----------------------------------------------------------------
Player.prototype.tick = function() {
    if (this.selectPlanet && this.selectType && this.getTick() % 2 === 0) {
        var maxCount = this.selectPlanet.ships[this.id][this.selectType].length;
        
        if (this.select) {
            var ticks = this.getTick() - this.selectTick;
            var add = 0;
            if (ticks > 30) {
                add = 2;
            
            } else if (ticks > 60) {
                add = 5;
            
            } else if (ticks > 90) {
                add = 10;
            
            } else if (ticks > 0) {
                add = 1;
            }
            this.selectCount = Math.min(maxCount, this.selectCount + add);
        
        } else {
            this.selectCount = Math.min(maxCount, this.selectCount);
        }
    }
}


// Send Ships ------------------------------------------------------------------
Player.prototype.send = function(target) {
    if (this.selectPlanet && this.selectCount > 0) {
        var path = this.$.corePath(this.selectPlanet, target, this);
        if (path.length > 0) {
            this.$.send({'send': [this.selectPlanet.id, target.id,
                                  this.selectType, this.selectCount]});
            
            this.selectCount = 0;
        }
    
    } else {
        this.selectPlanet = target;
    }
};


// Control ---------------------------------------------------------------------
Player.prototype.selectStart = function(planet, type) {
    this.selectTick = this.getTick();
    if (this.selectPlanet !== planet || this.selectType !== type) {
        this.selectType = type;
        this.selectCount = 0;
        this.selectPlanet = planet;
    }
    this.select = true;
};

Player.prototype.selectStop = function() {
    this.select = false;
};

Player.prototype.selectSimple = function(planet) {
    this.selectPlanet = planet;
    this.select = false;
    this.selectCount = 0;
};

Player.prototype.selectCancel = function() {
    this.selectTick = 0;
    this.selectType = null;
    this.selectCount = 0;
    this.selectPlanet = null;
    this.select = false;
};


// Helpers ---------------------------------------------------------------------
Player.prototype.getTick = function() {
    return this.$.getTick();
};

