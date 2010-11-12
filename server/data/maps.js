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


// Orbit Maps ------------------------------------------------------------------
// -----------------------------------------------------------------------------
exports.data = {
    
    standard: 'simpleFour',

    // Simple Four -------------------------------------------------------------
    simpleFour: {
    
        width: 640,
        height: 480,
        planets: [
        
            // Top Left
            {
                id: 1, x: 64, y: 56,
                size: 22,
                nodes: [2],
                shipMax: 15, factoryMax: 4,
                start: true
            },
            
            {
                id: 2, x: 176, y: 128,
                size: 50, nodes: [11, 9, 1, 13],
                shipMax: 25, factoryMax: 6
            },
            
            // Bottom Right
            {
                id: 5, x: 576, y: 424,
                size: 22,
                nodes: [6],
                shipMax: 15, factoryMax: 4,
                start: true
            },
            
            {
                id: 6, x: 464, y: 352,
                size: 50, nodes: [12, 10, 5, 14],
                shipMax: 25, factoryMax: 6
            },
            
            // Top Right
            {
                id: 3, x: 576, y: 56,
                size: 22,
                nodes: [4],
                shipMax: 15, factoryMax: 4,
                start: true
            },
            
            {
                id: 4, x: 464, y: 128,
                size: 50, nodes: [12,  9, 3, 14],
                shipMax: 25, factoryMax: 6
            },
            
            // Bottom Left
            {
                id: 7, x: 64, y: 424,
                size: 22,
                nodes: [8],
                shipMax: 15, factoryMax: 4,
                start: true
            },
            
            {
                id: 8, x: 176, y: 352,
                size: 50, nodes: [11, 10, 7, 13],
                shipMax: 25, factoryMax: 6
            },
            
            // Center
            {
                id: 9, x: 320, y: 56,
                size: 27,
                nodes: [2, 4],
                shipMax: 15, factoryMax: 3
            },
            
            {
                id: 10, x: 320, y: 424,
                size: 27, nodes: [6, 8],
                shipMax: 15, factoryMax: 3
            },
            
            // Sides
            {
                id: 11, x: 120, y: 240,
                size: 21,
                nodes: [2, 8],
                shipMax: 12, factoryMax: 2
            },
            
            {
                id: 12, x: 520, y: 240,
                size: 21, nodes: [4, 6],
                shipMax: 12, factoryMax: 2
            },
            
            {
                id: 13, x: 232, y: 240,
                size: 21,
                nodes: [2, 8],
                shipMax: 12, factoryMax: 2
            },
            
            {
                id: 14, x: 408, y: 240,
                size: 21, nodes: [4, 6],
                shipMax: 12, factoryMax: 2
            }
        ]
    }
};

