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
        this.cam = null;
        this.snapshotUriMap = new Map();
        
        var node = this; 
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
    
        utils.initializeDevice(node, 'media');
        
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
                console.log(err)
            })
        }

        node.on("input", function(msg) {  
            var newMsg = {};
            
            if (!node.cam) {
                console.warn('Ignoring input message since the device connection is not complete');
                return;
            }

            if (!node.cam.capabilities['media']) {
                console.warn('Ignoring input message since the device does not support the media service');
                return;
            } 
       
            var action = node.action || msg.action;
            var protocol = node.protocol || msg.protocol;
            var stream = node.stream || msg.stream;
            var profileToken = node.profileToken || msg.profileToken;
            var profileName = node.profileName || msg.profileName;
            var videoEncoderConfigToken = node.videoEncoderConfigToken || msg.videoEncoderConfigToken;
            
            if (!action) {
                console.warn('When no action specified in the node, it should be specified in the msg.action');
                return;
            }
            
            // TODO check this only for actions where profileToken is needed
            // TODO when device disconnected, this gives "Cannot read property '$' of undefined" due to missing videosources...
            /*if (!profileToken) {
                if (!node.cam.getActiveSources()) {
                    console.warn('No default video source available');
                    return;
                }
            }*/
            
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

                        node.cam.getStreamUri(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                    case "getSnapshotUri":
                        // The profileToken is optional.  When not specified, the device will use the default profile token.
                        var options = {
                            'profileToken': profileToken
                        };

                        node.cam.getSnapshotUri(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                    case "getVideoEncoderConfiguration": 
                        // If the videoEncoderConfigToken doesn't exist, the first element from the videoEncoderConfigurations array will be returned
                        node.cam.getVideoEncoderConfiguration(videoEncoderConfigToken, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                       
                     case "getVideoEncoderConfigurations": 
                        node.cam.getVideoEncoderConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getVideoEncoderConfigurationOptions": 
                        // If the videoEncoderConfigToken doesn't exist, the first element from the videoEncoderConfigurations array will be used
                        node.cam.getVideoEncoderConfigurationOptions(videoEncoderConfigToken, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                        
                     case "getProfiles": 
                        node.cam.getProfiles(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                        
                     case "getVideoSources": 
                        node.cam.getVideoSources(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                       
                     case "getVideoSourceConfigurations": 
                        node.cam.getVideoSourceConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                   
                     case "getAudioSources": 
                        node.cam.getAudioSources(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;                
                     case "getAudioSourceConfigurations": 
                        node.cam.getAudioSourceConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break; 
                     case "getAudioEncoderConfigurations": 
                        node.cam.getAudioEncoderConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getAudioOutputs": 
                        node.cam.getAudioOutputs(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;    
                     case "getAudioOutputConfigurations":
                        node.cam.getAudioOutputConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        break;   
                    case "getOSDs": 
                        // If the videoEncoderConfigToken doesn't exist, all available OSD's will be requested
                        node.cam.getOSDs(videoEncoderConfigToken, function(err, stream, xml) {
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
                            var options = {
                                'profileToken': profileToken
                            };

                            node.cam.getSnapshotUri(options, function(err, stream, xml) {
                                // Cache the URL for the next time
                                node.snapshotUriMap.set(profileToken, stream.uri);
                                getSnapshot(stream.uri, newMsg);
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
                        node.cam.createProfile(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "deleteProfile":
                        node.cam.deleteProfile(profileToken, function(err, stream, xml) {
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
                        
                        node.cam.setVideoEncoderConfiguration(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });;

                        break; */
                    case "reconnect":
                        utils.initializeDevice(node, 'media');
                        break;
                    default:
                        //node.status({fill:"red",shape:"dot",text: "unsupported action"});
                        console.log("Action " + action + " is not supported");
                }
            }
            catch (exc) {
                console.log("Action " + action + " failed:");
                console.log(exc);
            }
        });
    }
    RED.nodes.registerType("onvif-media",OnVifMediaNode);
}
