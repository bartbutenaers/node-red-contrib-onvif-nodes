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

    function OnVifMediaNode(config) {
        RED.nodes.createNode(this, config);
        this.action  = config.action;
        
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
            this.device.init().then(() => {
                node.status({fill:"green",shape:"dot",text:"connected"});
            }).catch((error) => {
                console.error(error);
                node.status({fill:"red",shape:"ring",text:"not connected"});
            });
        }
        else {
            node.status({fill:"red",shape:"ring",text:"no device"});
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.device || !node.device.getCurrentProfile()) {
                // Avoid errors during device.getXXXX, by ensuring that the device has a profile.
                // This can be a temporary issue at flow startup, since the device initialization above can take some time...
                console.warn('Ignoring input message because the OnVif device has no current profile');
                return;
            }
// TODO testen of er een media service is, net zoals bij de PTZ            
            var action = node.action || msg.action;
            
            if (!action) {
                console.warn('When no action specified in the node, it should be specified in the msg.action');
                return;
            }
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;
   
            switch (action) {
                // TODO op de eerste 3 cases een token instellen
                 case "getUdpStreamUri":
                    var params = {
                        'ProfileToken': '2_def_profile6',
                        'Protocol': 'UDP',
                    };

                    node.device.services.media.getStreamUri(params).then((result) => {
                        newMsg.payload = result.data.GetStreamUriResponse.MediaUri;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break; 
                 case "getHttpStreamUri":
                    var params = {
                        'ProfileToken': '2_def_profile6',
                        'Protocol': 'HTTP',
                    };

                    node.device.services.media.getStreamUri(params).then((result) => {
                        newMsg.payload = result.data.GetStreamUriResponse.MediaUri;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break; 
                 case "getRtspStreamUri":
                    var params = {
                        'ProfileToken': '2_def_profile6',
                        'Protocol': 'RTSP',
                    };

                    node.device.services.media.getStreamUri(params).then((result) => {
                        newMsg.payload = result.data.GetStreamUriResponse.MediaUri;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;          
                 case "getVideoEncoderConfigurations":
                    node.device.services.media.getVideoEncoderConfigurations().then((result) => {
                        newMsg.payload = result.data.GetVideoEncoderConfigurationsResponse.Configurations;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;    
                 case "getProfiles":
                    node.device.services.media.getProfiles().then((result) => {
                        newMsg.payload = result.data.GetProfilesResponse.Profiles;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                        
                 case "getVideoSources":
                    node.device.services.media.getVideoSources().then((result) => {
                        newMsg.payload = result.data.GetVideoSourcesResponse.VideoSources;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                       
                 case "getVideoSourceConfigurations":
                    node.device.services.media.getVideoSourceConfigurations().then((result) => {
                        newMsg.payload = result.data.GetVideoSourceConfigurationsResponse.Configurations;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                   
                 case "getMetadataConfigurations":
                    node.device.services.media.getMetadataConfigurations().then((result) => {
                        newMsg.payload = result.data.GetMetadataConfigurationsResponse.Configurations;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break; 
                 case "getAudioSources":
                    node.device.services.media.getAudioSources().then((result) => {
                        newMsg.payload = result.data.GetAudioSourcesResponse.AudioSources;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                
                 case "getAudioSourceConfigurations":
                    node.device.services.media.getAudioSourceConfigurations().then((result) => {
                        newMsg.payload = result.data.GetAudioSourceConfigurationsResponse.Configurations;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break; 
                 case "getAudioEncoderConfigurations":
                    node.device.services.media.getAudioEncoderConfigurations().then((result) => {
                        newMsg.payload = result.data.GetAudioEncoderConfigurationsResponse.Configurations;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;               
               
            }
           
        });
    }
    RED.nodes.registerType("onvifmedia",OnVifMediaNode);
}