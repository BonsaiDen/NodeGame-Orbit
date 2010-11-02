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


// Drawing ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.drawInit = function() {
    this.colors = ['#f00000', '#0080ff', '#f0f000', '#00f000', '#9000ff', '#777777'];
    this.colorsShaded = ['#700000', '#004080', '#707000', '#007000', '#500080', '#303030'];
    
    this.canvas = $('bg');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.bg = this.canvas.getContext('2d');
    this.bg.font = 'bold 12px' + ' "Tahoma", "DejaVu Sans Mono", "Bitstream Vera Sans Mono"';
};

Game.prototype.drawTick = function() {
    this.bg.globalCompositeOperation = 'source-over';
    this.bg.fillStyle = '#000000';
    this.bg.fillRect(0, 0, this.width, this.height);
    
    this.bg.globalCompositeOperation = 'lighter';
    if (this.sendPath.length > 0) {
        this.bg.lineCap = 'round';
        this.drawWidth(4);
        this.drawShaded(this.player.color);
        
        var ox = this.player.selectPlanet.x;
        var oy = this.player.selectPlanet.y;
        
        this.bg.beginPath();
        for(var i = 0, l = this.sendPath.length; i < l; i++) {
            var tx = this.sendPath[i].x;
            var ty = this.sendPath[i].y;
            this.bg.moveTo(ox, oy);
            this.bg.lineTo(tx, ty);
            ox = tx;
            oy = ty;
        }
        this.bg.closePath();
        this.bg.stroke();
    }
    
    for(var i in this.ships) {
        this.ships[i].draw();
    }
    
    for(var i in this.planets) {
        this.planets[i].draw();
    }
};

Game.prototype.drawClear = function() {
    this.bg.fillStyle = '#000000';
};

Game.prototype.drawClearScreen = function() {
    this.bg.globalCompositeOperation = 'source-over';
    this.bg.fillStyle = '#000000';
    this.bg.fillRect(0, 0, this.width, this.height);
};

Game.prototype.drawColor = function(color) {
    this.bg.fillStyle = this.colors[color];
    this.bg.strokeStyle = this.colors[color];
};

Game.prototype.drawShaded = function(color) {
    this.bg.fillStyle = this.colorsShaded[color];
    this.bg.strokeStyle = this.colorsShaded[color];
};

Game.prototype.drawCircle = function(x, y, size, filled) {
    this.bg.beginPath();
    this.bg.arc(x, y, size, 0, Math.PI * 2, true);
    this.bg.closePath();
    
    if (filled) {
        this.bg.fill();
    
    } else {
        this.bg.stroke();
    }
};

Game.prototype.drawText = function(x, y, text, align, baseline) {
    this.bg.textAlign = align;
    this.bg.textBaseline = baseline;
    this.bg.fillText(text, x, y);   
};

Game.prototype.drawLine = function(ox, oy, tx, ty) {
    this.bg.beginPath();
    this.bg.moveTo(ox, oy);
    this.bg.lineTo(tx, ty);
    this.bg.closePath();
    this.bg.stroke();
};

Game.prototype.drawWidth = function(width) {
    this.bg.lineWidth = width;
};

Game.prototype.drawAlpha = function(value) {
    this.bg.globalAlpha = value;
};

Game.prototype.drawShip = function(type, x, y, r, clear) {
    if (!clear) {
        this.drawWidth(1.5);
        this.drawCircle(x, y, 1, false);
    
    } else {
        this.drawWidth(2);
        this.drawCircle(x, y, 3, true);
    }
};

