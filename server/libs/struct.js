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


// Orbit Struct ----------------------------------------------------------------
// -----------------------------------------------------------------------------
var chr = String.fromCharCode;

function Struct(data) {
    this.data = data || "";
}
exports.lib = Struct;

Struct.prototype = {
    
    writeString8: function(str) {
        this.writeInt8(str.length);
        this.data += str;
        return this;
    },
    
    writeString16: function(str) {
        this.writeInt16(str.length);
        this.data += str;
        return this;
    },
    
    writeInt8: function(i) {
        this.data += chr(i & 0xff);
        return this;
    },
    
    writeInt16: function(i) {
        this.data += chr((i >> 8) & 0xff) + chr(i & 0xff);
        return this;
    },
    
    writeBool: function(b) {
        this.data += chr(b ? 1 : 0);
        return this;
    },
    
    writeDeg: function(r) {
        this.writeInt16(Math.round(r * 100) / 100);
        return this;
    },
    
    writeInt8Array8: function(array) {
        var l = array.length;
        this.writeInt8(l);
        for(var i = 0; i < l; i++) {
            this.writeInt8(array[i]);
        }
    },
    
    writeStructArray8: function(array) {
        var l = array.length;
        this.writeInt8(l);
        for(var i = 0; i < l; i++) {
            this.data += array[i];
        }  
    },   
    
    writeStructArray16: function(array) {
        var l = array.length;
        this.writeInt16(l);
        for(var i = 0; i < l; i++) {
            this.data += array[i];
        }   
    },
    
    toString: function() {
        return this.data;
    }
};

