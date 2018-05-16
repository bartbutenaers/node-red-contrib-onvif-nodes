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
        this.panSpeed   = parseFloat(config.panSpeed);
        this.tiltSpeed  = parseFloat(config.tiltSpeed);
        this.zoomSpeed  = parseFloat(config.zoomSpeed);
        this.time       = parseInt(config.time);
        this.profile    = config.profile;
        this.continuous = config.continuous;
        
        var node = this;
        
        // Retrieve the config node, where the device is configured
        this.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        // Create an OnvifDevice object, if a device configuration has been specified
        if (this.deviceConfig) {
            node.status({fill:"yellow",shape:"dot",text:"initializing"});
            
            if (this.deviceConfig.credentials && this.deviceConfig.credentials.user) {
                this.device = new onvif.OnvifDevice({
                    xaddr: this.deviceConfig.xaddress,
                    user : this.deviceConfig.credentials.user,
                    pass : this.deviceConfig.credentials.password
                });
            }
            else {
                this.device = new onvif.OnvifDevice({
                    xaddr: this.deviceConfig.xaddress
                });
            }
         
            // Initialize the OnvifDevice object
            node.device.init().then(() => {
                // Check whether an OnvifServicePtz object is available
                var ptz = node.device.services.ptz;
                if (ptz) {
                    // Set the required profile to the device, to let it know which data we want to get
                    // Remark: the device needs to be initialized first, because the available profile list need to be loaded...
                    node.device.changeProfile(node.profile); 
                    node.status({fill:"green",shape:"dot",text:"connected"});
                }
                else {
                    console.error('The ONVIF device does not offer a PTZ service.');
                    node.status({fill:"red",shape:"dot",text:"no PTZ support"});
                }
            }).catch((error) => {
                console.error(error);
                node.status({fill:"red",shape:"ring",text:"not connected"});
            });
        }
        else {
            node.status({fill:"red",shape:"ring",text:"no device"});
        }
                
        node.on("input", function(msg) {
            var panSpeed  = node.panSpeed;
            var tiltSpeed = node.tiltSpeed;
            var zoomSpeed = node.zoomSpeed;
            
            if (!node.device.getCurrentProfile()) {
                // Avoid errors during ptzMove, by ensuring that the device has a profile.
                // This can be a temporary issue at flow startup, since the device initialization above can take some time...
                console.warn('Ignoring input message because the OnVif device has no current profile');
                return;
            }
            
            // Check whether the current PTZ movement should be interrupted
            if (msg.hasOwnProperty('stop') || msg.stop === true) {
                node.device.ptzStop().catch((error) => {
                    console.error(error);
                });
                return;
            }
            
            // Check whether a 'pan_speed' value is specified in the input message
            if (msg.hasOwnProperty('pan_speed') || msg.pan_speed < -1.0 || msg.pan_speed > 1.0) {
                if (isNaN(msg.pan_speed)) {
                    console.error('The msg.pan_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    panSpeed = msg.pan_speed;
                }
            }
            
            // Check whether a 'tilt_speed' value is specified in the input message
            if (msg.hasOwnProperty('tilt_speed') || msg.tilt_speed < -1.0 || msg.tilt_speed > 1.0) {
                if (isNaN(msg.tilt_speed)) {
                    console.error('The msg.tilt_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    tiltSpeed = msg.tilt_speed;
                }
            }
            
            // Check whether a 'zoom_speed' value is specified in the input message
            if (msg.hasOwnProperty('zoom_speed')) {
                if (isNaN(msg.zoom_speed) || msg.zoom_speed < -1.0 || msg.zoom_speed > 1.0) {
                    console.error('The msg.zoom_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    zoomSpeed = msg.zoom_speed;
                }
            }
            
            // Make sure the values are between -1.0 and 1.0
            panSpeed  = Math.min(Math.max(panSpeed, -1.0), 1.0);
            tiltSpeed = Math.min(Math.max(tiltSpeed, -1.0), 1.0);
            zoomSpeed = Math.min(Math.max(zoomSpeed, -1.0), 1.0);       
         
            if (node.continuous) {
                var params = {
                    'ProfileToken': node.profile,
                    'Velocity': {
                        x: panSpeed,
                        y: tiltSpeed,
                        z: zoomSpeed
                    },
                    'Timeout': node.time 
                };

                // Move the camera continuously 
                node.device.services.ptz.continuousMove(params).catch((error) => {
                    console.error(error);
                });
            }
            else {
                var params = {
                    'speed': {
                        x: panSpeed,
                        y: tiltSpeed,
                        z: zoomSpeed
                    },
                    'timeout': node.time
                };
                
                // Move the camera once with the specified speed(s) and during the specified time
                node.device.ptzMove(params).catch((error) => {
                    console.error(error);
                });
            }
        });
    }
    RED.nodes.registerType("onvifptz",OnVifPtzNode);
}
 
