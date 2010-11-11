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


// Orbit Game Utility Methods --------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    angleBetween: function(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return (Math.atan2(dy, dx) * (180 / Math.PI) - 180 + 360) % 360;
    },
    
    angleDifference: function(x, y) {
        var a = (x * Math.PI / 180) - Math.PI;
        var b = (y * Math.PI / 180) - Math.PI;
        return Math.atan2(Math.sin(b - a), Math.cos(b - a)) * (180 / Math.PI);
    },
    
    distanceBetween: function(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    pathTo: function(start, end, player) {
        
        // Setup Djikstra
        var planetCount = this.planets.length;
        var planetDistance = new Array(planetCount);
        var previousNode = new Array(planetCount);
        var planetIndexes = new Array(planetCount);
        for(var i = 0; i < planetCount; i++) {
            planetDistance[i] = 100000000;
            previousNode[i] = null;
            planetIndexes[i] = i;
        }
        planetDistance[this.planets.indexOf(start)] = 0;
        
        // Run
        var indexCount = planetIndexes.length;
        while (indexCount > 0) {
            var minDistance = 100000000;
            var nearestIndex = 0;
            for(var i = 0; i < indexCount; i++) {
                var currentIndex = planetIndexes[i];
                if (planetDistance[currentIndex] < minDistance) {
                    minDistance = planetDistance[currentIndex];
                    nearestIndex = currentIndex;
                }
            }
            
            // No path exists
            if (planetDistance[nearestIndex] === 100000000) {
                break;
            }
            
            // Remove current planet
            planetIndexes.splice(planetIndexes.indexOf(nearestIndex), 1);
            indexCount--;
            
            // Path found?
            var currentPlanet = this.planets.at(nearestIndex);
            if (currentPlanet === end) {
                var nodeList = [];
                while (previousNode[nearestIndex] !== null) {
                    nodeList.unshift(this.planets.at(nearestIndex));
                    nearestIndex = previousNode[nearestIndex];
                }
                return nodeList;
            }
            
            // Check nodes
            currentPlanet.planetNodes.each(function(nodePlanet) {
                var nodeIndex = this.planets.indexOf(nodePlanet);
                if (planetIndexes.indexOf(nodeIndex) !== -1
                    && (currentPlanet.player === player
                        || nodePlanet.player === player)) {
                    
                    var alt = planetDistance[nearestIndex]
                              + this.distanceBetween(currentPlanet, nodePlanet);
                    
                    if (alt < planetDistance[nodeIndex]) {
                        planetDistance[nodeIndex] = alt;
                        previousNode[nodeIndex] = nearestIndex;
                    }                        
                }
            }, this);
        }
        return [];
    }
};

