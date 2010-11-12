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


// Globals ---------------------------------------------------------------------
Object.prototype.extend = function() {
    for(var i = 0; i < arguments.length; i++) {
        var mod = arguments[i];
        var methods = mod instanceof Object ? mod : require('./' + mod).methods;
        for(var e in methods) {
            if (methods.hasOwnProperty(e)) {
                this.prototype[e] = methods[e];
            }
        }
    }
};

global.importLib = function(lib) {
    return require('./libs/' + lib).lib;
}

global.importObject = function(object, module) {
    return require('./objects/' + object + '/' + (module || object)).object;
}

global.importData = function(data) {
    return require('./data/' + data).data;
}

global.importModule = function(module) {
    return require('./' + module).module;
}

// Server ----------------------------------------------------------------------
var OrbitServer = importModule('server');
new OrbitServer(28785, true, 32);

