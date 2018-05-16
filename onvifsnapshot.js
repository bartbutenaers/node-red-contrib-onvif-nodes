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

    function OnVifSnapshotNode(config) {
        RED.nodes.createNode(this, config);
        this.profile = config.profile;
        
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
                // Check whether an OnvifServiceMedia object is available
                var media = node.device.services.media;
                if (media) {
                    // Set the required profile to the device, to let it know which data we want to get
                    // Remark: the device needs to be initialized first, because the available profile list need to be loaded...
                    node.device.changeProfile(node.profile); 
                    node.status({fill:"green",shape:"dot",text:"connected"});
                }
                else {
                    console.error('The ONVIF device does not offer a media service.');
                    node.status({fill:"red",shape:"dot",text:"no media support"});
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
            if (!node.device || !node.device.getCurrentProfile()) {
                // Avoid errors during device.fetchSnapshot, by ensuring that the device has a profile.
                // This can be a temporary issue at flow startup, since the device initialization above can take some time...
                console.warn('Ignoring input message because the OnVif device has no current profile');
                return;
            }
            
            // Get a snapshot image
            node.device.fetchSnapshot().then((res) => {
                var newMsg = {};
                newMsg.headers = res.headers;
                newMsg.payload = res.body;
                node.send(newMsg);
            }).catch((error) => {
                console.error(error);
            });
        });
    }
    RED.nodes.registerType("onvifsnapshot",OnVifSnapshotNode);
}
