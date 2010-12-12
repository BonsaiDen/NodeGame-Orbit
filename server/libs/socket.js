// Bits and pieces *cough* stolen *cough* from
// Micheil Smith's node-websocket-server
// <http://github.com/miksago/node-websocket-server>

// Therefore, I don't really think that I should claim any copyright for 
// this piece of "minified" code.


var http = require('http');
var net = require('net');
var crypto = require('crypto');
var HashList = require('./hashlist').lib;


// WebSocekt Server ------------------------------------------------------------
// -----------------------------------------------------------------------------
function Server(flashSocket, encoder, decoder) {
    var that = this;
    this.encoder = encoder || function(data){return data.toString()};
    this.decoder = decoder || function(data){return data};
    
    this.server = new http.Server();
    this.flashSocket = flashSocket;
    this.bytesSend = 0;
    this.port = 0;
    
    this.connectionID = 1;
    this.connections = new HashList();
    
    this.server.addListener('upgrade', function(req, socket, upgradeHeader) {
        if (req.method === 'GET'
            && 'upgrade' in req.headers && 'connection' in req.headers
            && req.headers.connection.toLowerCase() === 'upgrade') {
            
            socket.setTimeout(0);
            socket.setNoDelay(true);
            socket.setKeepAlive(true, 0); 
            
            if (req.headers.upgrade.toLowerCase() === 'websocket') {
                new WebSocket(that, socket, req.headers, upgradeHeader);
            
            } else if (req.headers.upgrade.toLowerCase() === 'fluffsocket') {
                new FluffSocket(that, socket);
            
            } else {
                socket.end();
                socket.destroy();      
            }
        
        } else {
            socket.end();
            socket.destroy();
        }
    });
}
exports.lib = Server;


// Prototype -------------------------------------------------------------------
Server.prototype = {
    onConnect: function(conn) {},
    onMessage: function(conn, data) {},
    onClose: function(conn) {},
    
    add: function(conn) {
        this.connections.add(conn);
        this.onConnect(conn);
    },
    
    remove: function(conn) {
        if (this.connections.remove(conn)) {
            this.onClose(conn);
        }
    },
    
    broadcast: function(data) {
        var bytes = 0;
        var msg = this.encoder ? this.encoder(data) : data;
        this.connections.each(function(item) {
            bytes += item.send(msg, true);
        });
        return bytes;
    },
    
    listen: function(port) {
        this.port = port;
        if (this.flashSocket) {
            try {
                this.initFlash();
            
            } catch (e) {
                this.flashSocket = false;
            }
        }
        this.server.listen(this.port);
    },
    
    initFlash: function() {
        net.createServer(function(socket) {
            socket.write('<?xml version="1.0"?>'
                + '<!DOCTYPE cross-domain-policy SYSTEM '
                + '"http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">'
                + '<cross-domain-policy>'
                + '    <allow-access-from domain="*" to-ports="*" />'
                + '</cross-domain-policy>'
            );
            socket.end();
            socket.destroy();
        
        }).listen(843);
    },
    
    supportsFlash: function() {
        return this.flashSocket;
    }
};
exports.Server = Server;


// WebSockets ------------------------------------------------------------------
// -----------------------------------------------------------------------------
function WebSocket(server, socket, headers, upgradeHeader) {
    this.server = server;
    this.socket = socket;
    this.host = this.socket.remoteAddress;
    this.port = this.socket.remotePort;
    this.connected = false;
    this.version = -1;
    this.id = server.connectionID++;
    
    this.bytesSend = 0;
    this.dataFrames = [];
    this.dataState = 0;
    
    if (this.establish(headers, upgradeHeader)) {
        this.init();
        this.server.add(this);
    }
};


// Prototype -------------------------------------------------------------------
WebSocket.prototype = {
    init: function() {
        var that = this;
        this.socket.addListener('data', function(data) {that.read(data);});
        this.socket.addListener('end', function() {that.server.remove(that);});
        this.socket.addListener('error', function() {that.close();});
        
        this.connected = true;
    },
    
    send: function(data, encoded) {
        if (this.connected) {
            return this.write(encoded ? data : this.server.encoder(data));
        
        } else {
            return 0;
        }
    },
    
    close: function() {
        if (this.connected) {
            this.connected = false;
            this.write(null);
            this.socket.end();
            this.socket.destroy();
            this.server.remove(this);
        }
    },
    
    read: function read(data) {
        for(var i = 0, l = data.length; i < l; i++) {
            var b = data[i];
            if (this.dataState === 0) {
                this.dataState = b & 0x80 === 0x80 ? 2 : 1;
            
            // Low bit frame
            } else if (this.dataState === 1) {
                if (b === 0xff) {
                    var buffer = new Buffer(this.dataFrames);
                    this.dataFrames = [];
                    this.dataState = 0;
                    
                    if (!this.message(buffer.toString('utf8', 0, buffer.length))) {
                        this.send({error: 'Invalid Message.'});
                        this.close();
                        return;
                    }
                
                } else {
                    this.dataFrames.push(b);
                }
            
            // Unused high bit frames
            } else if (this.dataState === 2) {
                if (b === 0x00) {
                    this.close();
                }
            }
        }
    },
    
    write: function(data) {
        var bytes = 0;
        if (!this.socket.writable) {
            return bytes;
        }
        
        try {
            this.socket.write('\x00', 'binary');
            if (typeof data === 'string') {
                this.socket.write(data, 'utf8');
                bytes += Buffer.byteLength(data);
            }
            this.socket.write('\xff', 'binary'); 
            this.socket.flush();
            bytes += 2;
        
        } catch(e) {}
        
        this.bytesSend += bytes;
        this.server.bytesSend += bytes;
        return bytes;
    },
      
    message: function(msg) {
        if (this.server.decoder) {
            try {
                msg = this.server.decoder(msg);
            
            } catch(e) {  
                this.close();
                return false;
            }
        }
        this.server.onMessage(this, msg);
        return true;
    },
    
    establish: function(headers, upgradeHeader) {
        
        // Draft 76
        if ('sec-websocket-key1' in headers
            && 'sec-websocket-key2' in headers) {
            
            var data = 'HTTP/1.1 101 WebSocket Protocol Handshake\r\n'
                        + 'Upgrade: WebSocket\r\n'
                        + 'Connection: Upgrade\r\n'
                        + 'Sec-WebSocket-Origin: ' + headers.origin + '\r\n'
                        + 'Sec-WebSocket-Location: ws://' + headers.host + '/';
            
            var key1 = headers['sec-websocket-key1'];
            var key2 = headers['sec-websocket-key2'];
            
            var num1 = parseInt(key1.replace(/[^\d]/g, ''), 10);
            var num2 = parseInt(key2.replace(/[^\d]/g, ''), 10);
            
            var spaces1 = key1.replace(/[^\ ]/g, '').length;
            var spaces2 = key2.replace(/[^\ ]/g, '').length;
            
            if (spaces1 === 0 || spaces2 === 0
                || num1 % spaces1 != 0 || num2 % spaces2 != 0) {
                
                this.socket.end();
                this.socket.destroy();
                return false;
            
            } else {
                var hash = crypto.createHash('md5');
                hash.update(pack(parseInt(num1 / spaces1)));
                hash.update(pack(parseInt(num2 / spaces2)));
                hash.update(upgradeHeader.toString('binary'));
                data += '\r\n\r\n';
                data += hash.digest('binary');
                
                this.socket.write(data, 'binary');
                this.socket.flush();
                this.version = 76;
                return true;
            }
        
        // Draft 75
        } else {
            var data = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n'
                        + 'Upgrade: WebSocket\r\n'
                        + 'Connection: Upgrade\r\n'
                        + 'WebSocket-Origin: ' + headers.origin + '\r\n'
                        + 'WebSocket-Location: ws://' + headers.host + '/';
             
            data += '\r\n\r\n';
            this.socket.write(data, 'ascii');
            this.socket.flush();
            this.version = 75;
            return true;
        }
    }
};


// FluffSockets ----------------------------------------------------------------
// -----------------------------------------------------------------------------
function FluffSocket(server, socket) {
    this.server = server;
    this.socket = socket;
    this.socket.setEncoding('utf-8');
    this.host = this.socket.remoteAddress;
    this.port = this.socket.remotePort;
    this.connected = false;
    this.id = server.connectionID++;
    
    this.dataBuffer = '';
    this.dataSize = -1;
    this.init();
    this.server.add(this);
};


// Prototype -------------------------------------------------------------------
FluffSocket.prototype = {
    init: function(req) {
        var that = this;
        this.socket.addListener('data', function(data) {that.read(data);});
        this.socket.addListener('end', function() {that.server.remove(that);});
        this.socket.addListener('error', function() {that.close();});
        
        this.connected = true;
    },
    
    send: function(data, encoded) {
        if (this.connected) {
            return this.write(encoded ? data : this.server.encoder(data));
        
        } else {
            return 0;
        }
    },
    
    close: function() {
        if (this.connected) {
            this.connected = false;
            this.socket.end();
            this.socket.destroy();
            this.server.remove(this);
        }
    },
    
    read: function read(data) {
        if (!this.connected) {
            return false;
        }
        this.dataBuffer += data;
        
        var more = true;
        while (more) {
            more = false;
            var len = this.dataBuffer.length;
            if (this.dataSize === -1) {
                if (len >= 2) {
                    this.dataSize = (this.dataBuffer.charCodeAt(0) << 16)
                                     + this.dataBuffer.charCodeAt(1);
                    
                    this.dataBuffer = this.dataBuffer.substr(2);
                }
            }
            if (this.dataSize !== -1 && len >= this.dataSize) {
                if (!this.message(this.dataBuffer.substr(0, this.dataSize))) {
                    this.send({error: 'Invalid Message.'});
                    this.close();
                    return;
                }
                this.dataBuffer = this.dataBuffer.substr(this.dataSize);
                this.dataSize = -1;
                more = true;
            }
        }
    },
    
    write: function(data) {
        var bytes = 0;
        if (!this.socket.writable) {
            return bytes;
        }
        
        try {
            var size = data.length;
            if (typeof data === 'string') {
                var msg = String.fromCharCode((size >> 16) & 0xffff)
                          + String.fromCharCode(size & 0xffff) + data;
                
                this.socket.write(msg, 'utf8');
                bytes += Buffer.byteLength(msg);
            }
            this.socket.flush();
        
        } catch(e) {}
        
        this.bytesSend += bytes;
        this.server.bytesSend += bytes;
        return bytes;
    },
      
    message: function(msg) {
        if (this.server.decoder) {
            try {
                msg = this.server.decoder(msg);
            
            } catch(e) {  
                this.close();
                return false;
            }
        }
        this.server.onMessage(this, msg);
        return true;
    }
};


// Helpers ---------------------------------------------------------------------
function pack(num) {
    return String.fromCharCode(num >> 24 & 0xFF)
           + String.fromCharCode(num >> 16 & 0xFF)
           + String.fromCharCode(num >> 8 & 0xFF)
           + String.fromCharCode(num & 0xFF);
}

