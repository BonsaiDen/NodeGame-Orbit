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


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Planet(game, id, x, y, size, player, maxCount, nodes) {
    this.$ = game;
    this.id = id;
    this.player = player;
    
    this.ships = {};
    this.shipCount = 0;
    
    this.size = size;
    this.maxCount = maxCount;
    this.x = x;
    this.y = y;
    
    this.nodes = nodes;
    this.localCount = 0;
    this.playerCount = 0;
}


// Combat ----------------------------------------------------------------------
Planet.prototype.tick = function() {
    if (this.$.player) {
        var selected = this.$.player.selectPlanet;
        if (this === selected && this.$.player.selectCount > 0) {
            var oldPlayerCount = this.playerCount;
            this.playerCount = selected.getPlayerShipCount(this.$.player);
            if (oldPlayerCount != this.playerCount) {
                this.$.drawBackground();
            }
        
        } else if (this === this.$.inputHover) {
            var oldPlayerCount = this.playerCount;
            var oldLocalCount = this.localCount;
            
            this.playerCount = this.getPlayerShipCount(this.$.player);
            this.localCount = this.getPlayerShipCount(this.player);
            
            if (oldPlayerCount != this.playerCount
                || oldLocalCount != this.localCount) {
                
                this.$.drawBackground();
            }
        }
    }
};

Planet.prototype.tickCombat = function() {
    if (this.shipCount === 0) {
        return;
    }
    
    var ships = [];
    var tl = this.$.shipTypes.length;
    for(var p in this.ships) {
        for(var t = 0; t < tl; t++) {
            ships = ships.concat(this.ships[p][this.$.shipTypes[t]]);
        }
    }
    ships.sort(function(a, b) {
        return a.r < b.r;
    });
    
    var rs = Math.round(Math.PI / this.size * this.$.shipSpeed * 100) / 100 * 2;
    var fightDistance = rs * 3;
    for(var i = 0, l = ships.length; i < l; i++) {
        var c = ships[i];
        if (c.inOrbit) {
            for(var e = i + 1;; e++) {
                if (e === l) {
                    e = 0;
                }
                if (e === i) {
                    break;
                }
                
                var s = ships[e];
                var ds = Math.abs(this.$.coreDifference(s.r, c.r));
                if (ds <= fightDistance) {
                    if (s.player !== c.player) {
                        c.attack(s);
                        s.attack(c);
                        break;
                    }
                
                } else {
                    break;
                }
            }
        }
    }
};


// Ships -----------------------------------------------------------------------
Planet.prototype.addShip = function(ship) {
    if (this.ships[ship.player.id][ship.type].indexOf(ship) === -1) {
        this.ships[ship.player.id][ship.type].push(ship);
        this.shipCount++;
    }
};

Planet.prototype.removeShip = function(ship) {
    var ships = this.ships[ship.player.id][ship.type];
    var index = ships.indexOf(ship);
    if (index !== -1) {
        ships.splice(index, 1);
        this.shipCount--;
    }
};

Planet.prototype.getPlayerShipCount = function(player) {
    return this.ships[player.id]['fight'].length
           + this.ships[player.id]['def'].length
           + this.ships[player.id]['bomb'].length;
};


// Drawing ---------------------------------------------------------------------
Planet.prototype.clear = function(sx, sy) {
    if (this.$.planetVisbile(this, sx, sy)) {
        this.$.bbg.clearRect(this.x - this.size - sx - 8,
                             this.y - this.size - sy - 8,
                             this.size * 2 + 16, this.size * 2 + 16);
    }
};

Planet.prototype.draw = function(sx, sy) {
    if (!this.$.planetVisbile(this, sx, sy)) {
        return false;
    }
    
    // Draw Planet Shape
    this.$.drawBack();
    this.$.drawWidth(4);
    this.$.drawColor(this.player ? this.player.color : 0);
    this.$.drawAlpha(0.35);
    this.$.drawCircle(this.x, this.y, this.size - 2.5, false);
    this.$.drawWidth(5);
    this.$.drawAlpha(0.20);
    this.$.drawCircle(this.x, this.y, this.size - 7, false);
    
    this.$.drawAlpha(1);
    this.$.drawWidth(3);
    this.$.drawColor(this.player ? this.player.color : 0);
    this.$.drawCircle(this.x, this.y, this.size, false);
    
    // Selected
    if (this.player === this.$.player) {
        this.$.drawColor(this.$.player.color);
    
    } else {
        this.$.drawShaded(this.$.player.color);
    }
    
            this.$.drawText(this.x, this.y,
                            this.id, 'center', 'bottom',
                            1);
    
    // Select
    var selected = this.$.player.selectPlanet;
    var size = (100 / 15) * this.size / 100;
    if (this === selected && this.$.player.selectCount > 0) {
        this.drawSelect();
        if (this.playerCount > 0) {
            this.$.drawColor(this.$.player.color);
            this.$.drawText(this.x, this.y + 1 * size,
                            this.$.player.selectCount, 'center', 'bottom',
                            size);
            
            this.$.drawText(this.x, this.y + 1 * size,
                            '_', 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y - 1 * size,
                            this.playerCount, 'center', 'top', size);                
        }
    
    // Info
    } else if (this === this.$.inputHover) {
        if (this.$.sendPath.length === 0) {
            this.drawSelect();
        }
        
        // Enemy Planet
        if (this.playerCount > 0 && this.player !== this.$.player) {
            this.$.drawShaded(this.$.player.color);
            this.$.drawText(this.x, this.y + 1 * size,
                            this.playerCount, 'center', 'bottom', size);
            
            this.$.drawShaded(this.player.color);
            this.$.drawText(this.x, this.y - 4.5 * size,
                            '_', 'center', 'middle', size);
            
            this.$.drawText(this.x, this.y - 1 * size,
                            this.localCount, 'center', 'top', size);
        
        // Own Planet
        } else {
            this.$.drawShaded(this.player ? this.player.color : 0);
            this.$.drawText(this.x, this.y + 1 * size,
                            this.localCount, 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y + 1 * size,
                            '_', 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y - 1 * size,
                            this.maxCount, 'center', 'top', size);
        }
    }
    
    // Clear send path when all ships on the planet get destroyed
    if (this === selected && this.$.player.selectCount === 0) {
        if (this.$.sendPath.length > 0) {
            this.$.sendPath = [];
            this.$.drawBackground(true);
        }
    }
    this.$.drawFront();
};

Planet.prototype.drawSelect = function() {
    this.$.drawWidth(1);
    this.$.drawCircle(this.x, this.y, this.size + 4, false);
};

