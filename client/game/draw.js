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

var EFFECT_EXPLOSION = 1;
var EFFECT_LASER = 2;


// Drawing ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.drawInit = function() {
    this.colors = ['#777777', '#f00000', '#0080ff', '#f0f000', '#00f000', '#9000ff'];
    this.colorsShaded = ['#303030', '#700000', '#004080', '#707000', '#007000', '#500080'];
    this.effects = [];
    
    this.canvas = $('bg');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.bg = this.canvas.getContext('2d');
    
    this.scale = 2;
    this.mouseX = -1;
    this.mouseY = -1;
    this.cameraX = 0;
    this.cameraY = 0;
};

Game.prototype.drawTick = function() {
    this.bg.save();
    this.bg.scale(this.scale, this.scale);    
    this.bg.translate(-this.cameraX, -this.cameraY);
    
    this.bg.globalCompositeOperation = 'source-over';
    this.bg.fillStyle = '#000000';
    this.bg.fillRect(0, 0, this.width, this.height);
    
    this.bg.globalCompositeOperation = 'lighter';
    if (this.sendPath.length > 0) {
        this.bg.lineCap = 'round';
        this.drawShaded(this.player.color);
        var from = this.player.selectPlanet;
        for(var i = 0, l = this.sendPath.length; i < l; i++) {
            this.drawWidth(4);
            this.bg.beginPath();
            
            var to = this.sendPath[i];
            var dx = to.x - from.x;
            var dy = to.y - from.y;
            var r = Math.atan2(dy, dx);
            this.bg.moveTo(from.x + Math.cos(r) * (from.size + 1),
                           from.y + Math.sin(r) * (from.size + 1));
              
            this.bg.lineTo(to.x - Math.cos(r) * (to.size + 1),
                           to.y - Math.sin(r) * (to.size + 1));
            
            this.bg.closePath();
            this.bg.stroke();
            
            if (to === this.sendPath[this.sendPath.length - 1]) {
                this.drawColor(this.player.color);
            }
            to.drawSelect();
            from = to;
        }
    }
    
    for(var i in this.ships) {
        this.ships[i].draw();
    }
    
    for(var i in this.planets) {
        this.planets[i].draw();
    }
    
    this.effectDraw();
    this.bg.restore();
};

Game.prototype.drawClear = function() {
    this.bg.fillStyle = '#000000';
};

Game.prototype.drawColor = function(color) {
    if (this.bg.fillStyle !== this.colors[color]) {
        this.bg.fillStyle = this.colors[color];
        this.bg.strokeStyle = this.colors[color];
    }
};

Game.prototype.drawShaded = function(color) {
    if (this.bg.fillStyle !== this.colorsShaded[color]) {
        this.bg.fillStyle = this.colorsShaded[color];
        this.bg.strokeStyle = this.colorsShaded[color];
    }
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
    if (this.bg.lineWidth !== width) {
        this.bg.lineWidth = width;
    }
};

Game.prototype.drawAlpha = function(value) {
    this.bg.globalAlpha = value;
};


// Effects ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.effectDraw = function() {
    var time = new Date().getTime();
    for(var i = 0, l = this.effects.length; i < l; i++) {
        var e = this.effects[i];
        
        // Particle died
        if (time > e.t + e.l) {
            this.effects.splice(i, 1);
            l--;
            i--;
        
        } else {
            var step = 100 / e.l;
            var delta = 1 - step * ((time - e.t) / 100);
            var x = e.p.x + Math.cos(e.r * Math.PI / 180) * (e.p.size + e.o);
            var y = e.p.y + Math.sin(e.r * Math.PI / 180) * (e.p.size + e.o);
            this.drawAlpha(delta);
            if (e.i === EFFECT_EXPLOSION) {
                this.drawWidth(0);
                this.drawColor(e.c);
                this.drawCircle(x, y, e.s * delta, true);
            }
        }
    }
    this.drawAlpha(1);
};

Game.prototype.effectExplosion = function(color, planet, orbit, r, size) {
    r = r + (Math.random() * 2 - 1);
    orbit = orbit + (Math.random() * 2.5 - 1.25);
    this.effects.push({i: EFFECT_EXPLOSION, t: new Date().getTime(), l: 2000,
                       s: size, c: color, p: planet, o: orbit, r: r});
};

