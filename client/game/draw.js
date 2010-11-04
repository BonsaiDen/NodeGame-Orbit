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
    this.colors = ['#777777', '#f00000', '#0080ff',
                   '#f0f000', '#00f000', '#9000ff'];
    
    this.colorsShaded = ['#404040', '#800000', '#005090',
                         '#808000', '#008000', '#600090'];
    
    this.colorsDark = ['#202020', '#500000', '#002060',
                       '#505000', '#005000', '#300060'];
    
    this.effects = [];
    this.effectsClear = [];
    
    // Foreground
    this.canvas = $('bg');
    this.fbg = this.canvas.getContext('2d');
    this.fbg.globalCompositeOperation = 'lighter'; 
    
    this.viewWidth = this.canvas.width / 2;
    this.viewHeight = this.canvas.height / 2;
    
    // Background
    this.canvasBack = $('bgg');
    this.bbg = this.canvasBack.getContext('2d');
    this.updateBackground = true;
    this.clearBackground = false;    
    this.cbg = this.fbg;
    
    // Stuff
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
    if (this.updateBackground || (sx !== 0 || sy !== 0)) {
        this.bbg.save();
        this.bbg.scale(this.scale, this.scale);    
        this.bbg.translate(-this.cameraX, -this.cameraY);
        if (this.clearBackground) {
            this.bbg.clearRect(this.cameraX, this.cameraY, this.viewWidth, this.viewHeight);
            this.clearBackground = false;
        
        } else {
            for(var i in this.planets) {
                this.planets[i].clear(sx, sy);
            }
        }
        
        if (this.sendPath.length > 0) {
            this.drawBack();
            this.bbg.lineCap = 'round';
            
            var from = this.player.selectPlanet;
            if (from) {
                this.drawShaded(this.player.color);
                this.bbg.globalCompositeOperation = 'lighter';
                for(var i = 0, l = this.sendPath.length; i < l; i++) {
                    var to = this.sendPath[i];
                    var dx = to.x - from.x;
                    var dy = to.y - from.y;
                    
                    // Clear
                    this.bbg.clearRect((to.x > from.x ? from.x : to.x) - sx,
                                       (to.y > from.y ? from.y : to.y) - sy,
                                       Math.abs(dx), Math.abs(dy));
                    
                    var r = Math.atan2(dy, dx);
                    
                    // Arrows
                    var d = (Math.sqrt(dx * dx + dy * dy) - from.size - 22 - to.size) / 4;
                    for(var e = 1; e < 4; e++) {
                        this.bbg.save();
                        this.bbg.translate(from.x + (Math.cos(r) * (from.size + 11 + d * e)),
                                           from.y + (Math.sin(r) * (from.size + 11 + d * e)));
                        
                        this.bbg.rotate(r + Math.PI / 2);
                        this.drawDark(this.player.color);
                        this.drawPathArrow(false);
                        this.drawShaded(this.player.color);
                        this.drawPathArrow(true);
                        this.bbg.restore();
                    }
                    from = to;
                }
                
                // Select Rings
                this.bbg.globalCompositeOperation = 'source-over';
                this.drawDark(this.player.color);
                for(var i = 0, l = this.sendPath.length; i < l; i++) {
                    var p = this.sendPath[i];  
                    if (p === this.sendPath[this.sendPath.length - 1]) {
                        this.drawColor(this.player.color);
                    }
                    p.drawSelect();
                }
            
            } else {
                this.clearBackground = true;
            }
            this.drawFront();
        }
        
        this.updateBackground = false;
        for(var i in this.planets) {
            this.planets[i].draw();
        }
        this.bbg.restore();
    }
    
    // Foreground
    this.fbg.save();
    this.fbg.scale(this.scale, this.scale);    
    this.fbg.translate(-this.cameraX, -this.cameraY);
    for(var i in this.ships) {
        this.ships[i].clear(sx, sy);
    }
    this.effectClear(sx, sy);
    
    this.fbg.globalCompositeOperation = 'lighter';
    for(var i in this.ships) {
        this.ships[i].draw(sx, sy);
    }
    this.effectDraw();
    this.fbg.restore();
    this.cameraOldX = this.cameraX;
    this.cameraOldY = this.cameraY;
};

Game.prototype.drawBackground = function(clear) {
    this.updateBackground = true;
    if (clear) {
        this.clearBackground = true;
    }
};


// Visibility ------------------------------------------------------------------
Game.prototype.shipVisbile = function(ship, sx, sy) {
    sx = sx || 0;
    sy = sy || 0;
    if (ship.x >= this.cameraX - 8 + sx
        && ship.x <= this.cameraX + this.viewWidth + sx + 8) {
        
        if (ship.y >= this.cameraY - 8 + sy
            && ship.y <= this.cameraY + this.viewHeight + sy + 8) {
            return true;
        }
    }
    return false;
};

Game.prototype.planetVisbile = function(p, sx, sy) {
    sx = sx || 0;
    sy = sy || 0;
    if (p.x >= this.cameraX - 8 - p.size + sx
        && p.x <= this.cameraX + this.viewWidth + sx + p.size + 8) {
        
        if (p.y >= this.cameraY - 8 - p.size + sy
            && p.y <= this.cameraY + this.viewHeight + sy + p.size + 8) {
            return true;
        }
    }
    return false;
};

Game.prototype.effectVisible = function(x, y, s) {
    if (x >= this.cameraX - 8 - s && x <= this.cameraX + this.viewWidth + s + 8) {
        if (y >= this.cameraY - 8 - s && y <= this.cameraY + this.viewHeight + s + 8) {
            return true;
        }
    }
    return false;
};

// Basic Drawing ---------------------------------------------------------------
Game.prototype.drawBack = function() {
    this.cbg = this.bbg;
};

Game.prototype.drawFront = function() {
    this.cbg = this.fbg;
};

Game.prototype.drawColor = function(color) {
    if (this.cbg.fillStyle !== this.colors[color]) {
        this.cbg.fillStyle = this.colors[color];
        this.cbg.strokeStyle = this.colors[color];
    }
};

Game.prototype.drawShaded = function(color) {
    if (this.cbg.fillStyle !== this.colorsShaded[color]) {
        this.cbg.fillStyle = this.colorsShaded[color];
        this.cbg.strokeStyle = this.colorsShaded[color];
    }
};

Game.prototype.drawDark = function(color) {
    if (this.cbg.fillStyle !== this.colorsDark[color]) {
        this.cbg.fillStyle = this.colorsDark[color];
        this.cbg.strokeStyle = this.colorsDark[color];
    }
};

Game.prototype.drawPathLine = function(from, to, r) {
    this.bbg.beginPath();
    this.bbg.moveTo(from.x + Math.cos(r) * (from.size + 1),
                    from.y + Math.sin(r) * (from.size + 1));
    
    this.bbg.lineTo(to.x - Math.cos(r) * (to.size + 1),
                    to.y - Math.sin(r) * (to.size + 1));
    
    this.bbg.closePath();
    this.bbg.stroke();
};

Game.prototype.drawPathArrow = function(small) {
    this.bbg.beginPath();
    this.bbg.moveTo(0, small ? -2.5 : -5);
    this.bbg.lineTo(small ? -3.5 : -5, small ? 3.5 : 4.5);
    this.bbg.lineTo(small ? 3.5 : 5, small ? 3.5 : 4.5);
    this.bbg.lineTo(0, small ? -2.5 : -5);
    this.bbg.closePath();
    this.bbg.fill();
};

Game.prototype.drawCircle = function(x, y, size, filled) {
    this.cbg.beginPath();
    this.cbg.arc(x, y, size, 0, Math.PI * 2, true);
    this.cbg.closePath();
    
    if (filled) {
        this.cbg.fill();
    
    } else {
        this.cbg.stroke();
    }
};

Game.prototype.drawText = function(x, y, text, align, baseline, scale) {
    this.cbg.save();
    this.cbg.translate(x, y);
    this.cbg.scale(scale, scale);
    this.cbg.textAlign = align;
    this.cbg.textBaseline = baseline;
    this.cbg.fillText(text, 0, 0);
    this.cbg.restore();
};

Game.prototype.drawLine = function(ox, oy, tx, ty) {
    this.cbg.beginPath();
    this.cbg.moveTo(ox, oy);
    this.cbg.lineTo(tx, ty);
    this.cbg.closePath();
    this.cbg.stroke();
};

Game.prototype.drawWidth = function(width) {
    if (this.cbg.lineWidth !== width) {
        this.cbg.lineWidth = width;
    }
};

Game.prototype.drawAlpha = function(value) {
    this.cbg.globalAlpha = value;
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
        this.fbg.clearRect(e[0] - e[2] * 2 - sx,
                          e[1] - e[2] * 2 - sy,
                          e[2] * 4, e[2] * 4);
    }
    this.effectsClear = [];
};

Game.prototype.effectExplosion = function(color, planet, orbit, r, rs, size) {
    r = r + (Math.random() * rs * 2 - rs);
    orbit = orbit + (Math.random() * 1.5 - 0.75);
    this.effects.push({i: EFFECT_EXPLOSION, t: new Date().getTime(), l: 2000,
                       s: size, c: color, p: planet, o: orbit, r: r});
};

