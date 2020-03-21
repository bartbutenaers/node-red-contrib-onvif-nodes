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
    
    function OnVifDeviceNode(config) {
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
            
            node.deviceConfig.initialize();
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            var action = node.action || msg.action;
            
            if (!action) {
                console.warn('When no action specified in the node, it should be specified in the msg.action');
                return;
            }
            
            // Don't perform these checks when e.g. the device is currently disconnected (because then e.g. no capabilities are loaded yet)
            if (action !== "reconnect") {
                if (!node.deviceConfig || node.deviceConfig.onvifStatus !== "connected") {
                    //console.warn('Ignoring input message since the device connection is not complete');
                    return;
                }

                if (!node.deviceConfig.cam.capabilities['device']) {
                    //console.warn('Ignoring input message since the device does not support the device service');
                    return;
                }
            }
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;

            try {
                switch (action) {
                    case "getDeviceInformation":
                        node.deviceConfig.cam.getDeviceInformation(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "getHostname":
                        node.deviceConfig.cam.getHostname(function(err, date, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;               
                    case "getSystemDateAndTime":
                        node.deviceConfig.cam.getSystemDateAndTime(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;                     
                    case "getServices":
                        node.deviceConfig.cam.getCapabilities(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "getCapabilities":
                        node.deviceConfig.cam.getCapabilities(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "getScopes":
                        node.deviceConfig.cam.getScopes(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "systemReboot":
                        node.deviceConfig.cam.systemReboot(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "getServiceCapabilities":
                        node.deviceConfig.cam.getCapabilities(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;      
                    case "reconnect":
                        node.deviceConfig.cam.connect(function(err) {
                            utils.handleResult(node, err, "", null, newMsg);
                        });
                        break
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
        });
    }
    RED.nodes.registerType("onvif-device",OnVifDeviceNode);
}
