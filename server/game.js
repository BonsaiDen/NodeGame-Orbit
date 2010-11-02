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


var Player = require('./objects/player').Player;
var Planet = require('./objects/planet').Planet;

// Message Types
var MSG_PLANETS_INIT = 0;
var MSG_PLAYER_ADD = 1;
var MSG_PLAYER_REMOVE = 2;
var MSG_GAME_START = 3;
var MSG_GAME_SIZE = 4;
var MSG_PLANETS_INIT = 5;
var MSG_PLANETS_UPDATE = 6;
var MSG_GAME_TICK = 7;
var MSG_SHIPS_UPDATE = 8;
var MSG_SHIPS_DESTROY = 9;


// Game ------------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Game(server, id) {
    this.$$ = server;
    this.id = id;
    this.clients = {};
    
    this.width = 0;
    this.height = 0;
    
    this.lastPlayingTick = 0;
    this.tickTimer = null;
    this.maxDistance = 0;
    this.maxPlayers = 0;
    this.playerColors = [-2, -1, -1, -1, -1, -1, -1, -1];
    this.playerCount = 0;
    this.coreInit();
    this.run();
    this.$$.log('## Game #' + this.id + ' started');
}
exports.Game = Game;


// Mainloop --------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.run = function() {
    var frame = new Date().getTime();
    
    // Tick the World
    this.tickCount++;
    for(var i = 0, l = this.planets.length; i < l; i++) {
        this.planets[i].tick();
        if (this.tickCount % 6 === 0) {
            this.planets[i].tickCombat();
        }
    }
    
    for(var i = 0, l = this.ships.length; i < l; i++) {
        this.ships[i].tick();
    }
    
    for(var i in this.players) {
        this.players[i].tick();
    }
    
    // Send Updates
    if (this.tickCount % 20 === 0) {
        this.broadcast(MSG_GAME_TICK, [this.tickCount]);
    }
    this.updateAllShips();
        
    // Next Frame
    var that = this;
    this.tickTimer = setTimeout(function() {that.run();},
                                66 - (new Date().getTime() - frame));
                   
    // Check if all players have left the game
    if (this.playerCount > 0) {
        this.lastPlayingTick = this.tickCount;
    
    } else if (this.tickCount - this.lastPlayingTick > 50) {
        this.stop();
    }
};

Game.prototype.stop = function() {
    this.$$.log('## Game #' + this.id + ' ended');

    clearTimeout(this.tickTimer);
    for(var i in this.players) {
        if (this.players[i].client.id > 0) {
            this.players[i].client.close();
        }
    }
    this.planets = {};
    this.ships = {};
    this.players = {};
    
    this.$$.gameCount--;
    delete this.$$.games[this.id];
};

// Helpers ---------------------------------------------------------------------
Game.prototype.getTick = function() {
    return this.tickCount;
};

Game.prototype.broadcast = function(type, msg) {
    this.$$.broadcast(type, msg, this.clients);
};


// Events ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.onMessage = function(type, data, client) {
    var player = this.players[client.id];
    if (player) {
        if (type === 'send') {
            var from = this.planets[data[0]];
            var to = this.planets[data[1]];
            if (from && to && this.shipTypes.indexOf(data[2]) !== -1) {
                from.send(player, to, data[2], data[3]);
            }
        }
    }
};


// Networking ------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.addPlayer = function(client) {
    this.clients[client.id] = client;
    
    // Find Free color
    var freeColor = -1;
    for(var i = 0; i < this.maxPlayers; i++) {
        if(this.playerColors[i] === -1) {
            this.playerColors[i] = client.id;
            freeColor = i;
            break;
        }
    }
    
    // Create player if we found a color
    var player = null;
    if (freeColor !== -1) {
        player = new Player(this, client, freeColor);
        this.playerCount++;
    }

    // Send other players to the client
    for(var i in this.players) {
        var p = this.players[i];
        client.send(MSG_PLAYER_ADD, [p.id, p.name, p.color]);
    }
    
    // Broadcast the new player
    if (player) {
        this.broadcast(MSG_PLAYER_ADD, [player.id, player.name, player.color]);
    }
    
    // Init the client
    client.send(MSG_GAME_TICK, [this.tickCount]);
    client.send(MSG_GAME_SIZE, [this.width, this.height, this.maxDistance,
                                this.shipSpeed]);
    
    // Update planets
    var start = this.getStartPlanet()
    if (start !== null) {
        start.initPlayer(player);
    }
    
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        planets.push([p.id, p.x, p.y, p.size, p.player ? p.player.id : 0]);
        
        // Add space for the player ships
        if (player && !p.ships[player.id]) {
            p.ships[player.id] = {fight: [], bomb: [], def: []};
        }
    }
    
    // Send Planet and Ships updates
    client.send(MSG_PLANETS_INIT, [planets]);
    this.updatePlanets();
    this.updateShips(client);
    
    
    // Start the client
    client.send(MSG_GAME_START, [player !== null ? player.id : 0,
                                 start !== null ? start.id : 0]);
};


// Remove a Player -------------------------------------------------------------
Game.prototype.removePlayer = function(id) {
    
    // Remove all ships
    for(var i = 0; i < this.ships.length; i++) {
        if (this.ships[i].player.id === id) {
            this.ships[i].destroy();
        }
    }
    this.updateAllShips();
    
    // Updates planets
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        if (p.player && p.player.id === id) {
            if (p.start) {
                p.player = null;
            
            } else {
                p.initNeutral(false, false);
            }
        }
        delete p.ships[id];
    }
    this.updatePlanets();
    
    // Remove the player
    var player = this.players[id];
    if (player) {
        this.playerCount--;
        this.broadcast(MSG_PLAYER_REMOVE, [id]);
        this.playerColors[player.color] = -1;
        delete this.players[id];
    }
};


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.updatePlanets = function() {
    for(var i in this.players) {
        this.players[i].shipMaxCount = 0;
    }
    
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        if (p.player) {
            p.player.shipMaxCount += p.maxCount;
        }
        planets.push([p.id, p.player ? p.player.id : 0]); 
    }
    this.broadcast(MSG_PLANETS_UPDATE, [planets]);
};


Game.prototype.getStartPlanet = function() {
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        if (p.start && !p.player) {
            return p;
        }
    }
    return null;
};


// Ships -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.updateAllShips = function() {
    for(var i in this.players) {
        if (this.players[i].client.id > 0) {
            this.updateShips(this.players[i].client);
        }
    }
    
    for(var i = 0, l = this.ships.length; i < l; i++) {
        this.ships[i].updated = false;
        if (this.ships[i].health === 0) {
            this.ships.splice(i, 1);
            l--;
            i--;
        }
    }
};

Game.prototype.updateShips = function(client) {
    var updates = [];
    var removes = [];
    var player = this.players[client.id];
    
    for(var i = 0, l = this.ships.length; i < l; i++) {
        var ship = this.ships[i];
        
        // Check for updates
        if (!player.ships[ship.id]
            || this.tickCount - player.ships[ship.id][0] > 140
            || ship.updated) {
             
            updates.push(this.shipToMessage(ship, !player.ships[ship.id]));
            player.ships[ship.id] = [this.tickCount, ship];
        }
        if (ship.health === 0) {
            removes.push(ship.id);
            delete player.ships[ship.id];
        }
    }
    
    // Send Messages
    client.send(MSG_SHIPS_UPDATE, [updates]);
    client.send(MSG_SHIPS_DESTROY, [removes]);
};


Game.prototype.shipToMessage = function(ship, create) {
    var msg = [];
    
    // Ship Flags
    var flags = 0;
    flags += create ? 1 : 0;
    flags += ship.traveling ? 2: 0;
    flags += ship.inOrbit ? 4 : 0;
    flags += ship.updated ? 8 : 0;
    flags += ship.nextPlanet ? 16 : 0;
    flags += ship.traveled ? 32 : 0;
    flags += ship.direction === 1 ? 64 : 0;
    
    // Basic fields
    msg.push(flags);
    msg.push(ship.id);
    
    
    // Ship created
    if (create) {
        msg.push(ship.typeID);
        msg.push(ship.planet.id);
        msg.push(ship.player.id);
        msg.push(ship.tickInit);
        msg.push(ship.r);
        
        // Ship created in travel
        if (ship.nextPlanet && ship.traveling) {
            msg.push(ship.nextPlanet.id);
            msg.push(ship.r);
            msg.push(ship.arriveTick);   
            msg.push(ship.travelTicks);
        
        // Ship created and already sent
        } else if (ship.nextPlanet) {
            msg.push(ship.nextPlanet.id);
        }
    
    // Ship Updates
    } else if (ship.updated) {
        
        // Ship sent
        if (ship.nextPlanet && !ship.traveling) {
            msg.push(ship.nextPlanet.id);
            
            // Ship has just arrived
            if (ship.traveled) {
                msg.push(ship.planet.id);
                msg.push(ship.r);    
            }
        
        // Ship starts travel
        } else if (ship.nextPlanet && ship.traveling) {
            msg.push(ship.nextPlanet.id);
            msg.push(ship.r);
            msg.push(ship.arriveTick);   
            msg.push(ship.travelTicks);
        
        // Ship finishes travel
        } else {
            msg.push(ship.planet.id);
            msg.push(ship.r);
        }
    
    } else {
        msg.push(ship.r);
    }
    return msg;
};


// Map -------------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.loadMap = function() { 
    var planets = [
        // Top Left
        [48, 64, 22, true],
        [176, 112, 40, false],
        
        // Bottom Right
        [592, 416, 22, true],
        [464, 368, 40, false],  
        
        // Top Right
        [592, 64, 22, true],
        [464, 112, 40, false], 
        
        // Top Left
        [48, 416, 22, true],
        [176, 368, 40, false],      
        
        // Center
        [320, 56, 27, false],
        [320, 424, 27, false],
         
        // Sides
        [112, 240, 17, false],
        [528, 240, 17, false]
    ];       
    
    this.maxDistance = 90;
    this.width = 640;
    this.height = 480;
    
    this.maxPlayers = 0;
    for(var i = 0; i < planets.length; i++) {
        var p = planets[i];
        this.planets.push(new Planet(this, p[0], p[1], p[2], p[3],
                                     this.planets.length));
        
        if (p[3] === true) {
            this.maxPlayers++;
        }
    }
};


// Core ------------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.coreInit = function() {
    this.tickCount = 1;
    this.shipOrbits = {def: 5, fight: 15, bomb: 10};
    this.shipToOrbitSpeed = {def: 0.125, fight: 0.5, bomb: 0.25};
    this.shipTypes = ['def', 'fight', 'bomb'];
    this.shipSpeed = 9.54;
    this.shipHealth = {def: 40, fight: 20, bomb: 15};
    this.shipDamage = {def: 5, fight: 5, bomb: 20};
    
    this.shipID = 0;
    this.ships = [];
    this.planets = [];
    this.players = {};
    this.neutralPlayer = new Player(this, {id: 0, name: 'Foo'}, 0);
    this.loadMap();
    
    this.coreBuildPath(); 
};


// Pathfinding -----------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.coreBuildPath = function(player) {
    this.planetNodes = [];
    
    var l = this.planets.length;
    for(var i = 0; i < l; i++) {
        this.planetNodes.push([]);
    }
    for(var i = 0; i < l; i++) {
        for(var e = i + 1; e < l; e++) {
            var a = this.planets[i];
            var b = this.planets[e];
            var dist = this.coreSurfaceDistance(a, b);
            if (dist <= this.maxDistance) {
                this.planetNodes[i].push(b);
                this.planetNodes[e].push(a);
            }
        }
    }
};

Game.prototype.corePath = function(planet, target, player) {
    var l = this.planets.length;
    var distance = new Array(l);
    var previous = new Array(l);
    var Q = new Array(l);
    for(var i = 0; i < l; i++) {
        distance[i] = 100000000;
        previous[i] = null;
        Q[i] = i;
    }
    distance[this.planets.indexOf(planet)] = 0;
    
    // remove non player and non neutral unless Q = target
    // if planet != player and target != player and list.length == 1, don't move
    
    while (Q.length > 0) {
        var min = 100000000;
        var u = 0;
        for(var i = 0; i < Q.length; i++) {
            var e = Q[i];
            if (distance[e] < min) {
                min = distance[e];
                u = e;
            }
        }
        
        if (distance[u] === 100000000) {
            break;
        }
        Q.splice(Q.indexOf(u), 1);
        
        if (this.planets[u] === target) {
            var list = [];
            while (previous[u] !== null) {
                list.unshift(this.planets[u]);
                u = previous[u];
            }
            return list;
        }
        
        for(var i = 0, l = this.planetNodes[u].length; i < l; i++) {
            var v = this.planetNodes[u][i];
            var e = this.planets.indexOf(v);
            if (Q.indexOf(e) !== -1
                && (this.planets[u].player === player
                    || (v == target && v.player == player))) {
                
                var alt = distance[u] + this.coreDistance(this.planets[u], v);
                if (alt < distance[e]) {
                    distance[e] = alt;
                    previous[e] = u;
                }
            }
        }
    }
    return [];
};

Game.prototype.coreAngle = function(from, to) {
    var dx = from.x - to.x;
    var dy = from.y - to.y;
    return (Math.atan2(dy, dx) * (180 / Math.PI) - 180 + 360) % 360;
};

Game.prototype.coreDistance = function(from, to) {
    var dx = from.x - to.x;
    var dy = from.y - to.y;
    return Math.sqrt(dx * dx + dy * dy);
};

Game.prototype.coreSurfaceDistance = function(from, to) {
    return this.coreDistance(from, to) - from.size - to.size;
};

Game.prototype.coreOrbit = function(ship, from, to) {
    var dx = from.x - to.x;
    var dy = from.y - to.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    return d - from.size - to.size - ship.orbit * 2;
};

Game.prototype.coreDifference = function(x, y) {
    var b = (x * Math.PI / 180) - Math.PI;
    var a = (y * Math.PI / 180) - Math.PI;
    return Math.atan2(Math.sin(a - b), Math.cos(a - b)) * (180 / Math.PI);
};

