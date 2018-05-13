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

    function OnVifDeviceNode(config) {
        RED.nodes.createNode(this, config);
        this.hardware  = config.hardware;
        this.profiles  = config.profiles;
        this.streamurl = config.streamurl;
        
        var node = this;
        
        // Retrieve the config node, where the device is configured
        this.deviceConfig = RED.nodes.getNode(config.deviceConfig);

        // Create an OnvifDevice object, if a device configuration has been specified
        if (this.deviceConfig) {
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
            this.device.init().then((info) => {
                // Store the hardware information for later on
                node.hardware = info;
            }).catch((error) => {
                console.error(error);
            });
        }

        node.on("input", function(msg) {
            var newMsg = {};
            newMsg.payload = {};
            
            if (!node.device || !node.device.getCurrentProfile()) {
                // Avoid errors during device.getXXXX, by ensuring that the device has a profile.
                // This can be a temporary issue at flow startup, since the device initialization above can take some time...
                console.warn('Ignoring input message because the OnVif device has no current profile');
                return;
            }
            
            newMsg.payload.xaddr = this.deviceConfig.xaddress;
            
            if (node.hardware) {
                newMsg.payload.hardware = node.hardware;
            }

            if (node.streamurl) {
                newMsg.payload.streamurl = node.device.getUdpStreamUrl();
            }
            
            if (node.profiles) {
                // Get all profiles setup in the device
                newMsg.payload.profiles = node.device.getProfileList();
            }
            
            node.send(newMsg);
        });
    }
    RED.nodes.registerType("onvifdevice",OnVifDeviceNode);
}
