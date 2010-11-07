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


// Factory ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Factory(game, planet, id, r, player, type, taken, needed) {
    this.$ = game;
    this.planet = planet;
    this.player = player;
    this.id = id;
    this.planet.factories[this.id] = this;
    
    this.r = r;
    this.type = this.$.factoryTypes[type];
    this.shipsNeeded = needed;
    this.shipsTaken = taken;
    
    this.build = this.shipsTaken === this.shipsNeeded;
    if (this.build) {
        this.planet.factoryCompleteCount++;
    }
    
    this.planet.factoryCount++;
    this.updated = false;
}

Factory.prototype.update = function(taken) {
    this.shipsTaken = taken;
    this.build = this.shipsTaken === this.shipsNeeded;
    
    if (this.build) {
        this.planet.factoryCompleteCount++;
    }
    this.$.drawBackground();
};

Factory.prototype.draw = function() {
    var scale = ((100 / this.shipsNeeded) * this.shipsTaken / 100) / 2.5 + 0.6;
    var size = 1.5 * scale;
    var r = this.r * Math.PI / 180;
    var x = this.planet.x + Math.cos(r) * (this.planet.size - 1);
    var y = this.planet.y + Math.sin(r) * (this.planet.size - 1);
    
    this.$.bbg.save();
    if (this.build) {
        this.$.drawColor(this.player.color);
    
    } else {
        this.$.drawShaded(this.player.color);
    }
    
    this.$.drawAlpha(scale);
    this.$.bbg.translate(x, y);
    this.$.bbg.beginPath();
//    if (this.type === 'def') {
//        this.$.bbg.rotate(r - Math.PI / 2);
//        this.$.bbg.moveTo(-3 * size, 0);
//        this.$.bbg.lineTo(-3 * size, 5 * size);
//        this.$.bbg.lineTo(3 * size, 5 * size);
//        this.$.bbg.lineTo(3 * size, 0);
//        
//    } else if (this.type === 'fight') {
//        this.$.bbg.rotate(r - Math.PI / 2);
//        this.$.bbg.moveTo(0, 6 * size);
//        this.$.bbg.lineTo(-4 * size, 0);
//        this.$.bbg.lineTo(4 * size, 0);
//        this.$.bbg.lineTo(0, 6 * size);
//    
//    } else if (this.type === 'bomb') {
        this.$.bbg.rotate(r + Math.PI / 2);
        this.$.bbg.arc(0, -0.5, 5 * size, Math.PI * 2, Math.PI * 2 + Math.PI, true);
//    }
    this.$.bbg.closePath();
    this.$.bbg.fill();
    this.$.bbg.restore();
};

Factory.prototype.destroy = function() {
    if (this.planet.factories[this.id]) {
        this.planet.factoryCount--;
        if (this.build) {
            this.planet.factoryCompleteCount--;
        }
        delete this.planet.factories[this.id];
        this.$.effectExplosion(this.player.color, this.planet, 0, this.r, 0, 10);
    }
};

