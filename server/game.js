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
var MSG_PLAYER_ADD = 1;
var MSG_PLAYER_REMOVE = 2;
var MSG_GAME_JOIN = 3;
var MSG_GAME_INIT = 4;
var MSG_PLANETS_INIT = 5;
var MSG_PLANETS_UPDATE = 6;
var MSG_GAME_TICK = 7;
var MSG_SHIPS_UPDATE = 8;
var MSG_SHIPS_DESTROY = 9;

var MSG_FACTORIES_UPDATE = 11;
var MSG_FACTORIES_DESTROY = 12;


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
    for(var i in this.planets) {
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
    if (this.tickCount % 30 === 0) {
        this.broadcast(MSG_GAME_TICK, [this.tickCount]);
    }
    this.updateAllFactories();
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
                from.send(player, to, data[2], data[3], false);
            }
        
        } else if (type === 'stop') {
            var at = this.planets[data[0]];
            if (at && this.shipTypes.indexOf(data[1]) !== -1) {
                at.stop(player, data[1], data[2]);
            }
        
        } else if (type === 'build') {
            var at = this.planets[data[0]];
            if (at && data[1] >= 0 && this.factoryTypes.indexOf(data[2]) !== -1) {
                at.buildFactory(player, data[1], data[2]);
            }
        }
    }
};


// Players ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.addClient = function(client, watch) {
    this.clients[client.id] = client;
    this.clients[client.id].ships = {};
    this.clients[client.id].factories = {};
    this.clientCount++;
    
    // Create player
    if (!watch) {
        
        // Find existing player with clients hash
        for(var i in this.players) {
            var p = this.players[i];
            if (!p.client && p.clientHash === client.playerHash) {
                p.clientDropTick = -1;
                p.client = client;
                client.player = p;
                client.onRejoin();
                break;
            }
        }
        
        // Create new player
        if (!client.player) {
            this.addPlayer(client);
        }
    }
    
    // Send other players to the client
    for (var i in this.players) {
        var p = this.players[i];
        client.send(MSG_PLAYER_ADD, [p.id, p.name, p.color]);
    }
    
    // Init the client
    client.send(MSG_GAME_TICK, [this.tickCount]);
    client.send(MSG_GAME_INIT, [this.id, this.width, this.height,
                                this.combatTickRate,
                                this.shipTypes, this.shipSpeeds ,
                                this.shipOrbits, this.shipToOrbitSpeed,
                                this.factoryTypes]);
    
    this.initPlanets(client);
    this.updatePlanets(null);
    this.updateAllFactories();
    this.updateShips(client);
    
    // Send Start
    var pid = client.player !== null ? client.player.id : null;
    var sid = 0;
    var hash = null;
    if (client.player) {
        sid = client.player.startPlanet !== null ? client.player.startPlanet.id : 0;
        hash = client.player.clientHash;
    }
    client.send(MSG_GAME_JOIN, [pid, sid, hash]);
};

Game.prototype.addPlayer = function(client) {
    var freeColor = -1;
    for(var i = 1; i < this.startPlanets.length + 1; i++) {
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
            
            planet.initPlayer(player, true, true);
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
    for(var i in this.planets) {
        var p = this.planets[i];
        p.removePlayer(player);
    }
    this.updatePlanets(null);
    
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
    var factories = [];
    for(var i in this.planets) {
        var p = this.planets[i];
        planets.push([p.id, p.x, p.y, p.size,
                      p.player ? p.player.id : 0, p.maxCount, p.nodes,
                      p.maxFactories, p.factoryR]);
        
        if (client.player && !p.ships[client.player.id]) {
            p.ships[client.player.id] = {fight: [], bomb: [], def: []};
        }
        
        if (!client.factories[i]) {
            client.factories[i] = {};
        }
    }
    client.send(MSG_PLANETS_INIT, [planets]);
};

Game.prototype.updatePlanets = function(planet) {
    for(var i in this.players) {
        this.players[i].shipMaxCount = 0;
        this.players[i].planetCount = 0;
    }
    
    var planets = [];
    for(var i in this.planets) {
        var p = this.planets[i];
        p.updatePlayer();
        if (!planet || planet === p) {
            planets.push([p.id, p.player ? p.player.id : 0, p.maxCount]); 
        }
    }
    if (planets.length > 0) {
        this.broadcast(MSG_PLANETS_UPDATE, [planets]);
    }
};



// Factories -------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.updateAllFactories = function() {
    for(var i in this.clients) {
        this.updateFactories(this.clients[i]);
    }
    for(var i in this.planets) {
        var p = this.planets[i];
        for(var f in p.factories) {
            p.factories[f].updated = false;
        }
        p.factoriesDestroyed = [];
    }
};

Game.prototype.updateFactories = function(client) {
    var updates = [];
    var removes = [];
    for(var i in this.planets) {
        var p = this.planets[i];
        for(var e in p.factories) {
            var f = p.factories[e];
            if (!client.factories[i][f.id]) {
                updates.push([p.id, f.id, f.r, f.player.id, f.typeID,
                              f.shipsTaken, f.shipsNeeded]);
                
                client.factories[i][f.id] = true;
            
            } else if (f.updated) {
                updates.push([p.id, f.id, f.shipsTaken]);
            }
        }
        
        for(var e = 0, l = p.factoriesDestroyed.length; e < l; e++) {
            removes.push([p.id, p.factoriesDestroyed[e]]);
        }
    }
    
    // Send Messages
    if (updates.length > 0) {
        client.send(MSG_FACTORIES_UPDATE, [updates]);
    }
    if (removes.length > 0) {
        client.send(MSG_FACTORIES_DESTROY, [removes]);
    }
}

Game.prototype.getStartPlanet = function() {
    for(var i = 0; i < this.startPlanets.length; i++) {
        var p = this.planets[this.startPlanets[i]];
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
        this.ships[i].stopped = false;
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
            if (!client.ships[ship.id] || ship.updated) {
                updates.push(ship.toMessage(!client.ships[ship.id]));
                client.ships[ship.id] = [this.tickCount, ship];
            }
        }
    }
    
    // Send Messages
    if (updates.length > 0) {
        client.send(MSG_SHIPS_UPDATE, [updates]);
    }
    if (removes.length > 0) {
        client.send(MSG_SHIPS_DESTROY, [removes]);
    }
};


// Map -------------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.loadMap = function() { 
    var planets = [
        // Top Left
        [1,  64,  56, 22, [2], 15, 4],
        [2, 176, 128, 50, [11,  9, 1], 25, 6],
        
        // Top Right
        [3, 576,  56, 22, [4], 15, 4],
        [4, 464, 128, 50, [12,  9, 3], 25, 6],  
        
        // Bottom Right
        [5, 576, 424, 22, [6], 15, 4],
        [6, 464, 352, 50, [12, 10, 5], 25, 6],
        
        // Bottom Left
        [7, 64,  424, 22, [8], 15, 4],
        [8, 176, 352, 50, [11, 10, 7], 25, 6],
        
        // Center
        [9,  320, 56,  27, [2, 4], 15, 3],
        [10, 320, 424, 27, [6, 8], 15, 3],
         
        // Sides
        [11,  96, 240, 21, [2, 8], 12, 2],
        [12, 544, 240, 21, [4, 6], 12, 2]
    ];
    
    this.startPlanets = [1, 5, 3, 7];
    this.width = 640;
    this.height = 480;
    
    this.planetCount = 0;
    for(var i = 0; i < planets.length; i++) {
        var p = planets[i];
        var planet = new Planet(this, p[0], p[1], p[2], p[3],
                                this.startPlanets.indexOf(p[0]) !== -1, p[4],
                                p[5], p[6]);
        
        this.planets[p[0]] = planet;
        this.planetList.push(planet);
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
    this.shipTypes = ['fight'];//, 'bomb', 'def'];
    this.shipSpeeds = {def: 12.50, fight: 9.54, bomb: 6.50};
    this.shipOrbits = {def: 11, fight: 15, bomb: 22};
    this.shipToOrbitSpeed = {def: 0.5, fight: 0.5, bomb: 0.5};
    
    this.shipHealth = {def: 50, fight: 20, bomb: 50};
    this.shipDamage = {def: 25, fight: 5, bomb: 25};
    this.shipFactoryDamage = {def: 1, fight: 5, bomb: 15};
    this.shipSelfDamage = {def: 5, fight: 5, bomb: 5};
    
    // Factories
    this.factoryTypes = ['fight'];//, 'bomb', 'def'];
    
    // Planets
    this.startPlanets = [];
    this.planetList = [];
    this.planets = {};
    this.combatTickRate = 6;
    
    // Players
    this.playerID = 0;
    this.players = {};
    this.playerCount = 0;
    this.clients = {};
    this.clientCount = 0;
    this.playerColors = [-2, -1, -1, -1, -1, -1, -1, -1];
    this.neutralPlayer = new Player(this, {id: 0, name: 'Foo'}, 0);
    
    // Map
    this.width = 0;
    this.height = 0;
    this.maxDistance = 0;
    this.loadMap();
};


// Path Finding ----------------------------------------------------------------
Game.prototype.corePath = function(planet, target, player) {   
    var l = this.planetList.length;
    var distance = new Array(l);
    var previous = new Array(l);
    var Q = new Array(l);
    for(var i = 0; i < l; i++) {
        distance[i] = 100000000;
        previous[i] = null;
        Q[i] = i;
    }
    distance[this.planetList.indexOf(planet)] = 0;
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
        
        if (this.planetList[u] === target) {
            var list = [];
            while (previous[u] !== null) {
                list.unshift(this.planetList[u]);
                u = previous[u];
            }
            return list;
        }
        
        for(var i = 0, l = this.planetList[u].nodes.length; i < l; i++) {
            var v = this.planets[this.planetList[u].nodes[i]];
            var e = this.planetList.indexOf(v);
            if (Q.indexOf(e) !== -1 && (this.planetList[u].player === player
                || v.player === player)) {
                
                var alt = distance[u] + this.coreDistance(this.planetList[u], v);
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

