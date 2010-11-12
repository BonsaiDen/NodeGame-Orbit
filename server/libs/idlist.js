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


// ID List ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function IDList(size) {
    this.list = [];
    this.size = size;
    for(var i = 0; i < this.size; i++) { 
        this.list.push(undefined);
    }
}
exports.lib = IDList;


IDList.prototype = {
    has: function(item) {
        return this.list.indexOf(item) !== -1;
    },
    
    get: function(item) {
        return this.list.indexOf(item);
    },
    
    add: function(item) {
        var index = this.list.indexOf(undefined);
        if (index !== -1) {
            this.list[index] = item;
        }
        return index;
    },
    
    remove: function(item) {
        var index = this.list.indexOf(item);
        if (index !== -1) {
            this.list[index] = undefined;
        }
        return index !== -1;
    }
};

