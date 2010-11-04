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


var MSG_PLAYER_ADD = 1;
var MSG_PLAYER_REMOVE = 2;
var MSG_GAME_JOIN = 3;
var MSG_GAME_INIT = 4;
var MSG_PLANETS_INIT = 5;
var MSG_PLANETS_UPDATE = 6;
var MSG_GAME_TICK = 7;
var MSG_SHIPS_UPDATE = 8;
var MSG_SHIPS_DESTROY = 9;


// Network ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.onConnect = function(succes) {
    var options = document.location.search.substr(1).split('&');
    var gameID = parseInt(options[0]) || 0;
    var watch = options.length > 1 ? options[1] === 'watch' : false;
    
    var hash = '';
    try {
        hash = (localStorage.getItem('clientHash-' + gameID) || '') + '';
    } catch(e) {   
    }
    
    this.$$.send(['init', 'Bonsai', gameID, watch, hash]);
    
    // Reset
    this.planetList = [];
    this.planets = {};
    this.players = {};
    this.ships = {};
    this.shipList = [];
};

Game.prototype.onMessage = function(msg) {
    if (this.running) {
        this.messageQueue.push(msg);
    
    } else {
        this.netMessage(msg);
    }
};

Game.prototype.send = function(msg) {
    this.$$.send(msg);
};

Game.prototype.onClose = function(msg) {
    this.running = false;
    this.planets = {};
    this.players = {};
    this.ships = {};
    this.shipList = [];
    this.player = null;
};


// Messages --------------------------------------------------------------------
Game.prototype.netMessage = function(msg) {
    var type = msg.shift();
    if (type === MSG_GAME_INIT) {
        this.gameID = msg[0];
        this.width = msg[1];
        this.height = msg[2];
        this.combatTickRate = msg[3];
        
        this.shipTypes = msg[4];
        this.shipSpeeds = msg[5];
        this.shipOrbits = msg[6];
        this.shipToOrbitSpeed = msg[7];
    
    } else if (type === MSG_PLANETS_INIT) {
        this.netPlanetsInit(msg[0]);
    
    } else if (type === MSG_PLANETS_UPDATE) {
        this.netPlanetsUpdate(msg[0]);
    
    } else if (type === MSG_SHIPS_UPDATE) {
        this.netShipsUpdate(msg[0]);
    
    } else if (type === MSG_SHIPS_DESTROY) {
        this.netShipsDestroy(msg[0]);
    
    } else if (type === MSG_GAME_TICK) {
        this.tickCount = msg[0];
    
    } else if (type === MSG_PLAYER_ADD) {
        new Player(this, msg[0], msg[1], msg[2], false);
    
    } else if (type === MSG_PLAYER_REMOVE) {
        this.players[msg[0]].remove();
    
    } else if (type === MSG_GAME_JOIN) {
    
        // Player
        if (msg[0] !== null) {
            this.player = this.players[msg[0]];
        
        } else {
            this.player = new Player(this, -1, '', -1, true);
        }
        
        // Hash
        try {
            if (msg[2] !== null) {
                localStorage.setItem('clientHash-' + this.gameID, msg[2]);
            }
        
        } catch(e) {
        }
        
        // Stuff
        this.drawInit();
        this.cameraOldX = this.cameraX;
        this.cameraOldY = this.cameraY;
        this.inputInit();
        
        if (!this.player.watch) {
            $('bgs').style.borderColor = this.colorsShaded[this.player.color];
            if (this.planets[msg[1]]) {
                this.cameraX = this.planets[msg[1]].x - this.width / 4;
                this.cameraY = this.planets[msg[1]].y - this.height / 4;
            }
        
        } else {
            this.cameraX = this.width / 2 - this.width / 4;
            this.cameraY = this.height / 2 - this.height / 4;
        }
        this.running = true;
        this.run();
    }
};


// Planets ---------------------------------------------------------------------
Game.prototype.netPlanetsInit = function(data) {
    for(var i = 0; i < data.length; i++) {
        var d = data[i];
        var p = new Planet(this, d[0], d[1], d[2], d[3], this.players[d[4]], d[5], d[6]);
        this.planets[d[0]] = p;
        this.planetList.push(p);
        
        for(var e in this.players) {
            if (!p.ships[e]) {
                p.ships[e] = {fight: [], bomb: [], def: []};
            }
        }
    }
    this.updateBackground = true;
};

Game.prototype.netPlanetsUpdate = function(data) {
    for(var i = 0; i < data.length; i++) {
        var d = data[i];
        this.planets[d[0]].player = this.players[d[1]];
        this.planets[d[0]].maxCount = d[2];
    }
    this.updateBackground = true;
};


// Ships -----------------------------------------------------------------------
Game.prototype.netShipsUpdate = function(data) {
    for(var i = 0; i < data.length; i++) {
        var id = data[i][1];
        var ship = this.ships[id];
        if (!ship) {
            ship = this.ships[id] = new Ship(this, id);
        }
        ship.update(data[i]);
    }
};

Game.prototype.netShipsDestroy = function(data) {
    for(var i = 0; i < data.length; i++) {
        if (this.ships[data[i]]) {
            this.ships[data[i]].destroy();
            delete this.ships[data[i]];
        }
    }
};

