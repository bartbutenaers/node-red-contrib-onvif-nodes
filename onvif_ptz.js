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
    const utils  = require('./utils');

    function OnVifPtzNode(config) {
        RED.nodes.createNode(this, config);
        this.panSpeed           = parseFloat(config.panSpeed);
        this.tiltSpeed          = parseFloat(config.tiltSpeed);
        this.zoomSpeed          = parseFloat(config.zoomSpeed);
        this.panPosition        = parseFloat(config.panPosition);
        this.tiltPosition       = parseFloat(config.tiltPosition);
        this.zoomPosition       = parseFloat(config.zoomPosition);
        this.panTranslation     = parseFloat(config.panTranslation);
        this.tiltTranslation    = parseFloat(config.tiltTranslation);
        this.zoomTranslation    = parseFloat(config.zoomTranslation);
        this.time               = parseInt(config.time);
        this.profileName        = config.profileName;
        this.action             = config.action;
        this.preset             = config.preset;
        this.presetName         = config.presetName;
        this.stopPanTilt        = config.stopPanTilt;
        this.stopZoom           = config.stopZoom
        this.configurationToken = config.configurationToken;
        
        var node = this;
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'ptz', onvifStatus);
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'ptz', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }

        node.on("input", function(msg) {
            var newMsg = {};
            
            var profileToken = msg.profileToken;
            var profileName = node.profileName || msg.profileName;

            var panSpeed           = node.panSpeed;
            var tiltSpeed          = node.tiltSpeed;
            var zoomSpeed          = node.zoomSpeed;
            var panPosition        = node.panPosition;
            var tiltPosition       = node.tiltPosition;
            var zoomPosition       = node.zoomPosition;
            var panTranslation     = node.panTranslation;
            var tiltTranslation    = node.tiltTranslation;
            var zoomTranslation    = node.zoomTranslation;
            var stopPanTilt        = node.stopPanTilt;
            var stopZoom           = node.stopZoom;
            var configurationToken = node.configurationToken;
            
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

                if (!utils.hasService(node.deviceConfig.cam, 'ptz')) {
                    node.error("The device has no support for a ptz service");
                    return;
                }
            }

            var preset = node.preset || msg.preset; 
            var presetName = node.presetName || msg.presetName;
            
            /*var currentProfile = node.device.getCurrentProfile();
            
            if (!currentProfile) {
                // Avoid errors during ptzMove, by ensuring that the device has a profile.
                // This can be a temporary issue at flow startup, since the device initialization above can take some time...
                console.warn('Ignoring input message because the OnVif device has no current profile');
                return;
            }*/
            
            // TODO check whether the node.token exists in the ONVIF device
            
            // Check whether a 'pan_speed' value is specified in the input message
            if (msg.hasOwnProperty('pan_speed') || msg.pan_speed < -1.0 || msg.pan_speed > 1.0) {
                if (isNaN(msg.pan_speed)) {
                    node.error('The msg.pan_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    panSpeed = msg.pan_speed;
                }
            }
            
            // Check whether a 'tilt_speed' value is specified in the input message
            if (msg.hasOwnProperty('tilt_speed') || msg.tilt_speed < -1.0 || msg.tilt_speed > 1.0) {
                if (isNaN(msg.tilt_speed)) {
                    node.error('The msg.tilt_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    tiltSpeed = msg.tilt_speed;
                }
            }
            
            // Check whether a 'zoom_speed' value is specified in the input message
            if (msg.hasOwnProperty('zoom_speed')) {
                if (isNaN(msg.zoom_speed) || msg.zoom_speed < -1.0 || msg.zoom_speed > 1.0) {
                    node.error('The msg.zoom_speed value should be a number between -1.0 and 1.0');
                }
                else {
                    zoomSpeed = msg.zoom_speed;
                }
            }
            
            // Check whether a 'pan_position' value is specified in the input message
            if (msg.hasOwnProperty('pan_position') /*TODO CHECK VIA PROFILE RANGE  || msg.pan_position < -1.0 || msg.pan_position > 1.0*/) {
                if (isNaN(msg.pan_position)) {
                    node.error('The msg.pan_position value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    panPosition = msg.pan_position;
                }
            }
            
            // Check whether a 'tilt_position' value is specified in the input message
            if (msg.hasOwnProperty('tilt_position') /*TODO CHECK VIA PROFILE RANGE  || msg.tilt_position < -1.0 || msg.tilt_position > 1.0*/) {
                if (isNaN(msg.tilt_position)) {
                    node.error('The msg.tilt_position value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    tiltPosition = msg.tilt_position;
                }
            }
            
            // Check whether a 'zoom_position' value is specified in the input message
            if (msg.hasOwnProperty('zoom_position') /*TODO CHECK VIA PROFILE RANGE  || msg.zoom_position < -1.0 || msg.zoom_position > 1.0*/) {
                if (isNaN(msg.zoom_position)) {
                    node.error('The msg.zoom_position value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    zoomPosition = msg.zoom_position;
                }
            }
            
            // Check whether a 'pan_translation' value is specified in the input message
            if (msg.hasOwnProperty('pan_translation') /*TODO CHECK VIA PROFILE RANGE  || msg.pan_translation < -1.0 || msg.pan_translation > 1.0*/) {
                if (isNaN(msg.pan_translation)) {
                    node.error('The msg.pan_translation value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    panTranslation = msg.pan_translation;
                }
            }
            
            // Check whether a 'tilt_translation' value is specified in the input message
            if (msg.hasOwnProperty('tilt_translation') /*TODO CHECK VIA PROFILE RANGE  || msg.tilt_translation < -1.0 || msg.tilt_translation > 1.0*/) {
                if (isNaN(msg.tilt_translation)) {
                    node.error('The msg.tilt_translation value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    tiltTranslation = msg.tilt_translation;
                }
            }
            
            // Check whether a 'zoom_translation' value is specified in the input message
            if (msg.hasOwnProperty('zoom_translation') /*TODO CHECK VIA PROFILE RANGE  || msg.zoom_translation < -1.0 || msg.zoom_translation > 1.0*/) {
                if (isNaN(msg.zoom_translation)) {
                    node.error('The msg.zoom_translation value should be a number between ?? and ??'); // TODO find boundaries in profile
                }
                else {
                    zoomTranslation = msg.zoom_translation;
                }
            }
            
            // Make sure the values are between -1.0 and 1.0
            panSpeed  = Math.min(Math.max(panSpeed, -1.0), 1.0);
            tiltSpeed = Math.min(Math.max(tiltSpeed, -1.0), 1.0);
            zoomSpeed = Math.min(Math.max(zoomSpeed, -1.0), 1.0);   

            // To make things easier for a user, we will let the user specify profile names.
            // The corresponding profile token (which is required in Onvif to work with profiles) will be searched here...
            if (!profileToken && profileName) {
                profileToken = node.deviceConfig.getProfileTokenByName(profileName);
            }            

            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;            
         
            try {
                switch (action) { 
                    case "continuousMove":
                        var options = {
                            'profileToken': profileToken,
                            'x': panSpeed,
                            'y': tiltSpeed,
                            'zoom': zoomSpeed,
                            'timeout': node.time 
                        };

                        // Move the camera with the specified speed(s) and during the specified time
                        node.deviceConfig.cam.continuousMove(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "absoluteMove":
                        // TODO The 'position' value range is specified in the profile
                        var options = {
                            'profileToken': profileToken,
                            'x': panPosition,
                            'y': tiltPosition,
                            'zoom': zoomPosition,
                            'speed': {
                                'x': panSpeed,
                                'y': tiltSpeed,
                                'zoom': zoomSpeed
                            }
                        };

                        // Move the camera with the specified speed(s) and during the specified time
                        node.deviceConfig.cam.absoluteMove(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "relativeMove":
                        var options = {
                            'profileToken': profileToken,
                            'x': panTranslation,
                            'y': tiltTranslation,
                            'zoom': zoomTranslation,
                            'speed': {
                                'x': panSpeed,
                                'y': tiltSpeed,
                                'zoom': zoomSpeed
                            }
                        };

                        // Move the camera with the specified speed(s) and during the specified time
                        node.deviceConfig.cam.relativeMove(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "gotoHomePosition":
                        var options = {
                            'profileToken': profileToken,
                            'speed': {
                                'x': panSpeed,
                                'y': tiltSpeed,
                                'zoom': zoomSpeed
                            }
                        };
                        
                        // Let the camera go to the home position.
                        // Make sure a home position is set in advance, otherwise you get a 'No HomePosition' error.
                        node.deviceConfig.cam.gotoHomePosition(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "setHomePosition":
                        var options = {
                            'profileToken': profileToken,
                        };
                        
                        // Set the CURRENT camera position as the home position
                        node.deviceConfig.cam.setHomePosition(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "getPresets":
                        var options = {
                            'profileToken': profileToken,
                        };
                        
                        node.deviceConfig.cam.getPresets(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
                    case "setPreset":
                        var options = {
                            'profileToken': profileToken
                        };
                        
                        // We will not ask the user to specify the preset token in the input message, to avoid that the preset tokens will
                        // need to be stored somewhere in the Node-Red flow.  Instead the user can specify a preset NAME, and we will lookup
                        // to which existing preset token this name corresponds...
                        node.deviceConfig.cam.getPresets(options, function(err, stream, xml) {
                            // Get the preset token of the specified preset name
                            var presetToken = stream[presetName];
                            
                            // When the preset token exists, we are dealing with an already existing preset.
                            // Then pass the preset token to the device, so it will UPDATE the existing preset.
                            // When the preset token is not passed to the device, the device will create a NEW preset (and a new preset token).
                            if (presetToken) {
                                options.presetToken = presetToken;
                            }

                            options.presetName = presetName;
 
                            // Create/update the preset, based on the preset token.  The device will save the current camera parameters
                            // (XY coordinates, zoom level and a focus adjustment) so that the device can move afterwards to that saved 
                            // preset position (via the GotoPreset action).
                            node.deviceConfig.cam.setPreset(options, function(err, stream, xml) {
                                // The response contains the PresetToken which uniquely identifies the Preset.
                                // The operation will fail when the PTZ device is moving during the SetPreset operation.
                                utils.handleResult(node, err, stream, xml, newMsg);
                            });
                        });
                        
                        break;                    
                    case "removePreset":
                        var options = {
                            'profileToken': profileToken
                        };
                        
                        // We will not ask the user to specify the preset token in the input message, to avoid that the preset tokens will
                        // need to be stored somewhere in the Node-Red flow.  Instead the user can specify a preset NAME, and we will lookup
                        // to which existing preset token this name corresponds...
                        node.deviceConfig.cam.getPresets(options, function(err, stream, xml) {
                            // Get the preset token of the specified preset name
                            var presetToken = stream[presetName];
                            
                            // When the preset token exists, we are dealing with an already existing preset.
                            // Then pass the preset token to the device, so it will UPDATE the existing preset.
                            // When the preset token is not passed to the device, the device will create a NEW preset (and a new preset token).
                            if (presetToken) {
                                options.presetToken = presetToken;
                            }

                            options.presetName = presetName;
 
                            // Create/update the preset, based on the preset token.  The device will save the current camera parameters
                            // (XY coordinates, zoom level and a focus adjustment) so that the device can move afterwards to that saved 
                            // preset position (via the GotoPreset action).
                            node.deviceConfig.cam.removePreset(options, function(err, stream, xml) {
                                utils.handleResult(node, err, stream, xml, newMsg);
                            });
                        });

                        break;                                   
                    case "gotoPreset":
                        var options = {
                            'profileToken': profileToken
                        };
                        
                        // We will not ask the user to specify the preset token in the input message, to avoid that the preset tokens will
                        // need to be stored somewhere in the Node-Red flow.  Instead the user can specify a preset NAME, and we will lookup
                        // to which existing preset token this name corresponds...
                        node.deviceConfig.cam.getPresets(options, function(err, stream, xml) {
                            // Get the preset token of the specified preset name
                            var preset = stream[presetName];
                            
                            // When the preset token doesn't exists, we cannot goto it ...
                            if (!preset) {
                                console.warn("Preset token with name " + presetName + " does not exist.");
                                return;
                            }
                            
                            options.preset = preset; 

                            // TODO enkel doorgeven indien gedefinieerd.
                            options.speed = {
                                x: panSpeed,
                                y: tiltSpeed,
                                z: zoomSpeed
                            };
 
                            // Create/update the preset, based on the preset token.  The device will save the current camera parameters
                            // (XY coordinates, zoom level and a focus adjustment) so that the device can move afterwards to that saved 
                            // preset position (via the GotoPreset action).
                            node.deviceConfig.cam.gotoPreset(options, function(err, stream, xml) {
                                utils.handleResult(node, err, stream, xml, newMsg);
                            });
                        });
                        
                        break;                                             
                    case "getNodes":
                        node.deviceConfig.cam.getNodes(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;    
                    case "getConfigurations":
                        node.deviceConfig.cam.getConfigurations(function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;      
                    case "getConfigurationOptions":
                        configurationToken = 'PtzConf1'; // TODO make adjustable (is reeds voorzien op config screen, maar nog niet via input message)

                        // getConfigurationOptions will result in an uncaught exception when getConfigurations hasn't been called in advance...
                        if (!node.deviceConfig.cam.configurations) {
                            node.deviceConfig.cam.getConfigurations(function(err, stream, xml) {
                                node.deviceConfig.cam.getConfigurationOptions(configurationToken, function(err, stream, xml) {
                                    utils.handleResult(node, err, stream, xml, newMsg);
                                });
                            });
                        }
                        else {
                            node.deviceConfig.cam.getConfigurationOptions(configurationToken, function(err, stream, xml) {
                                utils.handleResult(node, err, stream, xml, newMsg);
                            });
                        }
                                            
                        break;        
                    case "getStatus":
                        // TODO error in onvif library due to missing zoom in Panasonic cam (see https://github.com/agsh/onvif/issues/103)

                        var options = {
                            'profileToken': profileToken,
                        };
                        
                        node.deviceConfig.cam.getStatus(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break; 
                    case "stop":
                        var options = {
                            'profileToken': profileToken,
                            'panTilt': node.stopPanTilt,
                            'zoom': node.stopZoom
                        };
                        
                        node.deviceConfig.cam.stop(options, function(err, stream, xml) {
                            utils.handleResult(node, err, stream, xml, newMsg);
                        });
                        
                        break;
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
    RED.nodes.registerType("onvif-ptz",OnVifPtzNode);
}
