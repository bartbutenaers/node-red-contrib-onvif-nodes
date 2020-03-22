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
                utils.setNodeStatus(node, 'imaging', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'imaging', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.deviceConfig || node.deviceConfig.onvifStatus != "connected") {
                //console.warn('Ignoring input message since the device connection is not complete');
                return;
            }

            if (!node.deviceConfig.cam.capabilities['imaging']) {
                //console.warn('Ignoring input message since the device does not support the imaging service');
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
                    case 'getImagingSettings':
                        node.deviceConfig.cam.getImagingSettings(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;
                    case 'setImagingSettings':
                        var options = {};
                        
                        // TODO we should be able to specify (in the options) the video source token, because by default the active video source will be updated.
                        
                        // Check whether a 'brightness' value is specified in the input message
                        if (msg.hasOwnProperty('brightness') /*TODO CHECK VIA PROFILE RANGE  || msg.brightness < -1.0 || msg.brightness > 1.0*/) {
                            if (isNaN(msg.brightness)) {
                                console.error('The msg.brightness value should be a number between ?? and ??'); // TODO find boundaries in profile
                            }
                            else {
                                options.brightness = msg.brightness;
                            }
                        }
                        
                        // Check whether a 'colorSaturation' value is specified in the input message
                        if (msg.hasOwnProperty('colorSaturation') /*TODO CHECK VIA PROFILE RANGE  || msg.colorSaturation < -1.0 || msg.colorSaturation > 1.0*/) {
                            if (isNaN(msg.colorSaturation)) {
                                console.error('The msg.colorSaturation value should be a number between ?? and ??'); // TODO find boundaries in profile
                            }
                            else {
                                options.colorSaturation = msg.colorSaturation;
                            }
                        }
                        
                        // Check whether a 'contrast' value is specified in the input message
                        if (msg.hasOwnProperty('contrast') /*TODO CHECK VIA PROFILE RANGE  || msg.contrast < -1.0 || msg.contrast > 1.0*/) {
                            if (isNaN(msg.contrast)) {
                                console.error('The msg.contrast value should be a number between ?? and ??'); // TODO find boundaries in profile
                            }
                            else {
                                options.contrast = msg.contrast;
                            }
                        }
                        
                        // Check whether a 'sharpness' value is specified in the input message
                        if (msg.hasOwnProperty('sharpness') /*TODO CHECK VIA PROFILE RANGE  || msg.sharpness < -1.0 || msg.sharpness > 1.0*/) {
                            if (isNaN(msg.sharpness)) {
                                console.error('The msg.sharpness value should be a number between ?? and ??'); // TODO find boundaries in profile
                            }
                            else {
                                options.sharpness = msg.sharpness;
                            }
                        }
                        
                        if (Object.keys(options).length === 0) {
                            console.error('No image settings have been specified.'); 
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
    RED.nodes.registerType("onvif-imaging",OnVifImagingNode);
}
