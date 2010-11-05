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


var util = require('util');


// Server Status ---------------------------------------------------------------
// -----------------------------------------------------------------------------
function Status(server) {
    this.$$ = server;
    this.startTime = this.getTime();
    this.bytesSendLast = 0;
    this.logs = [];
    
    var that = this;
    console.log = function() {
        that.log.apply(that, arguments);
    }
}
exports.Status = Status;


// Status Screen ---------------------------------------------------------------
Status.prototype.update = function(end) {
    var that = this;
    var stats = '  Running ' + this.toTime(this.getTime()) + ' | '
                + this.$$.clientCount
                + ' Clients(s) | '
                + this.$$.gameCount
                + ' Game(s) | Traffic '
                + this.toSize(this.$$.bytesSend)
                + ' | '
                + this.toSize((this.$$.bytesSend - this.bytesSendLast) * 2)
                + '/s\n';
    
    this.bytesSendLast = this.$$.bytesSend;
    for(var i = this.logs.length - 1; i >= 0; i--) {
        stats += '\n    ' + this.toTime(this.logs[i][0])
                            + '' + this.logs[i][1];
    }
    util.print('\x1b[H\x1b[J# NodeGame: Orbit at port '
              + this.$$.port + (this.$$.flash ? ' / 843' : '')
              + '\n' + stats + '\n\x1b[s\x1b[H');
    
    if (!end) {
        setTimeout(function() {that.update(false)}, 500);
    
    } else {
        util.print('\x1b[u\n');
    }
};

Status.prototype.log = function() {
    var str = [];
    for(var i = 0; i < arguments.length; i++) {
        str.push('' + arguments[i]);
    }
    
    this.logs.push([this.getTime(), str.join(' ')]);
    if (this.logs.length > 18) {
        this.logs.shift();
    }
};

Status.prototype.logError = function(e) {
    var parts = (e.stack || e.message).split('\n');
    for(var i = parts.length - 1; i >= 0; i--) {
        this.logs.push([-1, (i > 0 ? '  ' : '') + parts[i].trim()]);
        if (this.logs.length > 18) {
            this.logs.shift();
        } 
    }
};


// Helpers ---------------------------------------------------------------------
Status.prototype.getTime = function() {
    return new Date().getTime();
};

Status.prototype.toSize = function(size) {
    var t = 0;
    while(size >= 1024 && t < 2) {
        size = size / 1024;
        t++;
    }
    return Math.round(size * 100) / 100 + [' bytes', ' kib', ' mib'][t];
};

Status.prototype.toTime = function(time) {
    if (time === -1) {
        return '';
    }
    
    var t = Math.round((time - this.startTime) / 1000);
    var m = Math.floor(t / 60);
    var s = t % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + ' ';
};

