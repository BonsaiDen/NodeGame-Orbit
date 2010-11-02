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
function Game(server) {
    this.$$ = server;
    this.width = 0;
    this.height = 0;
    this.maxDistance = 0;
    this.maxPlayers = 0;
    this.playerColors = [-1, -1, -1, -1, -1, -1, -1];
    this.playerCount = 0;
    
    this.coreInit();
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
        if (this.tickCount % 8 === 0) {
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
        this.$$.broadcast(MSG_GAME_TICK, [this.tickCount]);
    }
    this.updateAllShips();
    
    // Next Frame
    var that = this;
    setTimeout(function() {that.run();}, 66 - (new Date().getTime() - frame));
};


// Helpers ---------------------------------------------------------------------
Game.prototype.getTick = function() {
    return this.tickCount;
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
        this.$$.broadcast(MSG_PLAYER_ADD, [player.id, player.name, player.color]);
    }
    
    // Init the client
    client.send(MSG_GAME_TICK, [this.tickCount]);
    client.send(MSG_GAME_SIZE, [this.width, this.height, this.maxDistance,
                                this.shipSpeed]);
    
    // Update planets
    var start = this.getStartPlanet()
    if (start !== null) {
        start.reset();
        start.player = player;
    }
    
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        planets.push([p.id, p.x, p.y, p.size, p.player ? p.player.id : 0]);
        
        // Add space for the player ships
        if (player) {
            p.ships[player.id] = {fight: [], bomb: [], def: []};
        }
    }
    
    // Send Planet and Ships updates
    client.send(MSG_PLANETS_INIT, [planets]);
    this.updatePlanets();
    this.updateShips(client);
    
    
    // Start the client
    client.send(MSG_GAME_START, [player !== null ? player.id : 0]);
};


// Remove a Player -------------------------------------------------------------
Game.prototype.removePlayer = function(client) {

    // Remove all ships
    for(var i = 0; i < this.ships.length; i++) {
        if (this.ships[i].player.id === client.id) {
            this.ships[i].destroy();
        }
    }
    this.updateAllShips();
    
    // Updates planets
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        if (p.player && p.player.id === client.id) {
            p.player = null;
        }
        delete p.ships[client.id];
    }
    this.updatePlanets();
    
    // Remove the player
    var player = this.players[client.id];
    if (player) {
        this.playerCount--;
        this.$$.broadcast(MSG_PLAYER_REMOVE, [client.id]);
        this.playerColors[player.color] = -1;
        delete this.players[client.id];
    }
};


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.updatePlanets = function() {
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        planets.push([p.id, p.player ? p.player.id : 0]); 
    }
    this.$$.broadcast(MSG_PLANETS_UPDATE, [planets]);
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
    for(var i in this.$$.clients) {
        this.updateShips(this.$$.clients[i]);
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
    for(var i = 0, l = this.ships.length; i < l; i++) {
        var ship = this.ships[i];
        
        // Check for updates
        if (!client.ships[ship.id]
            || this.tickCount - client.ships[ship.id][0] > 140
            || ship.updated) {
             
            updates.push(this.shipToMessage(ship, !client.ships[ship.id]));
            client.ships[ship.id] = [this.tickCount, ship];
        }
        if (ship.health === 0) {
            removes.push(ship.id);
            delete client.ships[ship.id];
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
        msg.push(ship.lastTick);
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
        [48, 64, 20, true],
        [176, 112, 35, false],
        
        // Top Right
        [576, 64, 20, true],
        [464, 112, 35, false], 
        
        // Bottom Right
        [576, 416, 20, true],
        [464, 368, 35, false],
        
        // Top Left
        [48, 416, 20, true],
        [176, 368, 35, false],      
        
        // Center
        [320, 48, 27, false],
        [320, 432, 27, false],
         
        // Sides
        [112, 240, 25, false],
        [528, 240, 25, false]
    ];       
    
    this.maxDistance = 165;
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
    this.loadMap();
    
    // Init Path Finding
    this.planetNodes = [];
    var l = this.planets.length;
    for(var i = 0; i < l; i++) {
        this.planetNodes.push([]);
    }
    for(var i = 0; i < l; i++) {
        for(var e = i + 1; e < l; e++) {
            var a = this.planets[i];
            var b = this.planets[e];
            var dist = this.coreDistance(a, b);
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
            if (Q.indexOf(e) !== -1) {
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

