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
    
    function setOnvifStatus(node, onvifStatus) {
        node.onvifStatus = onvifStatus;
        
        // Pass the new status to all the available listeners
        node.emit('onvif_status', onvifStatus);
    }

    function OnVifConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.xaddress = config.xaddress;
        this.name     = config.name; 
        // Remark: user name and password are stored in this.credentials

        var node = this;
        
        debugger;
        
        // Without an xaddress, it is impossible to connect to an Onvif device
        if (!this.xaddress) {
            this.cam = null;
            setOnvifStatus(node, "unconfigured");
            return;
        }
        
        setOnvifStatus(node, "initializing");
        
        var options = {};
        options.hostname = this.xaddress;
        
        if (this.credentials && this.credentials.user) {
            options.username = this.credentials.user;
            options.password = this.credentials.password;
        }

        // Create a new camera instance, which will automatically connect to the device (to load configuration data)
        this.cam = new onvif.Cam(options, function(err) { 
            if (err) {
                setOnvifStatus(node, "disconnected");
            }
            else {  
                setOnvifStatus(node, "connected"); 
            }
        });
        
        node.on('close', function(){
			setOnvifStatus(node, "");
            
            node.removeAllListeners("onvif_status");
		});
    }
    
    RED.nodes.registerType("onvif-config",OnVifConfigNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
    
        
    // Make all the available profiles accessible for the node's config screen
    RED.httpAdmin.get('/onvifdevice/:cmd/:id', RED.auth.needsPermission('onvifdevice.read'), function(req, res){
        var node = RED.nodes.getNode(req.params.id);

        if (req.params.cmd === "profiles") {
            if (!node || !node.deviceConfig || !node.deviceConfig.cam) {
                console.log("Cannot determine profile list from node " + req.params.id);
                return;
            }
            
            var profileNames = [];
            
            for(var i = 0; i < node.deviceConfig.cam.profiles.length; i++) {
                profileNames.push(
                    {
                        name: node.deviceConfig.cam.profiles[i].name,
                        token: node.deviceConfig.cam.profiles[i].$.token
                    });
            }
            
            // Return a list of all available profiles for the specified Onvif node
            res.json(profileNames);
        }
    });
}
