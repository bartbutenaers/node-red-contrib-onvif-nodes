/**
 * Copyright 2018 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const onvif = require('onvif');

    function OnVifDiscoveryNode(config) {
        RED.nodes.createNode(this, config);
        this.separate = config.separate;
        this.discovering = false;
        this.timer = null;
        this.counter = 0;

        var node = this;
        
        // Simplify the result, so it becomes more easy to parse it with Node-Red
        function simplifyResult(result) {
            // Reduce the property depth
            probeMatch = result.probeMatches.probeMatch;
                        
            // Convert the long (space separated) strings to arrays of strings                  
            probeMatch.types  = probeMatch.types.trim().split(" ");
            probeMatch.scopes = probeMatch.scopes.trim().split(" ");
            probeMatch.XAddrs = probeMatch.XAddrs.trim().split(" ");
            
            return probeMatch;
        }
        
        // Register once a listener for device events.
        // The callback function will be called immediately when a device responses.
        onvif.Discovery.on('device', function(result){
            node.counter++;
            
            if (node.separate) {
                // Send a separate output message for every discovered OnVif-compliant IP device
                node.send({payload: simplifyResult(result)}); 
            }
        });
        
        node.on("input", function(msg) {  
            var probeMatch;
        
            if (node.discovering) {
                console.info("Discovery request ignored, since other discovery is active");
                return;
            }
            
            node.status({fill:"yellow",shape:"dot",text:"discovering"});
            node.counter = 0;
            node.discovering = true;
            
            var options = { 
                timeout: node.timeout, // Discovery should end after the specified timeout
                resolve: false // Return discovered devices as data objects, instead of Cam instances
            };

            // Start discovery of the ONVIF network devices.
            // The callback function will be called only once, when the broadcast is finished (after the timeout).
            onvif.Discovery.probe(options, function(err, result) {
                if (err) { 
                    console.log(err);
                    node.status({fill:"red",shape:"dot",text: "failed"});
                }
                else {
                    node.status({fill:"green",shape:"dot",text: "completed (" + node.counter + "x)"});
                }           
                
                if (!node.separate) {
                    var devices = [];
                    
                    // Convert the array to an easy format
                    for (var i = 0; i < result.length; i++) {
                        devices.push(simplifyResult(result[i]));
                    }
                    
                    // Send a single message, containing an array of ALL discovered OnVif-compliant IP devices
                    node.send({payload: devices});
                }
                
                node.discovering = false;
            });
        });
        
		node.on('close', function(){
			node.status({});
            if (node.timer) {
                clearTimeout(node.timer);
            }
            node.counter = 0;
            node.discovering = false;
		});
    }
    RED.nodes.registerType("onvifdiscovery",OnVifDiscoveryNode);
}
 
