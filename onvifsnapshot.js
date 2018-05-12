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
            // Set the required profile to the device, to let it know which data we want to get
            // Remark: the device needs to be initialized first, because the available profile list need to be loaded...
            node.device.changeProfile(parseFloat(config.profile));
        });
        
        node.on("input", function(msg) {
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
    RED.nodes.registerType("onvifsnapshot",OnVifSnapshotNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
}