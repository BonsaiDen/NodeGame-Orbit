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
    this.coreInit();
    this.run();
    this.$$.log('## Game #' + this.id + ' started');
}
exports.Game = Game;


// Mainloop --------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.run = function() {
    var frame = new Date().getTime();
    
    // Update
    this.update();

    // Next Frame
    var that = this;
    this.tickTimer = setTimeout(function() {that.run();},
                                66 - (new Date().getTime() - frame));
    
    // Check if all players have left the game
    if (this.clientCount > 0 || this.playerCount > 0) {
        this.lastPlayingTick = this.tickCount;
    
    } else if (this.getTick() - this.lastPlayingTick > 50) {
        this.stop();
    }
};

Game.prototype.update = function() {
    this.tickCount++;
    
    // Planets
    for(var i = 0, l = this.planets.length; i < l; i++) {
        this.planets[i].tick();
        if (this.tickCount % this.combatTickRate === 0) {
            this.planets[i].tickCombat();
        }
    }
    
    // Ships
    for(var i = 0, l = this.ships.length; i < l; i++) {
        this.ships[i].tick();
    }
    
    // Players
    for(var i in this.players) {
        var p = this.players[i];
        
        // Kick dropped out players
        if (p.clientDropTick !== -1) {
            if (this.getTick() - p.clientDropTick > 100) {
                this.$$.log('--', p.name, 'timed out Game #' + this.id);
                this.removePlayer(p);
            }
        }
        p.tick();
    }
    
    // Sync Tick count
    if (this.tickCount % 20 === 0) {
        this.broadcast(MSG_GAME_TICK, [this.tickCount]);
    }
    this.updateAllShips();
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
    var player = client.player;
    if (player) {
        if (type === 'send') {
            var from = this.planets[data[0]];
            var to = this.planets[data[1]];
            if (from && to && this.shipTypes.indexOf(data[2]) !== -1) {
                from.send(player, to, data[2], data[3]);
            }
        
        } else if (type === 'stop') {
            var at = this.planets[data[0]];
            if (at && this.shipTypes.indexOf(data[1]) !== -1) {
                at.stop(player, data[1]);
            }
        }
    }
};


// Players ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.addClient = function(client, watch) {
    this.clients[client.id] = client;
    this.clients[client.id].ships = {};
    this.clientCount++;
    
    // Create player
    if (!watch) {
        // Create player
        if (!client.player) {
            this.addPlayer(client);
        
        // Re-init player
        } else {
            
        }
    }
    
    // Send other players to the client
    for (var i in this.players) {
        var p = this.players[i];
        client.send(MSG_PLAYER_ADD, [p.id, p.name, p.color]);
    }
    
    // Init the client
    client.send(MSG_GAME_TICK, [this.tickCount]);
    client.send(MSG_GAME_SIZE, [this.width, this.height, this.maxDistance,
                                this.shipSpeed, this.combatTickRate]);
    
    this.initPlanets(client);
    this.updatePlanets();
    this.updateShips(client);
    
    // Send Start
    var pid = client.player !== null ? client.player.id : null;
    var sid = 0;
    if (client.player) {
        sid = client.player.startPlanet !== null ? client.player.startPlanet.id : 0;
    }
    client.send(MSG_GAME_START, [pid, sid]);
};

Game.prototype.addPlayer = function(client) {
    var freeColor = -1;
    for(var i = 1; i < this.maxPlayers + 1; i++) {
        if(this.playerColors[i] === -1) {
            freeColor = i;
            break;
        }
    }
    
    var player = null;
    if (freeColor !== -1) {
        var planet = this.getStartPlanet();
        if (planet !== null) {
            player = new Player(this, client, freeColor);
            this.playerCount++;
            this.$$.log('++', player.name, 'joined Game #' + this.id);
            this.broadcast(MSG_PLAYER_ADD, [player.id, player.name, player.color]);
            
            planet.initPlayer(player, true);
            player.startPlanet = planet;
        }
    }
    return player;
};


Game.prototype.removeClient = function(client) {
    var player = client.player;
    if (player) {
        client.player = null;
        player.client = null;
        player.clientDropTick = this.getTick();
    }
    this.clientCount--;
};

Game.prototype.removePlayer = function(player) {
    
    // Remove all ships 
    for(var i = 0; i < this.ships.length; i++) {
        if (this.ships[i].player === player) {
            this.ships[i].destroy();
        }
    }
    this.updateAllShips();
    
    // Updates planets
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        p.removePlayer(player)
    }
    this.updatePlanets();
    
    // Remove the player
    this.playerCount--;
    this.broadcast(MSG_PLAYER_REMOVE, [player.id]);
    this.playerColors[player.color] = -1;
    delete this.players[player.id];
};


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.initPlanets = function(client) {
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        planets.push([p.id, p.x, p.y, p.size, p.player ? p.player.id : 0]);
        if (client.player && !p.ships[client.player.id]) {
            p.ships[client.player.id] = {fight: [], bomb: [], def: []};
        }
    }
    client.send(MSG_PLANETS_INIT, [planets]);
};

Game.prototype.updatePlanets = function() {
    for(var i in this.players) {
        this.players[i].shipMaxCount = 0;
        this.players[i].planetCount = 0;
    }
    
    var planets = [];
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        p.updatePlayer();
        planets.push([p.id, p.player ? p.player.id : 0]); 
    }
    this.broadcast(MSG_PLANETS_UPDATE, [planets]);
};

Game.prototype.getStartPlanet = function() {
    for (var i = 0, l = this.planets.length; i < l; i++) {
        var p = this.planets[i];
        if (p.start && (!p.player || p.player === this.neutralPlayer)) {
            return p;
        }
    }
    return null;
};


// Ships -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.updateAllShips = function() {
    for(var i in this.clients) {
        this.updateShips(this.clients[i]);
    }
    
    // Remove destroyed ships
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
        if (ship.health === 0) {
            removes.push(ship.id);
            delete client.ships[ship.id];
        
        } else {
            if (!client.ships[ship.id]
                || this.tickCount - client.ships[ship.id][0] > 140
                || ship.updated) {
                
                updates.push(ship.toMessage(!client.ships[ship.id]));
                client.ships[ship.id] = [this.tickCount, ship];
            }
        }
    }
    
    // Send Messages
    client.send(MSG_SHIPS_UPDATE, [updates]);
    client.send(MSG_SHIPS_DESTROY, [removes]);
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
    
    // General
    this.lastPlayingTick = 0;
    this.tickTimer = null;
    this.tickCount = 1;
    
    // Ships
    this.shipID = 0;
    this.ships = [];
    this.shipOrbits = {def: 5, fight: 15, bomb: 10};
    this.shipToOrbitSpeed = {def: 0.125, fight: 0.5, bomb: 0.25};
    this.shipTypes = ['def', 'fight', 'bomb'];
    this.shipSpeed = 9.54;
    this.shipHealth = {def: 40, fight: 20, bomb: 15};
    this.shipDamage = {def: 5, fight: 5, bomb: 20};
    
    // Planets
    this.planets = [];
    this.combatTickRate = 6;
    
    // Players
    this.playerID = 0;
    this.players = {};
    this.playerCount = 0;
    this.clients = {};
    this.clientCount = 0;
    this.maxPlayers = 0;
    this.playerColors = [-2, -1, -1, -1, -1, -1, -1, -1];
    this.neutralPlayer = new Player(this, {id: 0, name: 'Foo'}, 0);
    
    // Map
    this.width = 0;
    this.height = 0;
    this.maxDistance = 0;
    this.loadMap();
    
    // Paths
    this.coreBuildPath(); 
};


// Path Finding ----------------------------------------------------------------
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
                && (this.planets[u].player === player || v.player === player)) {
                
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


// Helpers ---------------------------------------------------------------------
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

