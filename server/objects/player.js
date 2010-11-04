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


var crypto = require('crypto');


// Player ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Player(game, client, color) {
    this.$ = game;
    this.id = this.$.playerID++;
    this.name = client.name;
    this.color = color;
    this.$.playerColors[color] = this.id;
    
    this.client = client;
    this.client.player = this;
    this.clientDropTick = -1;
    
    this.startPlanet = null;
    this.planetCount = 0;
    this.shipCount = 0;
    this.shipMaxCount = 0;
    this.$.players[this.id] = this;
    
    // Client Hash
    if (this.id !== 0) {
        var hash = crypto.createHash('md5');
        hash.update(new Date().getTime() + '-' + this.getTick() + '-'
                    + this.client.conn.id);
        
        this.clientHash = hash.digest('hex');
    
    } else {
        this.clientHash = null;
    }
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

