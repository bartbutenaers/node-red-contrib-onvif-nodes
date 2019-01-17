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

    function OnVifRecordingNode(config) {
        RED.nodes.createNode(this, config);
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        this.deviceConfig = RED.nodes.getNode(config.deviceConfig);

        // Create an OnvifDevice object, if a device configuration has been specified
        if (this.deviceConfig) {
            node.status({fill:"yellow",shape:"dot",text:"initializing"});
            
            if (this.deviceConfig.credentials && this.deviceConfig.credentials.user) {
                var options = {
                    hostname: this.deviceConfig.xaddress,
                    username: this.deviceConfig.credentials.user,
                    password: this.deviceConfig.credentials.password
                };
            }
            else {
                var options = {
                    hostname: this.deviceConfig.xaddress
                };
            }
            
            // Create a new camera instance.
            // It tries to connect automatically to the device, and load a lot of data.
            new onvif.Cam(options, function(err) { 
                if (err) {
                    console.error(err);
                    node.status({fill:"red",shape:"ring",text:"not connected"});
                }
                else {
                    node.status({fill:"green",shape:"dot",text:"connected"});
                    // As soon as the device has been setup, we will keep a reference to it
                    node.cam = this;
                }
            });
        }
        else {
            node.status({fill:"red",shape:"ring",text:"no device"});
        }
        
        function handleResult(err, stream, xml, newMsg) {
            if (err) {
                var lowercase = err.message.toLowerCase();
            
                console.log(err);
                
                // Sometimes the OnVif device responds with errors like "Method Not Found", "Action Not Implemented", ... 
                // In that case we will show an error indicating that the action is not supported by the device.
                //if (lowercase.includes("not found") || lowercase.includes("not implemented")) {
                //    node.status({fill:"red",shape:"dot",text: "unsupported action"});
                //}
                //else {
                //    node.status({fill:"red",shape:"dot",text: "failed"});
                //}
            }
            else {
                newMsg.payload = stream;
                node.send(newMsg);
            }
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.cam) {
                console.warn('Ignoring input message since the device connection is not complete');
                return;
            }
// TODO testen of er een recording service is, net zoals bij de PTZ     
       
            //node.status({});

            newMsg.xaddr = this.deviceConfig.xaddress;
            
            // TODO deze function call geeft steeds "Error: Wrong ONVIF SOAP response"
            // Kan het zijn dat panasonic geen recording service heeft ???
            node.cam.getRecordings(function(err, stream, xml) {
                handleResult(err, stream, xml, newMsg);
            });
        });
    }
    RED.nodes.registerType("onvif-recording",OnVifRecordingNode);
}
