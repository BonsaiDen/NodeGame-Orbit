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


// Bezier Curve ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function Bezier(a, b, c, d, points) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    
    this.length = 0;
    this.points = points; 
    this.arcs = new Array(this.points + 1);
    this.arcs[0] = 0;
    
    var ox = this.x(0), oy = this.y(0);
    for(var i = 1; i <= this.points; i += 1) {
        var x = this.x(i / this.points), y = this.y(i / this.points);
        var dx = ox - x, dy = oy - y;        
        this.length += Math.sqrt(dx * dx + dy * dy);
        this.arcs[i] = this.length;
        ox = x, oy = y;
    }
}
exports.lib = Bezier;


// Prototype -------------------------------------------------------------------
Bezier.prototype = {
    map: function(u) {
        var targetLength = u * this.length;
        var low = 0, high = this.points, index = 0;
        while (low < high) {
            index = low + (((high - low) / 2) | 0);
            if (this.arcs[index] < targetLength) {
                low = index + 1;
            
            } else {
                high = index;
            }
        }
        if (this.arcs[index] > targetLength) {
            index--;
        }
        
        var lengthBefore = this.arcs[index];
        if (lengthBefore === targetLength) {
            return index / this.points;
        
        } else {
            return (index + (targetLength - lengthBefore)
                   / (this.arcs[index + 1] - lengthBefore)) / this.points;
        }
    },
    
    mx: function (u) {
        return this.x(this.map(u));
    },
    
    my: function (u) {
        return this.y(this.map(u));
    },
    
    mr: function(u) {
        return this.r(this.map(u));
    },
    
    x: function (t) {
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
               + 3 * ((1 - t) * (1 - t)) * t * this.b.x
               + 3 * (1 - t) * (t * t) * this.c.x
               + (t * t * t) * this.d.x;
    },
    
    y: function (t) {
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
               + 3 * ((1 - t) * (1 - t)) * t * this.b.y
               + 3 * (1 - t) * (t * t) * this.c.y
               + (t * t * t) * this.d.y;
    },
    
    r: function(t) {
        return Math.atan2(this.y(t) - this.y(t + 0.01),
                          this.x(t) - this.x(t + 0.01));
    }
};

