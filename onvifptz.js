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

    function OnVifPtzNode(config) {
        RED.nodes.createNode(this, config);
        this.pan  = parseFloat(config.pan);
        this.tilt = parseFloat(config.tilt);
        this.zoom = parseFloat(config.zoom);
        this.time = config.time;
        
        // Create an OnvifDevice object
        if (this.credentials && this.credentials.user) {
            this.device = new onvif.OnvifDevice({
                xaddr: config.xaddress,
                user : this.credentials.user,
                pass : this.credentials.password
            });
        }
        else {
            this.device = new onvif.OnvifDevice({
                xaddr: config.xaddress
            });
        }
        
        var node = this;

        // Initialize the OnvifDevice object
        node.device.init().then(() => {
            // Set the required profile to the device, to let it know which data we want to get.
            // Remark: the device needs to be initialized first, because the available profile list need to be loaded...
            node.device.changeProfile(parseFloat(config.profile));
        });
                
        node.on("input", function(msg) {
            var pan  = node.pan;
            var tilt = node.tilt;
            var zoom = node.zoom;
            
            // Check whether a 'pan' value is specified in the input message
            if (msg.hasOwnProperty('pan') || msg.pan < -1.0 || msg.pan > 1.0) {
                if (isNaN(msg.pan)) {
                    console.error('The msg.pan value should be a number between -1.0 and 1.0');
                }
                else {
                    pan = msg.pan;
                }
            }
            
            // Check whether a 'tilt' value is specified in the input message
            if (msg.hasOwnProperty('tilt') || msg.tilt < -1.0 || msg.tilt > 1.0) {
                if (isNaN(msg.tilt)) {
                    console.error('The msg.tilt value should be a number between -1.0 and 1.0');
                }
                else {
                    tilt = msg.tilt;
                }
            }
            
            // Check whether a 'zoom' value is specified in the input message
            if (msg.hasOwnProperty('zoom')) {
                if (isNaN(msg.zoom) || msg.zoom < -1.0 || msg.zoom > 1.0) {
                    console.error('The msg.zoom value should be a number between -1.0 and 1.0');
                }
                else {
                    zoom = msg.zoom;
                }
            }
            
            // Make sure the values are between -1.0 and 1.0
            pan  = Math.min(Math.max(pan, -1.0), 1.0);
            tilt = Math.min(Math.max(tilt, -1.0), 1.0);
            zoom = Math.min(Math.max(zoom, -1.0), 1.0);
                        
            var params = {
                'speed': {
                    x: pan,
                    y: tilt,
                    z: zoom
                },
                'timeout': node.time
            };
            
            // Move the camera according to the requested parameters
            node.device.ptzMove(params).catch((error) => {
                console.error(error);
            });
        });
    }
    RED.nodes.registerType("onvifptz",OnVifPtzNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
}