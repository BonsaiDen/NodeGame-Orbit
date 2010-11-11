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
var OrbitFactory = require('./factory').OrbitFactory;


// Orbit Planet Factories ------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    initFactories: function() {
        if (this.player.isHuman()) {
            this.createFactory(this.player, -1, true);
        
        } else {
            for(var i = 0; i < Math.max(Math.floor(this.factoryMax / 3), 1); i++) {
                this.createFactory(this.player, -1, true);
            }
        }
    },
    
    buildFactory: function(player, buildPlace) {        
        if (player === this.player) {
            this.createFactory(player, buildPlace, false);
        
        } else if (this.isNeutral() && this.factoriesComplete.length === 0
                   && this.getFactoryCount(player) === 0) {
            
            this.planetNodes.each(function(node) {
                if (node.player === player) {
                    this.createFactory(player, buildPlace, false);
                    return true;
                }
            }, this);
        }
    },
    
    createFactory: function(player, buildPlace, buildComplete) {
        if (this.factories.length >= this.factoryMax) {
            return false;
        }
        
        var angleOffset = Math.round(360 / this.factoryMax);
        if (buildPlace === -1) {
            var freeFactoryAngles = [];
            for(var i = 0; i < this.factoryMax; i++) {
                var currentAngle = (this.factoryAngle + i * angleOffset) % 360;
                var factoryAtAngle = false;
                this.factories.each(function(factory) {
                    if (factory.angle === currentAngle) {
                        factoryAtAngle = true;
                        return true;
                    }
                });
                if (!factoryAtAngle) {
                    freeFactoryAngles.push(currentAngle);
                }
            }
            freeFactoryAngles.sort(function(a, b) {
                return (Math.random() * 2) - 1;
            });
            new OrbitFactory(this, player, freeFactoryAngles[0], buildComplete);
        
        } else {
            var factoryAngle = (this.factoryAngle + buildPlace * angleOffset) % 360;
            var factoryAtAngle = false;
            this.factories.each(function(factory) {
                if (factory.angle === factoryAngle) {
                    factoryAtAngle = true;
                    return true;
                }
            });
            if (!factoryAtAngle) {
                new OrbitFactory(this, player, factoryAngle, buildComplete);
            }
        }
    },
    
    removeFactories: function(player) {
        this.factories.each(function(factory) {
            if (factory.player === player) {
                factory.destroy();
            }
        });
    },
    
    removeAllFactories: function() {
        this.factories.each(function(factory) {
            factory.destroy(true);
        });
    },
    
    checkFactoryTakeover: function(wasBuild) {
        if (this.getBuildFactoryCount(this.player) === 0 || wasBuild) {
            var player = this.getMaxBuildFactoriesPlayer();
            
            // A player has the most build factories
            if (player) {
                this.factories.each(function(factory) {
                    if (factory.player !== player) {
                        factory.destroy();
                    }
                });
                this.initPlayer(player);
            
            // Nobody has any build factories, this is the case when the last
            // one of the owning player was destroyed, so we destroy all remaing
            // in build factories of that player
            } else {
                this.removeFactories(this.player);
                this.makeNeutral();
            }
            this.update();
        }
    },
    
    getMaxBuildFactoriesPlayer: function() {
        var maxBuildPlayer = null;
        var maxBuildFactories = 0;
        this.game.players.each(function(player) {
            var buildFactories = this.getBuildFactoryCount(player);
            if (buildFactories > maxBuildFactories) {
                maxBuildPlayer = player;
                maxBuildFactories = buildFactories;
            }
        }, this);
        
        return maxBuildPlayer;
    },
    
    getBuildFactoryCount: function(player) {
        var count = 0;
        this.factoriesComplete.each(function(factory) {
            if (factory.player === player && factory.isBuild()) {
                count++;
            }
        });
        return count;
    },
    
    getBuildingFactoryCount: function(player) {
        var count = 0;
        this.factories.each(function(factory) {
            if (factory.player === player && factory.isBuilding()) {
                count++;
            }
        });
        return count;
    },
    
    getFactoryCount: function(player) {
        var count = 0;
        this.factories.each(function(factory) {
            if (factory.player === player) {
                count++;
            }
        });
        return count;
    }
};

