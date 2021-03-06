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
var Orbit = null;

function initGame() {
    new Client(HOST, PORT);
}


// Game ------------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Game(client) {
    Orbit = this;
    this.$$ = client;
    this.coreInit();
}


// Mainloop --------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.run = function() {

    if (this.running) {
        var frame = new Date().getTime();

        // Handle Messages
        while (this.messageQueue.length > 0) {
            this.netMessage(this.messageQueue.shift());
        }

        // Update Planets
        for(var i = 0, l = this.planetList.length; i < l; i++) {
            this.planetList[i].tick();
            if ((this.tickCount % this.combatTickRate) === 0) {
                this.planetList[i].tickCombat();
            }
        }

        // Update Ships
        for(var i = 0, l = this.shipList.length; i < l; i++) {
            this.shipList[i].tick();
        }

        // Update Players
        for(var i in this.players) {
            this.players[i].tick();
        }

        // Control Camera
        this.inputKeyboard();

        // Render
        this.drawTick();

        // Next Frame
        this.tickCount += 0.5;
        var that = this;
        setTimeout(function() {that.run();}, 33 - (new Date().getTime() - frame));
    }
};


// Helpers ---------------------------------------------------------------------
Game.prototype.getTick = function() {
    return this.tickCount;
};


// Client ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
function initGame() {
    var GameClient = new Client(HOST, PORT);
}

function Client(host, port) {
    this.$ = new Game(this);

    var that = this;
    this.conn = new WebSocket('ws://' + host + ':' + port);
    this.conn.onopen = function() {
        that.connected = true;
        that.$.onConnect(true);
    };

    this.conn.onmessage = function(msg) {
        var bison = BISON.decode(msg.data);
        if (msg === undefined) {
            console.log('Network ERROR: ' + msg.data);

        } else {
            that.$.onMessage(bison);
        }
    };

    this.conn.onerror = this.conn.onclose = function(e) {
        if (that.connected) {
            that.$.onClose();

        } else {
            that.$.onConnect(false);
        }
    };
}

Client.prototype.send = function(msg) {
    this.conn.send(BISON.encode(msg));
};


// Stuff -----------------------------------------------------------------------
function $(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
}

