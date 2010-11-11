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


// Modules ---------------------------------------------------------------------
var Maps = require('./../maps').Maps;
var OrbitPlanet = require('./../objects/planet').OrbitPlanet;


// Orbit Map -------------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitMap(game) {
    this.game = game;
}
exports.OrbitMap = OrbitMap;


// Prototype -------------------------------------------------------------------
OrbitMap.prototype = {
    
    load: function(id) {
        var map = id in Maps ? Maps[id] : Maps[Maps.standard];
        this.width = map.width;
        this.height = map.height;
        
        for(var i = 0; i < map.planets.length; i++) {
            var p = map.planets[i];
            new OrbitPlanet(this.game, p.id, p.x, p.y, p.size, p.nodes,
                            p.shipMax, p.factoryMax, p.start || false);
        
        }
    }
};

