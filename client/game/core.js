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


// Core ------------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.coreInit = function() {
    this.tickCount = 1;
    this.gameID = 0;
    this.messageQueue = [];
    
    // Map
    this.width = 0;
    this.height = 0;
    this.maxDistance = 0;
    
    // Planets
    this.combatTickRate = 0;
    
    // UI
    this.sendPath = [];
    
    // Ships
    this.shipSpeed = 0;
    this.shipTypes = ['fight', 'bomb', 'def'];
    this.shipOrbits = {def: 5, fight: 15, bomb: 10};
    this.shipToOrbitSpeed = {def: 0.125, fight: 0.5, bomb: 0.25};  
};


// Pathfinding -----------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.coreBuildPath = function() {
    this.planetNodes = [];
    var l = this.planetList.length;
    for(var i = 0; i < l; i++) {
        this.planetNodes.push([]);
    }
    for(var i = 0; i < l; i++) {
        for(var e = i + 1; e < l; e++) {
            var a = this.planetList[i];
            var b = this.planetList[e];
            var dist = this.coreSurfaceDistance(a, b);
            if (dist <= this.maxDistance) {
                this.planetNodes[i].push(b);
                this.planetNodes[e].push(a);
            }
        }
    }
};

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
        
        for(var i = 0, l = this.planetNodes[u].length; i < l; i++) {
            var v = this.planetNodes[u][i];
            var e = this.planetList.indexOf(v);
            if (Q.indexOf(e) !== -1
                && (this.planetList[u].player === player
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

