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
function Player(game, id, name, color, watch) {
    this.$ = game;
    this.name = name;
    this.color = color;
    this.id = id;
    this.watch = watch;
    this.shipCount = 0;
    if (!this.watch) {
        this.$.players[id] = this;
    }
    
    // Update planets
    for(var i in this.$.planets) {
        if (!this.$.planets[i].ships[id]) {
            this.$.planets[i].ships[id] = {fight: [], bomb: [], def: []};
        }
    }
}

Player.prototype.initInput = function() {
    this.selectTick = 0;
    this.selectCount = {};
    this.resetSelectCount();
    this.selectPlanet = null;
    this.select = false;
};


Player.prototype.remove = function() {
    for(var i in this.$.planets) {
        delete this.$.planets[i].ships[this.id];
    }
    delete this.$.players[this.id];
};


// Tick the GUI ----------------------------------------------------------------
Player.prototype.tick = function() {
    var tick = Math.floor(this.getTick());
    if (this.selectPlanet && this.select && tick % 2 === 0) {
        var type = this.getSelectType();
        var oldCount = this.selectCount[type];
        if (this.select) {
            var ticks = this.getTick() - this.selectTick;
            var add = 0;
            if (ticks > 100) {
                add = 2;
            
            } else if (ticks > 200) {
                add = 5;
            
            } else if (ticks > 1) {
                add = 1;
            }
            this.addCount(type, add);
        
        } else {
            this.addCount(type, 0);
        }
        
        if (this.selectCount[type] !== oldCount) {
            this.$.drawBackground();
        }
    }
};

Player.prototype.addCount = function(type, add) {
    var maxCount = this.selectPlanet.ships[this.id][type].length;
    this.selectCount[type] = Math.min(maxCount, this.selectCount[type] + add);
};


// Send Ships ------------------------------------------------------------------
Player.prototype.send = function(target) {
    if (this.selectPlanet && this.selectCountAll() > 0) {
        var path = this.$.corePath(this.selectPlanet, target, this);
        for(var i = 0; i < this.$.shipTypes.length; i++) {
            var type = this.$.shipTypes[i];
            if (path.length > 0 && this.selectCount[type] > 0) {
                this.$.send({'send': [this.selectPlanet.id, target.id, type,
                                      this.selectCount[type]]});
                
                this.selectCount[type] = 0;
            }
        }
    
    } else {
        this.selectPlanet = target;
    }
};

Player.prototype.stop = function(planet) {
    if (this.selectPlanet) {
        this.$.send({'stop': [planet.id, this.getSelectType()]});
    
    } else {
        for(var i = 0; i < this.$.shipTypes.length; i++) {
            var type = this.$.shipTypes[i];
            this.$.send({'stop': [planet.id, type]});
        }
    }
};


// Control ---------------------------------------------------------------------
Player.prototype.selectStart = function(planet) {
    this.selectTick = this.getTick();
    if (this.selectPlanet !== planet) {
        this.resetSelectCount();
        this.selectPlanet = planet;
        this.$.drawBackground();
    }
    this.select = true;
};

Player.prototype.selectStop = function() {
    this.select = false;
    this.sendPath = [];
};

Player.prototype.selectSimple = function(planet) {
    this.selectPlanet = planet;
    this.select = false;
    this.resetSelectCount();
};

Player.prototype.selectAll = function() {
    if (this.selectPlanet) {
        var type = this.getSelectType();
        this.selectCount[type] = this.selectPlanet.ships[this.id][type].length;
    }
};

Player.prototype.selectCancel = function() {
    this.selectTick = 0;
    this.resetSelectCount();
    this.selectPlanet = null;
    this.select = false;
};

Player.prototype.getSelectType = function()  {
    var dx = this.$.worldX - this.selectPlanet.x;
    var dy = this.$.worldY - this.selectPlanet.y;
    var dr = Math.atan2(dy, dx);
    for(var i = 0, l = this.$.shipTypes.length; i < l; i++) {
        var r = (0 - Math.PI / 2) + Math.PI * 2 / l * i;       
        var diff = Math.abs(Math.atan2(Math.sin(dr - r), Math.cos(dr - r)));
        if (diff <= Math.PI / 3) {
            return this.$.shipTypes[i];
        }
    }
    return 'fight';
};

Player.prototype.resetSelectCount = function() {
    for(var i = 0; i < this.$.shipTypes.length; i++) {
        this.selectCount[this.$.shipTypes[i]] = 0; 
    }
};

Player.prototype.selectCountAll = function() {
    var count = 0;
    for(var i = 0; i < this.$.shipTypes.length; i++) {
        count += this.selectCount[this.$.shipTypes[i]] ; 
    }
    return count;
};


// Helpers ---------------------------------------------------------------------
Player.prototype.getTick = function() {
    return this.$.getTick();
};

