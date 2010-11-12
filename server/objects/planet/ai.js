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


// Orbit Planet AI -------------------------------------------------------------
// -----------------------------------------------------------------------------
exports.methods = {
    
    tickAI: function() {
    
        var buildSomething = this.getTick() > this.neutralTick; 
        var factoryHasBeenBuilt = false;
        var neutralCount = this.getPlayerShipCount(this.player);
        var enemyCount = this.enemyShips.length;
        var neutralReady = this.getShipReadyCount(this.player);
        var factoryCount = this.getFactoryCount(this.player);
        var buildingFactoriesCount = this.getBuildingFactoryCount(this.player);
        
        this.neutralAttacked = enemyCount > 0; 
        
        // Factory to send stuff to
        var factoryToBuild = null;
        var factoryMaxRequired = 0;
        
        // Ship count
        var planetToGet = null;
        var planetMaxCount = 0;
        
        // Check surrounding nodes
        var borderPlanet = false;
        this.planetNodes.each(function(node) {
            var nodeNeutralCount = node.getPlayerShipCount(this.player);
            var nodeEnemyCount = node.enemyShips.length
            
            if (node.player === this.player) {
                this.neutralBorder = false;

                // Request help from the node
                if (enemyCount > neutralCount
                    && neutralCount > node.shipMax * 0.125) {
                    
                    var shipsReady = node.getShipReadyCount(this.player);
                    if (enemyCount > neutralCount * 1.5) {
                  //      console.log('send small help from', node.id, 'to', this.id);
                        node.sendShips(this.player, this,
                                       Math.floor(shipsReady * 0.9), true);
                    
                    } else {
                  //      console.log('send big help from', node.id, 'to', this.id);
                        node.sendShips(this.player, this,
                                       Math.floor(shipsReady * 0.4), false);
                      
                    }
                
                // Send ships for building at the node
                } else {
                    node.factories.each(function(factory) {
                        if (factory.player === this.player) {
                            if (factory.isBuilding()) {
                                if (factory.requiredCount() > factoryMaxRequired) { 
                                    factoryToBuild = factory;
                                    factoryMaxRequired = factory.requiredCount();
                                }
                            }
                        }
                    }, this);
                    
                    if (nodeNeutralCount > planetMaxCount
                        && !node.neutralAttacked && !node.neutralBorder) {
                        
                        planetMaxCount = nodeNeutralCount;
                        planetToGet = node;
                    }
                }
                
            } else {
                // Attack that node
                if (nodeEnemyCount > node.shipMax * 0.125
                    && neutralCount >= nodeEnemyCount
                    && (buildingFactoriesCount === 0
                        || factoryCount > this.factoryMax * 0.25)) {
                
                    if (nodeEnemyCount > node.shipMax * 0.75
                        && buildingFactoriesCount === 0) {
                        
                       // console.log('big attack from', this.id, 'on', node.id);
                        this.sendShips(this.player, node,
                                       Math.floor(neutralReady * 0.9), false);          
                    
                    } else if (nodeEnemyCount > node.shipMax * 0.25
                        && neutralCount > nodeEnemyCount * 1.5) {
                        
                      //  console.log('small attack from', this.id, 'on', node.id);
                        this.sendShips(this.player, node,
                                       Math.floor(neutralReady * 0.5), true);        
                    
                    } else if (nodeEnemyCount === 0
                        && neutralCount > this.shipMax * 0.1) {
                        
                      //  console.log('take attack from', this.id, 'on', node.id);
                        this.sendShips(this.player, node,
                                       Math.floor(neutralReady * 0.3), true);        
                    
                    }
                }
                borderPlanet = true;
                this.neutralBorder = true;
            }
        }, this);
        neutralReady = this.getShipReadyCount(this.player);
        
        // Build something on the planet
        if (((buildSomething && (neutralReady > this.shipMax * 0.10 || !borderPlanet))
            || (borderPlanet && factoryCount < this.factoryMax * 0.65))
            && buildingFactoriesCount === 0) {
            
            this.buildFactory(this.player, -1);
            buildingFactoriesCount = 1;
        }
        
        // Send ships to build
        if (!borderPlanet && neutralReady > this.shipMax * 0.10) {
            if (factoryToBuild && (buildingFactoriesCount === 0
                                   || factoryCount > this.factoryMax / 2.5)) {
                
                if (neutralReady > factoryMaxRequired * 0.25) {
                 //   console.log('sending for build from', this.id, 'to', factoryToBuild.planet.id);
                    this.sendShips(this.player, factoryToBuild.planet,
                                                factoryMaxRequired, true);
                }
            }
        }
        
        // Equalize ships
        if (planetToGet && neutralCount < this.shipMax * 0.75) {
            if (planetMaxCount > planetToGet.shipMax * 0.35) {
              //  console.log('equalizing from', planetToGet.id, 'to', this.id);
                
                var sendCount = 2 + Math.random() * planetToGet.shipMax * 0.2;
                planetToGet.sendShips(this.player, this, sendCount, true);
            }
        }
        this.neutralTick = Math.floor(this.getTick() + 500 + (700 * Math.random())); 
    }
};

