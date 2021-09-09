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
        this.timeout     = parseInt(config.timeout) * 1000; // Seconds
        this.separate    = config.separate;
        this.discovering = false;

        var node = this;
        
        // Simplify the result, so it becomes more easy to parse it with Node-Red
        function simplifyResult(result) {
            var probeMatch;
		
            // Reduce the property depth
            probeMatch = result.probeMatches.probeMatch;
                        
            // The result can be an array of strings, or a long (space separated) string.
            // In case of a long string, split it to an array of strings...
            
            if (typeof probeMatch.types === 'string' || probeMatch.types instanceof String) {
                probeMatch.types  = probeMatch.types.trim().split(" ");
            }
            
            if (typeof probeMatch.scopes === 'string' || probeMatch.scopes instanceof String) {
                probeMatch.scopes = probeMatch.scopes.trim().split(" ");
            }
            
            if (typeof probeMatch.XAddrs === 'string' || probeMatch.XAddrs instanceof String) {
                probeMatch.XAddrs = probeMatch.XAddrs.trim().split(" ");
            }
            
            return probeMatch;
        }

        node.on("input", function(msg) {         
            if (node.discovering) {
                console.info("Discovery request ignored, since other discovery is active");
                return;
            }
                  
            node.status({fill:"yellow",shape:"dot",text:"discovering"});
            node.discovering = true;
            
            var options = { 
                timeout: node.timeout, // Discovery should end after the specified timeout
                resolve: false // Return discovered devices as data objects, instead of Cam instances
            };
            
            // For every discovery we will need to remove all previous ('device' and 'error') listeners, and add new listeners.
            // See https://discourse.nodered.org/t/object-property-becomes-undefined/50647/2?u=bartbutenaers
            onvif.Discovery.removeAllListeners();
            
            // When a separate output message per device is required, then listen to every separate device being detected
            if (node.separate) {
                onvif.Discovery.on('device', function (result) {
                    // Since the same input message will be resend for every Onvif device found, we need to clone the input message
                    var outputMsg = RED.util.cloneMessage(msg);
                    outputMsg.payload = simplifyResult(result);
                    
                    // Send a separate output message for every discovered OnVif-compliant IP device
                    node.send(outputMsg); 
                });
            }
                
            // The discovery must have an error handler to catch bad replies from the network (which cannot be parsed by this library)
            onvif.Discovery.on('error', function (err, xml) {
                node.error('Discovery error ' + err);
            });

            // Start discovery of the ONVIF network devices.
            // The callback function will be called only once, when the broadcast is finished (after the timeout).
            onvif.Discovery.probe(options, function(err, result) {
                if (err) { 
                    node.error(err.message);
                    node.status({fill:"red",shape:"dot",text: "failed"});
                }
                else {
                    node.status({fill:"green",shape:"dot",text: "completed (" + result.length + "x)"});
                }           
                
                // When a single message needs to be send (containing all discovered devices)...
                if (!node.separate) {
                    var devices = [];
                    
                    // Convert the array to an easy format
                    for (var i = 0; i < result.length; i++) {
                        devices.push(simplifyResult(result[i]));
                    }
                    
                    // Send a single message, containing an array of ALL discovered OnVif-compliant IP devices
                    var outputMsg = msg;
                    outputMsg.payload = devices;
                    node.send(outputMsg);
                }
                
                node.discovering = false;
            });
        });
        
		node.on('close', function(){
			node.status({});
            onvif.Discovery.removeAllListeners();
            node.discovering = false;
		});
    }
    RED.nodes.registerType("onvif-discovery",OnVifDiscoveryNode);
}
 
