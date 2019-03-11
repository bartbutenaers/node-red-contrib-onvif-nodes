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
        
        this.getProfiles = function(clientConfig, response) {
            var profileNames = [];
            var config = {};
            
            // TODO checken of er altijd een this.credentials bestaat, indien username en paswoord niet ingevuld is.
            
            // The client credentials will only contain the data (i.e. user name or password) which has changed.
            // The other data is not changed, so we will need use the original data stored on the server.
            clientConfig.username = clientConfig.user || this.credentials.user;
            clientConfig.password = clientConfig.password || this.credentials.password;
                    
            // When the user appends some new text to the existing password, then the original password is passed via the client as __PWRD__
            // So replace __PWRD__ again by the original password.
            if (clientConfig.password && this.credentials.password) {
               clientConfig.password.replace('___PWRD__', this.credentials.password);
            }
     
            if (this.credentials.user !== clientConfig.user || this.credentials.password !== clientConfig.password || this.xaddress !== clientConfig.hostname){
                var cam = new onvif.Cam(clientConfig, function(err) {             
                    if (!err) {
                        if (cam.profiles) {
                            for(var i = 0; i < cam.profiles.length; i++) {
                                profileNames.push({
                                    label: cam.profiles[i].name,
                                    value: cam.profiles[i].$.token
                                });
                            }
                        }
                        
                        response.json(profileNames);
                    }
                });
            }
            else {
                if (this.cam.profiles) {
                    // The current deployed cam is still up-to-date, so let’s use that one (for performance reasons)
                    for(var i = 0; i < this.cam.profiles.length; i++) {
                        profileNames.push({
                            label: this.cam.profiles[i].name,
                            value: this.cam.profiles[i].$.token
                        });
                    }
                }
                
                response.json(profileNames);
            }
        }
        
        this.getProfileTokenByName = function(profileName) {
            if (this.cam.profiles) {
                // Try to find a profile with the specified name, and return the token
                for(var i = 0; i < this.cam.profiles.length; i++) {
                    if (this.cam.profiles[i].name === profileName) {
                        return this.cam.profiles[i].$.token;
                    }
                }
            }
            
            // No token found with the specified name
            return null;
        }
        
        // Without an xaddress, it is impossible to connect to an Onvif device
        if (!this.xaddress) {
            // Make sure the Catch-node can catch the error
            node.error( "Cannot connect to unconfigured Onvif device", {} );
                
            this.cam = null;
            setOnvifStatus(node, "unconfigured");
            return;
        }
        
        setOnvifStatus(node, "initializing");
        
        var options = {};
        options.hostname= this.xaddress;
        
        if (this.credentials && this.credentials.user) {
            options.username = this.credentials.user;
            options.password = this.credentials.password;
        }

        // Create a new camera instance, which will automatically connect to the device (to load configuration data)
        this.cam = new onvif.Cam(options, function(err) { 
            if (err) {
                // Make sure the Catch-node can catch the error
                node.error( err, {} );
                
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
    RED.httpAdmin.get('/onvifdevice/:cmd/:config_node_id', RED.auth.needsPermission('onvifdevice.read'), function(req, res){
        var configNode = RED.nodes.getNode(req.params.config_node_id);

        switch (req.params.cmd) {
            case "profiles":
                if (!configNode) {
                    console.log("Cannot determine profile list from node " + req.params.config_node_id);
                    return;
                }
               
                // Get the profiles of the camera, based on the config data on the client, instead of the config data
                // stored inside this config node.  Reason is that the config data on the client might be 'dirty', i.e. changed
                // by the user but not deployed yet on this config node.  But the client still needs to be able to get the profiles
                // corresponding to that dirty config node.  That way the config screen can be filled with profiles already...
                // But when the config data is not dirty, we will just use the profiles already loaded in this config node (which is faster).
                // See https://discourse.nodered.org/t/initializing-config-screen-based-on-new-config-node/7327/10?u=bartbutenaers
                configNode.getProfiles(req.query, res);
                
                break;
        }
    });
}
