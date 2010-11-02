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
function Planet(game, id, x, y, size, player) {
    this.$ = game;
    this.id = id;
    this.player = player;
    
    this.ships = {};
    this.shipCount = 0;
    
    this.size = size;
    this.x = x;
    this.y = y;
}


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
Planet.prototype.draw = function() {
    this.$.drawWidth(4);
    this.$.drawColor(this.player ? this.player.color : 5);
    this.$.drawAlpha(0.35);
    this.$.drawCircle(this.x, this.y, this.size - 2.5, false);
    this.$.drawWidth(5);
    this.$.drawAlpha(0.20);
    this.$.drawCircle(this.x, this.y, this.size - 7, false);
    
    this.$.drawAlpha(1);
    this.$.drawWidth(3);
    this.$.drawColor(this.player ? this.player.color : 5);
    this.$.drawCircle(this.x, this.y, this.size, false);
    
    // Selected
    if (this.$.player) {
        this.$.drawColor(this.player ? this.player.color : 5);
        if (this === this.$.inputHover || this === this.$.player.selectPlanet) {
            this.$.drawWidth(1);
            this.$.drawCircle(this.x, this.y, this.size + 4, false);
        }
        
        if (this === this.$.player.selectPlanet) {
            if (this.$.player.selectPlanet.getPlayerShipCount(this.$.player) > 0) {
                this.$.drawColor(this.$.player.color);
                this.$.drawText(this.x, this.y, this.$.player.selectCount, 'center', 'middle');
            }
        }
    }
};

Planet.prototype.clear = function() {
    this.$.drawWidth(3);
    this.$.drawClear();
    this.$.drawCircle(this.x, this.y, this.size + 20, true);
};

