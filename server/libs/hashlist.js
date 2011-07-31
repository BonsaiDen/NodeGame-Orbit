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


// Hash List Utility Class -----------------------------------------------------
// -----------------------------------------------------------------------------
function HashList(max) {
    this.maximum = max || -1;
    this.clear();
}
exports.lib = HashList;


// Prototype -------------------------------------------------------------------
HashList.prototype = {

    // General Methods ---------------------------------------------------------
    clear: function() {
        this.hash = {};
        this.items = [];
        this.length = 0;
    },

    full: function() {
        return this.maximum === -1 ? false : this.length === this.maximum;
    },
    
    // Index based Methods -----------------------------------------------------
    contains: function(item) {
        return this.items.indexOf(item) !== -1;
    },
    
    indexOf: function(item) {
        return this.items.indexOf(item);
    },
    
    at: function(index) {
        return this.items[index];
    },
    
    // ID based methods --------------------------------------------------------
    has: function(obj) {
        if (typeof obj !== 'object') {
            return obj in this.hash;
        
        } else {
            return obj.id in this.hash;
        }
    },
    
    get: function(obj) {
        if (typeof obj !== 'object') {
            return this.hash[obj];
        
        } else {
            return this.hash[obj.id];
        }
    },
    
    add: function(obj) {
        if (!this.has(obj) && !this.full()) {
            this.hash[obj.id] = obj;
            this.items.push(obj);
            this.length++;
            return true;
        
        } else {
            return false;
        }
    },
    
    put: function(id, obj) {
        if (!this.has(id) && !this.full()) {
            this.hash[id] = obj;
            this.items.push(obj);
            this.length++;
            return true;
        
        } else {
            return false;
        }
    },
    
    remove: function(obj) {
        if (this.has(obj)) {
            this.items.splice(this.items.indexOf(this.hash[obj.id]), 1);
            delete this.hash[obj.id];
            this.length--;
            return true;
        
        } else {
            return false;
        }
    },
    
    // Sorting -----------------------------------------------------------------
    sort: function(func) {
        this.items.sort(func);
        return this;
    },
    
    // Iteration ---------------------------------------------------------------
    each: function(cb, scope) {
        for(var i = 0; i < this.length; i++) {
            var oldLength = this.length;
            var item = this.items[i];
            if (cb.call(scope || item, item)) {
                return true;
            }
            if (this.length < oldLength) {
                i--;
            }
        }
    },
    
    eachIn: function(items, cb, scope) {
        for(var i = 0; i < this.length; i++) {
            var oldLength = this.length;
            var item = this.items[i];
            if (items.indexOf(item) !== -1) {
                if (cb.call(scope || item, item)) {
                    return true;
                }
                if (this.length < oldLength) {
                    i--;
                }
            }
        }
    },
    
    eachNot: function(items, cb, scope) {
        for(var i = 0; i < this.length; i++) {
            var oldLength = this.length;
            var item = this.items[i];
            if (items.indexOf(item) === -1) {
                if (cb.call(scope || item, item)) {
                    return true;
                }
                if (this.length < oldLength) {
                    i--;
                }
            }
        }
    }, 
    
    eachCall: function(method) {
        for(var i = 0; i < this.length; i++) {
            this.items[i][method]();
        }
    },
    
    eachEach: function(check, func, after, scope) {
        for(var i = 0; i < this.length; i++) {
            var oldLength = this.length;
            var item = this.items[i];
            if (check.call(scope || item, item)) {
                for(var e = i + 1;; e++) {
                    var oldLengthInner = this.length;
                    if (e === this.length) {
                        e = 0;
                    }
                    if (e === i) {
                        break;
                    }
                    
                    var itemInner = this.items[e];
                    if (func.call(scope || itemInner, item, itemInner)) {
                        break;
                    }
                    if (this.length < oldLengthInner) {
                        e--;
                    }
                }
                after.call(scope || item, item);
            }
            if (this.length < oldLength) {
                i--;
            }
        }
    }
};

