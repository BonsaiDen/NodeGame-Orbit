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
function Player(game, client, color) {
    this.$ = game;
    this.client = client;
    this.id = client.id;
    this.name = client.name;
    this.color = color;
    
    this.ships = {};
    this.shipCount = 0;
    this.shipMaxCount = 0;
    this.$.players[this.id] = this;
}

exports.Player = Player;


// Updates ---------------------------------------------------------------------
Player.prototype.tick = function() {

};


// Commands --------------------------------------------------------------------
Player.prototype.send = function(target) {
    if (this.selectPlanet && this.selectCount > 0) {
        this.selectPlanet.send(this, this.selectType, this.selectCount, target);
        this.selectCount = 0;
    
    } else {
        this.selectPlanet = target;
    }
};


// Helpers ---------------------------------------------------------------------
Player.prototype.getTick = function() {
    return this.$.getTick();
};

