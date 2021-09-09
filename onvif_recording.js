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
    const utils = require('./utils');

    function OnVifRecordingNode(config) {
        RED.nodes.createNode(this, config);
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'recording_service', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'recording_service', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.deviceConfig || node.deviceConfig.onvifStatus != "connected") {
                node.error("This node is not connected to a device");
                return;
            }

            if (!utils.hasService(node.deviceConfig.cam, 'recording_service')) {
                node.error("The device does no support for a recording service");
                return;
            }

            newMsg.xaddr = this.deviceConfig.xaddress;
            
            // TODO deze function call geeft steeds "Error: Wrong ONVIF SOAP response"
            // Kan het zijn dat panasonic geen recording service heeft ???
            node.deviceConfig.cam.getRecordings(function(err, stream, xml) {
                utils.handleResult(node, err, stream, xml, newMsg);
            });
        });
        
        node.on("close",function() { 
            if (node.listener) {
                node.deviceConfig.removeListener("onvif_status", node.listener);
            }
        });
    }
    RED.nodes.registerType("onvif-recording",OnVifRecordingNode);
}
