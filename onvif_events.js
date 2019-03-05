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
    const utils = require('./utils');
    
    function OnVifEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.action = config.action;
        
        var node = this;
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'device', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'device', node.deviceConfig.onvifStatus);
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.deviceConfig || node.deviceConfig.onvifStatus != "connected") {
                //console.warn('Ignoring input message since the device connection is not complete');
                return;
            }

            if (!node.deviceConfig.cam.capabilities['device']) {
                //console.warn('Ignoring input message since the device does not support the device service');
                return;
            }
            
            var action = node.action || msg.action;
            
            if (!action) {
                console.warn('When no action specified in the node, it should be specified in the msg.action');
                return;
            }
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;

            try {
                switch (action) {
                    case "start":
                        if (node.eventListener) {
                            console.warn("The node is already listening to events");
                            return;
                        }
                        
                        node.eventListener = function(camMessage) {
                            // As soon as we get an event from the camera, we will send it to the output of this node
                            newMsg.payload = camMessage;
                            node.send(newMsg);
                        }
                        
                        // Start listening to events from the camera
                        node.deviceConfig.cam.on('event', node.eventListener);
                        break;
                    case "stop":
                        if (!node.eventListener) {
                            console.warn("The node was not listening to events anyway");
                            return;
                        }

                        // Stop listening to events from the camera
                        node.deviceConfig.cam.removeListener('event', node.eventListener);
                        node.eventListener = null;
                        break;               
                    default:
                        //node.status({fill:"red",shape:"dot",text: "unsupported action"});
                        console.log("Action " + action + " is not supported");                    
                }
            }
            catch (exc) {
                console.log("Action " + action + " failed:");
                console.log(exc);
            }
        });
        
        node.on("close",function() { 
            if (node.listener) {
                node.deviceConfig.removeListener("onvif_status", node.listener);
            }
            
            // Stop listening to events from the camera
            if (node.eventListener) {
                node.deviceConfig.cam.removeListener('event', node.eventListener);
                node.eventListener = null;
            }
        });
    }
    RED.nodes.registerType("onvif-events",OnVifEventsNode);
}
