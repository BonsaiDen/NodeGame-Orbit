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
    this.effectsClear = [];
    
    this.canvas = $('bg');
    this.bg = this.canvas.getContext('2d');
    this.bg.globalCompositeOperation = 'lighter'; 
    
    this.canvasBack = $('bgg');
    this.bgg= this.canvasBack.getContext('2d');
    this.updateBackground = true;
    this.clearBackground = false;
    this.curBG = this.bg;
    
    this.scale = 2;
    this.mouseX = -1;
    this.mouseY = -1;
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraOldX = 0;
    this.cameraOldY = 0;
};

Game.prototype.drawTick = function() {
    var sx = this.cameraOldX - this.cameraX;
    var sy = this.cameraOldY - this.cameraY;
    
    // Background
    if (this.updateBackground || sx !== 0 || sy !== 0
        || (this.getTick() % 4 === 0
        && (this.inputHover || (this.player && this.player.selectPlanet)))) {
        
        this.bgg.save();
        this.bgg.scale(this.scale, this.scale);    
        this.bgg.translate(-this.cameraX, -this.cameraY);
        if (this.sendPath.length > 0 && (sx !== 0 || sy !== 0)) {
            this.clearBackground = true;
        }
        if (this.clearBackground) {
            this.bgg.clearRect(this.cameraX, this.cameraY, 320, 240);
            this.clearBackground = false;
        
        } else {
            for(var i in this.planets) {
                this.planets[i].clear(sx, sy);
            }
        }
        
        if (this.sendPath.length > 0) {
            this.drawBack();
            this.bgg.lineCap = 'round';
            this.drawShaded(this.player.color);
            var from = this.player.selectPlanet;
            for(var i = 0, l = this.sendPath.length; i < l; i++) {
                this.drawWidth(4);
                this.bgg.beginPath();
                
                var to = this.sendPath[i];
                var dx = to.x - from.x;
                var dy = to.y - from.y;
                var r = Math.atan2(dy, dx);
                this.bgg.moveTo(from.x + Math.cos(r) * (from.size + 1),
                               from.y + Math.sin(r) * (from.size + 1));
                
                this.bgg.lineTo(to.x - Math.cos(r) * (to.size + 1),
                               to.y - Math.sin(r) * (to.size + 1));
                
                this.bgg.closePath();
                this.bgg.stroke();
                
                if (to === this.sendPath[this.sendPath.length - 1]) {
                    this.drawColor(this.player.color);
                }
                to.drawSelect();
                from = to;
            }
            this.drawFront();
        }
       
        for(var i in this.planets) {
            this.planets[i].draw();
        }
        this.bgg.restore();
        this.updateBackground = false;
    }
    
    // Foreground
    this.bg.save();
    this.bg.scale(this.scale, this.scale);    
    this.bg.translate(-this.cameraX, -this.cameraY);
    for(var i in this.ships) {
        this.ships[i].clear(sx, sy);
    }
    this.effectClear(sx, sy);
    
    this.bg.globalCompositeOperation = 'lighter';
    for(var i in this.ships) {
        this.ships[i].draw(sx, sy);
    }
    this.effectDraw();
    this.bg.restore();
    this.cameraOldX = this.cameraX;
    this.cameraOldY = this.cameraY;
};


// Visibility ------------------------------------------------------------------
Game.prototype.shipVisbile = function(ship, sx, sy) {
    sx = sx || 0;
    sy = sy || 0;
    if (ship.x >= this.cameraX - 8 + sx && ship.x <= this.cameraX + 320 + sx + 8) {
        if (ship.y >= this.cameraY - 8 + sy && ship.y <= this.cameraY + 240 + sy + 8) {
            return true;
        }
    }
    return false;
};

Game.prototype.planetVisbile = function(p, sx, sy) {
    sx = sx || 0;
    sy = sy || 0;
    if (p.x >= this.cameraX - 8 - p.size + sx && p.x <= this.cameraX + 320 + sx + p.size + 8) {
        if (p.y >= this.cameraY - 8 - p.size + sy && p.y <= this.cameraY + 240 + sy + p.size + 8) {
            return true;
        }
    }
    return false;
};

Game.prototype.effectVisible = function(x, y, s) {
    if (x >= this.cameraX - 8 - s && x <= this.cameraX + 320 + s + 8) {
        if (y >= this.cameraY - 8 - s && y <= this.cameraY + 240 + s + 8) {
            return true;
        }
    }
    return false;
};

// Basic Drawing ---------------------------------------------------------------
Game.prototype.drawBack = function() {
    this.curBG = this.bgg;
};

Game.prototype.drawFront = function() {
    this.curBG = this.bg;
};

Game.prototype.drawColor = function(color) {
    if (this.curBG.fillStyle !== this.colors[color]) {
        this.curBG.fillStyle = this.colors[color];
        this.curBG.strokeStyle = this.colors[color];
    }
};

Game.prototype.drawShaded = function(color) {
    if (this.curBG.fillStyle !== this.colorsShaded[color]) {
        this.curBG.fillStyle = this.colorsShaded[color];
        this.curBG.strokeStyle = this.colorsShaded[color];
    }
};

Game.prototype.drawCircle = function(x, y, size, filled) {
    this.curBG.beginPath();
    this.curBG.arc(x, y, size, 0, Math.PI * 2, true);
    this.curBG.closePath();
    
    if (filled) {
        this.curBG.fill();
    
    } else {
        this.curBG.stroke();
    }
};

Game.prototype.drawText = function(x, y, text, align, baseline, scale) {
    this.curBG.save();
    this.curBG.translate(x, y);
    this.curBG.scale(scale, scale);
    this.curBG.textAlign = align;
    this.curBG.textBaseline = baseline;
    this.curBG.fillText(text, 0, 0);
    this.curBG.restore();
};

Game.prototype.drawLine = function(ox, oy, tx, ty) {
    this.curBG.beginPath();
    this.curBG.moveTo(ox, oy);
    this.curBG.lineTo(tx, ty);
    this.curBG.closePath();
    this.curBG.stroke();
};

Game.prototype.drawWidth = function(width) {
    if (this.curBG.lineWidth !== width) {
        this.curBG.lineWidth = width;
    }
};

Game.prototype.drawAlpha = function(value) {
    this.curBG.globalAlpha = value;
};


// Effects ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.effectDraw = function() {
    var time = new Date().getTime();
    this.drawWidth(0);
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
            
            if (this.effectVisible(x, y, e.s * delta)) {
                this.drawAlpha(delta);
                if (e.i === EFFECT_EXPLOSION) {
                    this.drawColor(e.c);
                    this.drawCircle(x, y, e.s * delta, true);
                    this.effectsClear.push([x, y, e.s * delta]);
                }
            }
        }
    }
    this.drawAlpha(1);
};

Game.prototype.effectClear = function(sx, sy) {
    for(var i = 0, l = this.effectsClear.length; i < l; i++) {
        var e = this.effectsClear[i];
        this.bg.clearRect(e[0] - e[2] * 2 - sx,
                          e[1] - e[2] * 2 - sy,
                          e[2] * 4, e[2] * 4);
    }
    this.effectsClear = [];
};

Game.prototype.effectExplosion = function(color, planet, orbit, r, size) {
    r = r + (Math.random() * 2 - 1);
    orbit = orbit + (Math.random() * 2.5 - 1.25);
    this.effects.push({i: EFFECT_EXPLOSION, t: new Date().getTime(), l: 2000,
                       s: size, c: color, p: planet, o: orbit, r: r});
};

