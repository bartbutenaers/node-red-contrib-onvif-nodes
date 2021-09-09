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
    const onvif  = require('onvif');
    const utils  = require('./utils');

    function OnVifImagingNode(config) {
        RED.nodes.createNode(this, config);
        this.action = config.action;
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'imaging_service', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'imaging_service', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            var action = node.action || msg.action;

            if (!action) {
                // When no action specified in the node, it should be specified in the msg.action
                node.error("No action specified (in node or msg)");
                return;
            }
            
            // Don't perform these checks when e.g. the device is currently disconnected (because then e.g. no capabilities are loaded yet)
            if (action !== "reconnect") {
                if (!node.deviceConfig || node.deviceConfig.onvifStatus != "connected") {
                    node.error("This node is not connected to a device");
                    return;
                }

                if (!utils.hasService(node.deviceConfig.cam, 'imaging_service')) {
                    node.error("The device has no support for a ptz service");
                    return;
                }
            }

            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;            
         
            try {
                switch (action) { 
                    case 'getImagingSettings':
                        node.deviceConfig.cam.getImagingSettings(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;
                    case 'setImagingSettings':
                        var options = {};
                        
                        if (msg.payload) {
                            if (msg.payload.backlightCompensation) {
                                options.backlightCompensation = msg.payload.backlightCompensation;
                            }
                            
                            if (msg.payload.brightness) {
                                options.brightness = msg.payload.brightness;
                            }
                            
                            if (msg.payload.colorSaturation) {
                                options.colorSaturation = msg.payload.colorSaturation;
                            }
                            
                            if (msg.payload.contrast) {
                                options.contrast = msg.payload.contrast;
                            }
                            
                            if (msg.payload.exposure) {
                                options.exposure = msg.payload.exposure;
                            }
                         
                            if (msg.payload.focus) {
                                options.focus = msg.payload.focus;
                            }
                            
                            if (msg.payload.irCutFilter) {
                                options.irCutFilter = msg.payload.irCutFilter;
                            }
                            
                            if (msg.payload.sharpness) {
                                options.sharpness = msg.payload.sharpness;
                            }
                            
                            if (msg.payload.wideDynamicRange) {
                                options.wideDynamicRange = msg.payload.wideDynamicRange;
                            }
                            
                            if (msg.payload.whiteBalance) {
                                options.whiteBalances = msg.payload.whiteBalance;
                            }
                         
                            if (msg.payload.focus) {
                                options.focus = msg.payload.focus;
                            }

                            if (msg.payload.extension) {
                                options.extension = msg.payload.extension;
                            }   
                        }                            
                        
                        // TODO we should be able to specify (in the options) the video source token, because by default the active video source will be updated.
                        
                        if (Object.keys(options).length === 0) {
                            node.error('No image settings have been specified.'); 
                            return;
                        }
            
                        node.deviceConfig.cam.setImagingSettings(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                    case 'getServiceCapabilities':
                        node.deviceConfig.cam.getImagingServiceCapabilities(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;
                    case "reconnect":
                        node.deviceConfig.cam.connect();
                        break;
                    default:
                        //node.status({fill:"red",shape:"dot",text: "unsupported action"});
                        node.error("Action " + action + " is not supported");
                }
            }
            catch (exc) {
                node.error("Action " + action + " failed: " + exc);
            }
        });
        
        node.on("close",function() { 
            if (node.listener) {
                node.deviceConfig.removeListener("onvif_status", node.listener);
            }
        });
    }
    RED.nodes.registerType("onvif-imaging",OnVifImagingNode);
}
