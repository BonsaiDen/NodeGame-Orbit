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



var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) {
        filename += '/index.html';
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });

}).listen(8080);

