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
        this.action            = config.action;
        this.cam               = null;
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        this.deviceConfig = RED.nodes.getNode(config.deviceConfig);

        utils.initializeDevice(node, 'imaging');

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.cam) {
                console.warn('Ignoring input message since the device connection is not complete');
                return;
            }

            if (!node.cam.capabilities['imaging']) {
                console.warn('Ignoring input message since the device does not support the media service');
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
                    case 'getSettings':
                        node.cam.getImagingSettings(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;
                    case 'getServiceCapabilities':
                        node.cam.getImagingServiceCapabilities(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;
                    case "reconnect":
                        utils.initializeDevice(node, 'media');
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
    }
    RED.nodes.registerType("onvif-imaging",OnVifImagingNode);
}
