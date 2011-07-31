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
var HashList = importLib('hashlist');
var IDList = importLib('idlist');
var OrbitMap = importObject('map');


// Orbit Game ------------------------------------------------------------------
// -----------------------------------------------------------------------------
function OrbitGame(server, id) {
    var that = this;
    this.server = server;
    this.id = id;
    this.tickCount = 0;
    this.log('Created');

    // Clients
    this.clients = new HashList();

    // Planets
    this.planets = new HashList();
    this.planetCombatTickRate = 6;

    // Players
    this.playerID = 1;
    this.playerMaxDrop = 100;
    this.playerMaxCount = 5;
    this.players = new HashList(this.playerMaxCount);
    this.playerColors = new IDList(this.playerMaxCount);
    this.playerNeutral = this.playerCreate({name: 'Neutral', id: 0}, true);
    this.playerHumanCount = 0;

    // Factories
    this.factoryID = 1;
    this.factories = new HashList();
    this.factoryHealth = 100;

    // Ships
    this.shipID = 1;
    this.ships = new HashList();
    this.shipSpeed = 9.54;
    this.shipOrbit = 15;
    this.shipToOrbitSpeed = 0.5;
    this.shipHealth = 20;
    this.shipToShipDamage = 5;
    this.shipToFactoryDamage = 5;

    // Map
    this.map = new OrbitMap(this);
    this.map.load('simpleFour');
    this.planetsSetup();

    // Game
    setTimeout(function(){that.run();}, 66);
}
exports.module = OrbitGame;


// Prototype -------------------------------------------------------------------
OrbitGame.extend('game/player', 'game/client', 'game/planet',
                 'game/factory', 'game/ship', 'game/util');

OrbitGame.extend({

    run: function() {
        var that = this;
        var frameTime = new Date().getTime();
        this.tick();

        var tickOffset = 66 - (new Date().getTime() - frameTime);
        this.tickNext = setTimeout(function() {that.run();}, tickOffset);

        if (this.playerHumanCount === 0 && this.clients.length === 0) {
            this.stop();
        }
    },

    tick: function() {
        this.tickCount++;
        this.tickPlanets();
        this.tickFactories();
        this.tickShips();
        this.tickPlayers();
        this.tickClients();
    },

    stop: function() {
        clearTimeout(this.tickNext);
        this.players.each(function(player) {
            player.quit();
        });

        this.players.clear();
        this.planets.clear();
        this.factories.clear();
        this.ships.clear();

        this.server.games.remove(this);
        this.log('Ended');
    },

    // Commands ----------------------------------------------------------------
    message: function(client, msg) {
        if (client.player && this.players.has(client.player)) {
            this.players.get(client.player).message(msg);
        }
    },

    // Helpers -----------------------------------------------------------------
    broadcast: function(type, msg) {
        this.server.broadcast(type, msg, this.clients);
    },

    broadcastNot: function(type, msg, clients) {
        this.server.broadcast(type, msg, clients, true);
    },

    getTick: function() {
        return this.tickCount;
    },

    log: function(msg) {
        console.log('[Game #' + this.id + '] ' + msg);
    }
});

