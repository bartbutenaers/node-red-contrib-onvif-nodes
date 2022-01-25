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
    const url    = require('url');
    const https  = require('http');
    const utils  = require('./utils');

    function OnVifMediaNode(config) {
        RED.nodes.createNode(this, config);
        this.action  = config.action;
        this.profileToken = config.profileToken;
        this.profileName = config.profileName;
        this.videoEncoderConfigToken = config.videoEncoderConfigToken;
        this.protocol = config.protocol;
        this.stream = config.stream;
        this.snapshotUriMap = new Map();
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'media', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'media', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }
        
        function getSnapshot(uri, newMsg) {
            require('request').get(uri, {
              'auth': {
                'user': node.deviceConfig.credentials.user,
                'pass': node.deviceConfig.credentials.password,
                'sendImmediately': false
              }
            }).on('response', function(response) {
                if(response.statusCode === 200) {
                    // Concatenate all the data chunks, to get a complete image (as a Buffer)
                    newMsg.payload = response.body;
                        
                    newMsg.contentType = response.headers['content-type'];
                    if(!newMsg.contentType) { 
                        newMsg.contentType = 'image/jpeg';
                    }
                    
                    // Remember all body chunks and concatenate them into a single buffer when entire image received
                    var bodyChunks = [];
                    response.on("data", function (chunk) {
                        bodyChunks.push(chunk);
                    });
                    response.on("end", function () {
                        newMsg.payload = Buffer.concat(bodyChunks);
                        node.send(newMsg);
                    });
                }
                else {
                    console.log(response.statusCode + ' ' + response.statusMessage);
                }
            }).on('error', function(err) {
                console.error(err.message)
            })
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            var action = node.action || msg.action;

            if (!action) {
                // When no action specified in the node, it should be specified in the msg.action
                node.error("No action specified (in node or msg)");
                return;
            }
            
            // Don't perform these checks when e.g. the device is currently disconnected (because then e.g. no capabilities are loaded yet)
            if (action !== "reconnect") {
                if (!node.deviceConfig || node.deviceConfig.onvifStatus != "connected") {
                    node.error("This node is not connected to a device");
                    return;
                }

                if (!utils.hasService(node.deviceConfig.cam, 'media')) {
                    node.error("The device has no support for a media service");
                    return;
                }
            }
       
            var protocol = node.protocol || msg.protocol;
            var stream = node.stream || msg.stream;
            var profileToken = node.profileToken || msg.profileToken;
            var profileName = node.profileName || msg.profileName;
            var videoEncoderConfigToken = node.videoEncoderConfigToken || msg.videoEncoderConfigToken;
            
            // TODO check this only for actions where profileToken is needed
            // TODO when device disconnected, this gives "Cannot read property '$' of undefined" due to missing videosources...
            /*if (!profileToken) {
                if (!node.deviceConfig.cam.getActiveSources()) {
                    console.warn('No default video source available');
                    return;
                }
            }*/
            
            // To make things easier for a user, we will let the user specify profile names.
            // The corresponding profile token (which is required in Onvif to work with profiles) will be searched here...
            if (!profileToken && profileName) {
                profileToken = node.deviceConfig.getProfileTokenByName(profileName);
            }
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;
   
            try {
                switch (action) {
                     case "getStreamUri":
                        // All these 3 fields are optional.  If not specified, the device will use the defaults.
                        var options = {
                            'stream': stream,
                            'profileToken': profileToken,
                            'protocol': protocol
                        };

                        node.deviceConfig.cam.getStreamUri(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                    case "getSnapshotUri":
                        // The profileToken is optional.  When not specified, the device will use the default profile token.
                        var options = {
                            'profileToken': profileToken
                        };

                        node.deviceConfig.cam.getSnapshotUri(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                    case "getVideoEncoderConfiguration": 
                        // If the videoEncoderConfigToken doesn't exist, the first element from the videoEncoderConfigurations array will be returned
                        node.deviceConfig.cam.getVideoEncoderConfiguration(videoEncoderConfigToken, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                       
                     case "getVideoEncoderConfigurations": 
                        node.deviceConfig.cam.getVideoEncoderConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getVideoEncoderConfigurationOptions": 
                        // If the videoEncoderConfigToken doesn't exist, the first element from the videoEncoderConfigurations array will be used
                        node.deviceConfig.cam.getVideoEncoderConfigurationOptions(videoEncoderConfigToken, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                        
                     case "getProfiles": 
                        node.deviceConfig.cam.getProfiles(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                        
                     case "getVideoSources": 
                        node.deviceConfig.cam.getVideoSources(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                       
                     case "getVideoSourceConfigurations": 
                        node.deviceConfig.cam.getVideoSourceConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                   
                     case "getAudioSources": 
                        node.deviceConfig.cam.getAudioSources(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                
                     case "getAudioSourceConfigurations": 
                        node.deviceConfig.cam.getAudioSourceConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                     case "getAudioEncoderConfigurations": 
                        node.deviceConfig.cam.getAudioEncoderConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getAudioOutputs": 
                        node.deviceConfig.cam.getAudioOutputs(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getAudioOutputConfigurations":
                        node.deviceConfig.cam.getAudioOutputConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;   
                    case "getOSDs": 
                        // If the videoEncoderConfigToken doesn't exist, all available OSD's will be requested
                        node.deviceConfig.cam.getOSDs(videoEncoderConfigToken, function(err, stream, xml) {
                            // Onvif OSD implementation is optional and most manufactures did not implement it.
                            // This means we will arrive here often ... 
                            // Most camera's will offer another REST interface to check and configure OSD texts, but not based on OnVif.
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                    case "getSnapshot":
                        var snapshotUri = node.snapshotUriMap.get(profileToken);

                        // Get the uri once (and cache it), when it hasn't been retrieved yet
                        if (!snapshotUri) {
                            // When no token is specified, the camera will use the default token
                            var options = {
                                'profileToken': profileToken
                            };

                            node.deviceConfig.cam.getSnapshotUri(options, function(err, stream, xml) {
                                utils.handleResult(node, err, stream, xml, newMsg);
                                
                                if (!err) {
                                    // Cache the URL for the next time
                                    node.snapshotUriMap.set(profileToken, stream.uri);
                                    getSnapshot(stream.uri, newMsg);
                                }
                            });
                        }
                        else {
                            getSnapshot(snapshotUri, newMsg);
                        }
                         
                        break; 
                    case "createProfile":
                        // The profile name is optional
                        var options = {
                            'name': profileName,
                            'profileToken': profileToken // TODO This is not being used (the device generates a new token) ...
                        };
                        
                        // Create an empty new deletable media profile
                        node.deviceConfig.cam.createProfile(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "deleteProfile":
                        node.deviceConfig.cam.deleteProfile(profileToken, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });

                        break;
                        /* TODO
                    case "setVideoEncoderConfiguration":
                        var options = {
                            'token': node.videoEncoderConfigToken,
                            'name': node.videoEncoderConfigName,
                            //'useCount': ???,
                            'encoding': node.videoEncoderConfigEncoding, //JPEG | H264 | MPEG4
                            'resolution': {
                                'width': node.videoEncoderConfigWidth,
                                'height': node.videoEncoderConfigHeight,
                            },
                            //'quality': ?????,
                            'rateControl': {
                                'frameRateLimit': node.videoEncoderConfigFrameRateLimit,
                                'encodingInterval': node.videoEncoderConfigEncodingInterval,
                                'bitrateLimit': node.videoEncoderConfigBitrateLimit
                            },
                            'MPEG4': {
                                'govLength': node.videoEncoderConfigMpeg4GovLength,
                                'profile': node.videoEncoderConfigMpeg4Profile // SP | ASP
                            },
                            'H264': {
                                'govLength': node.videoEncoderConfigH264GovLength,
                                'profile': node.videoEncoderConfigH264Profile // Baseline | Main | Extended | High
                            },   
                            'multicast': {
                                'address': node.videoEncoderConfigMulticastAddress,
                                'type': node.videoEncoderConfigMulticastType, // IPv4 | IPv6
                                'IPv4Address': node.videoEncoderConfigMulticastIpv4Address,
                                'IPv6Address': node.videoEncoderConfigMulticastIpv6Address,
                                'port': node.videoEncoderConfigMulticastPort,
                                'TTL': node.videoEncoderConfigMulticastTtl,  
                                'autoStart': node.videoEncoderConfigMulticastAutoStart,                              
                            },  
                            'sessionTimeout': node.videoEncoderConfigName
                        };
                        
                        node.deviceConfig.cam.setVideoEncoderConfiguration(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });;

                        break; */
                    case "reconnect":
                        node.deviceConfig.cam.connect();
                        break;
                    default:
                        //node.status({fill:"red",shape:"dot",text: "unsupported action"});
                        node.error("Action " + action + " is not supported");
                }
            }
            catch (exc) {
                node.error("Action " + action + " failed: " + exc);
            }
        });
        
        node.on("close",function() { 
            if (node.listener) {
                node.deviceConfig.removeListener("onvif_status", node.listener);
            }
        });
    }
    RED.nodes.registerType("onvif-media",OnVifMediaNode);
}
