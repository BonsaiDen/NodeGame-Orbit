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
var MSG_GAME_START = 3;
var MSG_GAME_SIZE = 4;
var MSG_PLANETS_INIT = 5;
var MSG_PLANETS_UPDATE = 6;
var MSG_GAME_TICK = 7;
var MSG_SHIPS_UPDATE = 8;
var MSG_SHIPS_DESTROY = 9;


// Network ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.onConnect = function(succes) {
    this.$$.send(['init', 'Bonsai']);
    this.planets = {};
    this.players = {};
    this.ships = {};
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
};


// Messages --------------------------------------------------------------------
Game.prototype.netMessage = function(msg) {
    var type = msg.shift();
    if (type === MSG_GAME_SIZE) {
        this.width = msg[0];
        this.height = msg[1];
        this.maxDistance = msg[2];
        this.shipSpeed = msg[3];
    
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
        new Player(this, msg[0], msg[1], msg[2]);
    
    } else if (type === MSG_PLAYER_REMOVE) {
        this.players[msg[0]].remove();
    
    } else if (type === MSG_GAME_START) {
        this.player = this.players[msg[0]];
        this.drawInit();
        if (this.player) {
            this.inputInit();
            this.canvas.style.borderColor = this.colorsShaded[this.player.color];
            if (this.planets[msg[1]]) {
                this.cameraX = this.planets[msg[1]].x - this.width / 2 / this.scale;
                this.cameraY = this.planets[msg[1]].y - this.height / 2 / this.scale;
            }
        }
        this.running = true;
        this.run();
    }
};


// Planets ---------------------------------------------------------------------
Game.prototype.netPlanetsInit = function(data) {
    this.planetNodes = [];
    this.planetList = [];
    this.planets = {};
    
    for(var i = 0; i < data.length; i++) {
        var d = data[i];
        var p = new Planet(this, d[0], d[1], d[2], d[3], this.players[d[4]] || null);
        this.planets[d[0]] = p;
        this.planetList.push(p);
        
        for(var e in this.players) {
            if (!p.ships[e]) {
                p.ships[e] = {fight: [], bomb: [], def: []};
            }
        }
    }
    this.coreBuildPath(); 
};

Game.prototype.netPlanetsUpdate = function(data) {
    for(var i = 0; i < data.length; i++) {
        var d = data[i];
        this.planets[d[0]].player = this.players[d[1]] || null;
    }
};


// Ships -----------------------------------------------------------------------
Game.prototype.netShipsUpdate = function(data) {
    for(var i = 0; i < data.length; i++) {
        var d = data[i];
        var id = d[1];
        var ship = this.ships[id];
        if (!ship) {
            ship = this.ships[id] = new Ship(this, id);
        }
        
        ship.traveling = !!(d[0] & 2);
        ship.inOrbit = !!(d[0] & 4);
        ship.next = !!(d[0] & 16);
        ship.traveled = !!(d[0] & 32);
        ship.direction = (d[0] & 64) ? 1 : -1;
        
        // Create
        if (d[0] & 1) {
            ship.type = this.shipTypes[d[2]];
            ship.planet = this.planets[d[3]];
            ship.player = this.players[d[4]];
            ship.player.shipCount++;
            
            ship.tickInit = d[5];
            ship.tickAngle = this.getTick();
            ship.or = d[6];
            ship.planet.addShip(ship);
            
            // Already traveling
            if (ship.next && ship.traveling) {
                ship.planet.removeShip(ship);
                ship.orbit = this.shipOrbits[ship.type];
                ship.nextPlanet = this.planets[d[7]];
                ship.r = ship.or = d[8];
                ship.tickAngle = this.getTick();
                ship.arriveTick = d[9];
                ship.travelTicks = d[10];
                ship.travelDistance = this.coreOrbit(ship, ship.planet, ship.nextPlanet);
                ship.travelAngle = Math.round(this.coreAngle(ship.planet, ship.nextPlanet));
            
            // Already sent
            } else if (ship.next) {
                ship.nextPlanet = this.planets[d[7]];
            }
        
        // Send // Arrive
        } else if (d[0] & 8) {
            
            // Sent
            if (ship.next && !ship.traveling) {
                ship.planet.addShip(ship);
                ship.nextPlanet = this.planets[d[2]];
                
                // Has just finished traveling
                if (ship.traveled) {
                    ship.planet.removeShip(ship);
                    ship.planet = this.planets[d[3]];
                    ship.planet.addShip(ship);
                    ship.or = d[4];
                    ship.tickAngle = this.getTick();
                    if (!ship.next) {
                        ship.nextPlanet = null;
                    }
                }
            
            // Start Travel
            } else if (ship.next && ship.traveling) {
                ship.planet.removeShip(ship);
                ship.orbit = this.shipOrbits[ship.type];
                ship.nextPlanet = this.planets[d[2]];
                ship.r = ship.or = d[3];
                ship.tickAngle = this.getTick();
                ship.arriveTick = d[4];
                ship.travelTicks = d[5];
                ship.travelDistance = this.coreOrbit(ship, ship.planet, ship.nextPlanet);
                ship.travelAngle = Math.round(this.coreAngle(ship.planet, ship.nextPlanet));
            
            // Finish travel
            } else {
                ship.planet.removeShip(ship);
                ship.planet = this.planets[d[2]];
                ship.planet.addShip(ship);
                ship.or = d[3];
                ship.tickAngle = this.getTick();
                if (!ship.next) {
                    ship.nextPlanet = null;
                }
            }
        
        // Sync
        } else {
            ship.or = d[2];
            ship.tickAngle = this.getTick();
        }
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

