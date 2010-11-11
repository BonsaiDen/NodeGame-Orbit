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


// Orbit Game Planet Methods ---------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_FACTORIES_UPDATE = 11;
var MSG_FACTORIES_DESTROY = 12;


exports.methods = {
    
    tickFactories: function() {
        this.factories.eachCall('tick');    
        this.factoriesUpdateAll();
    },
    
    factoriesUpdateAll: function() {
        this.clients.each(function(client) {
            this.factoriesUpdate(client);
        }, this);
        
        this.factories.each(function(factory) {
            factory.updated = false;
            if (factory.destroyed) {
                factory.destroyed = false;
                this.factories.remove(factory);
            }
        }, this);
    },
    
    factoriesUpdate: function(client) {
        var updates = [];
        var destroys = [];
        this.factories.each(function(factory) {
            if (!client.factories.has(factory) && !factory.destroyed) {
                updates.push(factory.createMessage());
                client.factories.add(factory);
            
            } else if (factory.updated && !factory.destroyed) {
                updates.push(factory.updateMessage());
            
            } else if (factory.destroyed) {
                destroys.push(factory.destroyMessage());
                client.factories.remove(factory);
            }
        }, this);
        
        if (updates.length > 0) {
            client.send(MSG_FACTORIES_UPDATE, [updates]);
        }
        if (destroys.length > 0) {
            client.send(MSG_FACTORIES_DESTROY, [destroys]);
        }
    }
};

