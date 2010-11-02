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


// Input -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.inputInit = function(full) {
    var that = this;
    this.moveTimeout = null;
    this.inputHover = null;
    this.inputSelected = null;
    this.inputSend = false;
    this.mouseDrag = false;
    this.mouseDragCX = 0;
    this.mouseDragCY = 0;   
    this.mouseDragX = 0;
    this.mouseDragY = 0;
    
    if (full) {
        this.canvas.addEventListener('mousemove', function(e) {
            e = e || window.event;
            clearTimeout(that.moveTimeout);
            that.moveTimeout = setTimeout(function() {
                var x = e.clientX - that.canvas.offsetLeft + window.scrollX;
                var y = e.clientY - that.canvas.offsetTop + window.scrollY;
                that.mouseX = x;
                that.mouseY = y;
                that.inputMove(x, y);
            }, 5);
        
        }, false);
        
        this.canvas.addEventListener('mouseout', function(e) {
            clearTimeout(that.moveTimeout);
            that.moveTimeout = setTimeout(function() {
                that.inputMove(-1, -1);
            }, 5);
        
        }, false);
        
        this.canvas.addEventListener('contextmenu', function(e) {
            that.inputClick(e || window.event);
            e.preventDefault();
            return false;
        }, false);  
        
        this.canvas.addEventListener('mousedown', function(e) {
            that.inputDown(e || window.event);
        }, false);
        
        this.canvas.addEventListener('mouseup', function(e) {
            that.inputUp(e || window.event);
        }, false);
        
        this.canvas.addEventListener('click', function(e) {
            that.inputClick(e || window.event);
        }, false); 
        
        this.canvas.addEventListener('dblclick', function(e) {
            that.inputDoubleClick(e || window.event);
        }, false); 
    }
        
    // Keyboard Input
    this.keys = {};
    window.onkeydown = window.onkeyup = function(e) {
        var key = e.keyCode;
        if (key !== 116 && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            if (e.type === "keydown") {
                that.keys[key] = 1;
            
            } else {
                that.keys[key] = 2;
            }
            e.preventDefault();
            return false;
        }
    };
    
    window.onblur = function(e) {
        that.keys = {};
        that.mouseDrag = false;
    };
};


// Keyboard --------------------------------------------------------------------
Game.prototype.inputKeyboard = function() {
    if (this.keys[39] || this.keys[68]) {
        this.cameraX += 8;
        this.inputMove(this.mouseX, this.mouseY);
    
    } else if (this.keys[37] || this.keys[65]) {
        this.cameraX -= 8;
        this.inputMove(this.mouseX, this.mouseY);
    }
    
    if (this.keys[40] || this.keys[83]) {
        this.cameraY += 8;
        this.inputMove(this.mouseX, this.mouseY);
    
    } else if (this.keys[38] || this.keys[87]) {
        this.cameraY -= 8;
        this.inputMove(this.mouseX, this.mouseY);
    }
    
    this.cameraX = Math.min(this.cameraX, this.width - this.width / this.scale);
    this.cameraX = Math.max(this.cameraX, 0);
    this.cameraY = Math.min(this.cameraY, this.height - this.height / this.scale);
    this.cameraY = Math.max(this.cameraY, 0);
    
    for(var i in this.keys) {
        if (this.keys[i] === 2) {
            this.keys[i] = 0;
        }
    }
};


// Mouse -----------------------------------------------------------------------
Game.prototype.inputMove = function(x, y) {
    if (!this.player) {
        return;
    }
    
    // Mouse Dragging
    if (this.mouseDrag) {
        if (x === -1) {
            this.mouseDrag = false;
            return;
        }
    
        var mx = this.mouseDragX - x;
        var my = this.mouseDragY - y;
        
        this.updateBackground = true;
        this.cameraX = this.mouseDragCX + mx * 1.25 / this.scale;
        this.cameraY = this.mouseDragCY + my * 1.25 / this.scale;
        this.cameraX = Math.min(this.cameraX, this.width - this.width / this.scale);
        this.cameraX = Math.max(this.cameraX, 0);
        this.cameraY = Math.min(this.cameraY, this.height - this.height / this.scale);
        this.cameraY = Math.max(this.cameraY, 0);
        return;
    }
    x = this.cameraX + (x / this.scale);
    y = this.cameraY + (y / this.scale);
    
    // Select Planet
    var oldHover = this.inputHover;
    var newHover = null;
    if (this.x !== -1) {
        for(var i in this.planets) {
            var p = this.planets[i];
            var dx = p.x - x;
            var dy = p.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < p.size) {
                newHover = p;
            }
        }
    }
    
    // Calculate path and stuff
    if (oldHover !== newHover) {
        this.updateBackground = true;
        if (this.oldHover) {
            this.player.selectStop();
        }
        if (this.player.selectPlanet && this.player.selectCount > 0) {
            if (newHover) {
                this.sendPath = this.corePath(this.player.selectPlanet,
                                              newHover, this.player);
            
            } else {
                if (this.sendPath.length > 0) {
                    this.clearBackground = true;
                }
                this.sendPath = [];
            }
        }
    }
    this.inputHover = newHover;
};

Game.prototype.inputDown = function(e) {
    if (this.inputHover && !this.inputSend) {
        if (e.button === 0) {
            if (this.player.selectPlanet) {
                this.sendPath = [];
                this.clearBackground = true;
            }
            if (this.player.selectPlanet
                && this.inputHover !== this.player.selectPlanet
                && this.player.selectCount > 0) {
                
                this.player.send(this.inputHover);
                this.inputSend = true;
            
            } else {
                this.player.selectStart(this.inputHover, 'fight');
            }
        }
    
    } else if (!this.inputHover) {
        this.mouseDragCX = this.cameraX;
        this.mouseDragCY = this.cameraY;   
        this.mouseDragX = this.mouseX;
        this.mouseDragY = this.mouseY;
        this.mouseDrag = true;
    }
};

Game.prototype.inputUp = function(e) {
    if (this.inputHover) {
        if (!this.inputSend) {
            this.player.selectStop();
        }
        this.inputSend = false;
        this.updateBackground = true;
    }
    this.mouseDrag = false;
};

Game.prototype.inputClick = function(e) {
    if (this.inputHover && e.button === 2) {
        this.player.stop(this.inputHover);
    
    } else if (!this.inputHover) {
        this.player.selectCancel();
        this.updateBackground = true;
    }
};

Game.prototype.inputDoubleClick = function(e) {
    if (this.inputHover) {
        this.player.selectAll();
        this.updateBackground = true;
    }
};

