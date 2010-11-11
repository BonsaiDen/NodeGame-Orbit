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
var crypto = require('crypto');
var HashList = require('./../libs/hashlist').HashList;


// Orbit Player ----------------------------------------------------------------
// -----------------------------------------------------------------------------
var MSG_SEND = ['number', 'number', 'number'];
var MSG_STOP = ['number', 'boolean'];
var MSG_BUILD = ['number', 'number'];


function OrbitPlayer(game, client, neutral) {
    this.game = game;
    this.id = this.game.playerID++;
    
    this.name = client.name;
    this.color = game.playerColors.add(this);
    this.gameHash = null;
    this.neutral = neutral;  
    
    this.connect(client);
    
    this.planets = new HashList();
    this.ships = new HashList();
    this.shipMax = 0;
    
    this.factories = new HashList();
    
    if (this.client) {
        this.initHuman();
    
    } else {
        this.initNeutral();
    }
    this.log('Joined');
}
exports.OrbitPlayer = OrbitPlayer;


// Prototype -------------------------------------------------------------------
OrbitPlayer.extend({
    
    initHuman: function() {
        this.createHash();
        this.game.playerHumanCount++;
    },
    
    initNeutral: function() {
    },
    
    createHash: function() {
        var hash = crypto.createHash('md5');
        hash.update(new Date().getTime() + '-' + this.getTick() + '-'
                    + this.client.connID + '-' + this.game.id);
        
        this.gameHash = hash.digest('hex');
    },
    
    checkHash: function(client) {
        return client.gameHash === this.gameHash;
    },
    
    connect: function(client, reconnect) {
        this.client = client;
        this.client.player = this;
        this.clientDropped = false;
        this.clientDroppedTick = 0;
        this.log(reconnect ? 'Re-connected' : 'Connected');
    },
    
    disconnect: function() {
        this.client = null;
        this.clientDropped = true;
        this.clientDroppedTick = this.getTick();
        this.log('Disconnected');
    },
    
    quit: function(timeout) {
        this.game.planetsDestroyPlayer(this);
        this.planets.clear();
        this.factories.clear();
        this.ships.clear();
        
        this.game.playerRemove(this);
        this.game.clientRemove(this.client);
        this.log(timeout ? 'Timed out' : 'Quit');
    },
    
    // Commands ----------------------------------------------------------------
    message: function(msg) {
        if (msg.send && this.validate(msg.send, MSG_SEND)) {
            this.sendShips(msg.send[0], msg.send[1], msg.send[2]);
        
        } else if (msg.stop && this.validate(msg.stop, MSG_STOP)) {
            this.stopShips(msg.stop[0], msg.stop[1]);
        
        } else if (msg.build && this.validate(msg.build, MSG_BUILD)) {
            this.buildFactory(msg.build[0], msg.build[1]);
        }
    },
    
    validate: function(msg, types) {
        if (!msg instanceof Array || msg.length !== types.length) {
            return false;
        }
        
        for(var i = 0, l = msg.length; i < l; i++) {
            if (typeof msg[i] !== types[i]) {
                return false;
            }
        }
        return true;
    },
    
    // Factories ---------------------------------------------------------------
    buildFactory: function(planet, buildPlace) {
        if (this.game.planets.has(planet)) {
            this.game.planets.get(planet).buildFactory(this, buildPlace);
        }
    },
    
    // Ships -------------------------------------------------------------------
    shipMaximum: function(player) {
        return this.ships.length >= this.shipMax;
    },
    
    sendShips: function(from, to, count) {
        if (this.game.planets.has(from) && this.game.planets.has(to)) {
            var from = this.game.planets.get(from);
            var to = this.game.planets.get(to);
            if (count >= 0 && count <= from.playerShips.get(this).length) {
                from.sendShips(this, to, count, false);
            }
        }
    },
    
    stopShips: function(planet, to) {
        if (this.game.planets.has(planet)) {
            planet = this.game.planets.get(planet);
            if (to) {
                planet.stopShipsTo(this);
            
            } else {
                planet.stopShips(this);
            }
        }
    },
    
    // Helpers -----------------------------------------------------------------
    getProductionModifier: function() {
        var mods = [1, 0.50, 0.90, 1.0, 1.2, 1.4, 1.6, 1.7, 2];
        var rate = mods[Math.min(this.planets.length, mods.length - 1)];
        return this.isNeutral() ? rate * 1.25 : rate;
    },
    
    isHuman: function() {
        return !this.neutral;
    },
    
    isNeutral: function() {
        return this.neutral;
    },
    
    getTick: function() {
        return this.game.getTick();
    },
    
    log: function(msg) {
        var player = (this.isHuman() ? 'Player' : 'Neutral') + ' #' + this.id;
        var name = this.name + (this.watching ? '(watching)' : '');
        this.game.log('[' + player + ': ' + name + '] ' + msg);
    }
});

