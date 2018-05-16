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
    const onvif = require('node-onvif');

    function OnVifDiscoveryNode(config) {
        RED.nodes.createNode(this, config);
        this.separate = config.separate;

        var node = this;
        
        node.on("input", function(msg) {
            if (typeof msg.payload == 'string' || msg.payload instanceof String) { 
                var command = msg.payload.toUpperCase();
                
                switch (command) {
                    case 'START':
                        node.status({fill:"yellow",shape:"dot",text:"discovering"});
                        
                        // Start discovery of the ONVIF network devices
                        onvif.startProbe().then((device_info_list) => {
                            node.status({fill:"green",shape:"dot",text: "completed"});
                            
                            if (node.separate) {
                                // Send a separate output message for every discovered OnVif-compliant IP device
                                device_info_list.forEach((info) => {
                                    node.send({payload: info});
                                });
                            }
                            else {
                                // Send a single message, containing an array of ALL discovered OnVif-compliant IP devices
                                node.send({payload: device_info_list});
                            }
                        });
                        break;
                    case 'STOP':
                        onvif.stopProbe().then(() => {
                            node.status({fill:"green",shape:"dot",text: "stopped"});
                            console.log('Aborted the OnVif discovery process.');
                        }).catch((error) => {
                            console.error(error);
                        });
                        break;
                    default:
                        console.log('The msg.payload should contain a START or STOP string');
                }
            }
            else {
                console.log('The msg.payload should contain a START or STOP string');
            }
        });
    }
    RED.nodes.registerType("onvifdiscovery",OnVifDiscoveryNode);
}
