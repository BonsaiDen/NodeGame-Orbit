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
    this.mouseDragDown = false;
    
    this.scale = 2;
    this.mouseX = -1;
    this.mouseY = -1;
    this.worldX = 0;
    this.worldY = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraOldX = 0;
    this.cameraOldY = 0;
    
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
        that.mouseDragDown = false;
    };
};


// Keyboard --------------------------------------------------------------------
Game.prototype.inputKeyboard = function() {

    // Camera Controls
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
    
    this.cameraX = Math.min(this.cameraX, this.width - this.viewWidth);
    this.cameraX = Math.max(this.cameraX, 0);
    this.cameraY = Math.min(this.cameraY, this.height - this.viewHeight);
    this.cameraY = Math.max(this.cameraY, 0);
    
    // Reset Key States
    for(var i in this.keys) {
        if (this.keys[i] === 2) {
            this.keys[i] = 0;
        }
    }
};


// Mouse -----------------------------------------------------------------------
Game.prototype.inputMove = function(ox, oy) {
    // Mouse Dragging
    if (ox === -1 || oy === -1) {
        this.mouseDragDown = false;
        this.mouseDrag = false;
    }
    
    if (this.mouseDragDown) {
        if (Math.abs(this.mouseDragX - this.mouseX) > 2
            || Math.abs(this.mouseDragY - this.mouseY) > 2) {
            
            this.mouseDrag = true;
        }
    }
    if (this.mouseDrag) {
        return this.inputDragMouse(ox, oy);
    }
    
    // World Position
    this.worldX = this.cameraX + (ox / this.scale);
    this.worldY = this.cameraY + (oy / this.scale);
    
    // Select Planet
    var oldHover = this.inputHover;
    var newHover = null;
    if (ox !== -1) {
        for(var i in this.planets) {
            var p = this.planets[i];
            var dx = p.x - this.worldX;
            var dy = p.y - this.worldY;
            if (Math.sqrt(dx * dx + dy * dy) < p.size + 2) {
                newHover = p;
            }
        }
    }
    
    // Calculate paths
    if (oldHover !== newHover) {
        this.drawBackground(this.sendPath.length > 0);
        if (this.oldHover) {
            this.player.selectStop();
        }
        if (this.player.selectPlanet && this.player.selectCountAll() > 0) {
            if (newHover) {
                this.sendPath = this.corePath(this.player.selectPlanet,
                                              newHover, this.player);
            
            } else {
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
                this.drawBackground(true);
            }
            if (this.player.selectPlanet
                && this.inputHover !== this.player.selectPlanet
                && this.player.selectCountAll() > 0) {
                
                this.player.send(this.inputHover);
                this.inputSend = true;
            
            } else {
                this.player.selectStart(this.inputHover);
            }
        }
    
    } else if (!this.inputHover && e.button === 0) {
        this.mouseDragCX = this.cameraX;
        this.mouseDragCY = this.cameraY;   
        this.mouseDragX = this.mouseX;
        this.mouseDragY = this.mouseY;
        this.mouseDragDown = true;
    }
};

Game.prototype.inputUp = function(e) {
    if (this.inputHover && !this.mouseDrag) {
        if (!this.inputSend) {
            this.player.selectStop();
        }
        this.inputSend = false;
        this.drawBackground();
    }
};

Game.prototype.inputClick = function(e) {
    if (this.inputHover && e.button === 2) {
        this.player.stop(this.inputHover);
    
    } else if (!this.inputHover && !this.mouseDrag) {
        this.player.selectCancel();
        this.drawBackground();
    }
    this.mouseDrag = false;
    this.mouseDragDown = false;
};

Game.prototype.inputDoubleClick = function(e) {
    if (this.inputHover) {
        this.player.selectAll();
        this.drawBackground();
    }
    this.mouseDrag = false;
    this.mouseDragDown = false;
};

Game.prototype.inputDragMouse = function(x, y) {
    if (x === -1) {
        this.mouseDrag = false;
        return;
    }
    
    var mx = this.mouseDragX - x;
    var my = this.mouseDragY - y;
    
    this.drawBackground();
    this.cameraX = this.mouseDragCX + mx * 1.25 / this.scale;
    this.cameraY = this.mouseDragCY + my * 1.25 / this.scale;
    this.cameraX = Math.min(this.cameraX, this.width - this.viewWidth);
    this.cameraX = Math.max(this.cameraX, 0);
    this.cameraY = Math.min(this.cameraY, this.height - this.viewHeight);
    this.cameraY = Math.max(this.cameraY, 0);
};

