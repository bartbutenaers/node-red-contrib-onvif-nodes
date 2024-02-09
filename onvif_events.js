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
    const onvif = require('onvif');
    const utils = require('./utils');
    
    function OnVifEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.action = config.action;

        var node = this;
        
        // Retrieve the config node, where the device is configured
        node.deviceConfig = RED.nodes.getNode(config.deviceConfig);
        
        if (node.deviceConfig) {
            node.listener = function(onvifStatus) {
                utils.setNodeStatus(node, 'event', onvifStatus);
                
                if (onvifStatus !== "connected" && node.eventListener) {
                    // When the device isn't connected anymore, stop listening to events from the camera
                    node.deviceConfig.cam.removeListener('events', node.eventListener);
                    node.eventListener = null;
                }
            }
            
            // Start listening for Onvif config nodes status changes
            node.deviceConfig.addListener("onvif_status", node.listener);
            
            // Show the current Onvif config node status already
            utils.setNodeStatus(node, 'event', node.deviceConfig.onvifStatus);
            
            node.deviceConfig.initialize();
        }
               
        node.on("input", function(msg) {  
            var newMsg = {};
            
            // Note: the node's config screen has no 'action' input field yet ...
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

                if (!utils.hasService(node.deviceConfig.cam, 'event')) {
                    node.error("The device has no support for an event service");
                    return;
                }
            }
            
            // Seems that some Axis cams support pull point, although they return WSPullPointSupport 'false'
            /*if (!node.deviceConfig.cam.capabilities.events.WSPullPointSupport == true) {
                //console.warn('Ignoring input message since the device does not support pull point subscription');
                return;
            }*/
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;

            try {
                switch (action) {
                    case "start":
                        if (node.eventListener) {
                            node.error("This node is already listening to device events");
                            return;
                        }
                        
                        // Overwrite the device status text
                        node.status({fill:"green",shape:"dot",text:"listening"}); 
                        
                        node.eventListener = function(camMessage) {
                            var sourceName  = null;
                            var sourceValue = null;
                            var dataName    = null;
                            var dataValue   = null;
                            
                            // Events have a Topic
                            // Events have (optionally) a Source, a Key and Data fields
                            // The Source,Key and Data fields can be single items or an array of items
                            // The Source,Key and Data fields can be of type SimpleItem or a Complex Item
                            //    - Topic
                            //    - Message/Message/$
                            //    - Message/Message/Source...
                            //    - Message/Message/Key...
                            //    - Message/Message/Data/SimpleItem/[index]/$/name   (array of items)
                            // OR - Message/Message/Data/SimpleItem/$/name   (single item)
                            //    - Message/Message/Data/SimpleItem/[index]/$/value   (array of items)
                            // OR - Message/Message/Data/SimpleItem/$/value   (single item)

                            var eventTopic = camMessage.topic._;
                            
                            // Strip the namespaces from the topic (e.g. tns1:MediaControl/tnsavg:ConfigurationUpdateAudioEncCfg)
                            // Split on '/', then remove any namespace for each part, and at the end recombine parts that were split with '/'
                            let parts = eventTopic.split('/');
                            eventTopic = "";
                            for (var index = 0; index < parts.length; index++) {
                                var stringNoNamespace = parts[index].split(':').pop();
                                if (eventTopic.length == 0) {
                                    eventTopic += stringNoNamespace;
                                } else {
                                    eventTopic += '/' + stringNoNamespace;
                                }
                            }

                            var outputMsg = {
                                topic: eventTopic,
                                time: camMessage.message.message.$.UtcTime,
                                property: camMessage.message.message.$.PropertyOperation // Initialized, Deleted or Changed but missing/undefined on the Avigilon 4 channel encoder
                            };

                            // Only handle simpleItem
                            // Only handle one 'source' item
                            // Ignore the 'key' item  (nothing I own produces it)
                            // Handle all the 'Data' items

                            // SOURCE (Name:Value)
                            if (camMessage.message.message.source && camMessage.message.message.source.simpleItem) {
                                if (Array.isArray(camMessage.message.message.source.simpleItem)) {
                                    // TODO : currently we only process the first event source item ...
                                    outputMsg.source = {
                                        name:  camMessage.message.message.source.simpleItem[0].$.Name,
                                        value: camMessage.message.message.source.simpleItem[0].$.Value
                                    }
                                }
                                else {
                                    outputMsg.source = {
                                        name: camMessage.message.message.source.simpleItem.$.Name,
                                        value: camMessage.message.message.source.simpleItem.$.Value
                                    }
                                }
                            }
                            
                            //KEY
                            if (camMessage.message.message.key) {
                                outputMsg.key = camMessage.message.message.key;
                            }

                            // DATA (Name:Value)
                            if (camMessage.message.message.data && camMessage.message.message.data.simpleItem) {
                                if (Array.isArray(camMessage.message.message.data.simpleItem)) {
                                    outputMsg.data = [];
                                    for (var x  = 0; x < camMessage.message.message.data.simpleItem.length; x++) {
                                        outputMsg.data.push = {
                                            name: camMessage.message.message.data.simpleItem[x].$.Name,
                                            value: camMessage.message.message.data.simpleItem[x].$.Value
                                        }
                                    }
                                }
                                else {
                                    outputMsg.data = {
                                        name: camMessage.message.message.data.simpleItem.$.Name,
                                        value: camMessage.message.message.data.simpleItem.$.Value
                                    }
                                }
                            }
                            else if (camMessage.message.message.data && camMessage.message.message.data.elementItem) {
                                outputMsg.data = {
                                    dataName: 'elementItem',
                                    dataValue: JSON.stringify(camMessage.message.message.data.elementItem)
                                }
                            }

                            // As soon as we get an event from the camera, we will send it to the output of this node
                            node.send(outputMsg);
                        }
                        
                        // Start listening to events from the camera
                        node.deviceConfig.cam.on('event', node.eventListener);
                        break;
                    case "stop":
                        if (!node.eventListener) {
                            node.error("This node was not listening to events anyway");
                            return;
                        }

                        // Stop listening to events from the camera
                        node.deviceConfig.cam.removeListener('event', node.eventListener);
                        node.eventListener = null;
                        
                        // Overwrite the device status text
                        node.status({fill:"green",shape:"ring",text:"not listening"}); 
                        break;               
                    case "getEventProperties":
                        node.deviceConfig.cam.getEventProperties(function(err, date, xml) {
                            if (!err) {
                                var simplifiedDate = {};
                                
                                // Simplify the soap message to a compact message, by keeping only all relevant information
                                function simplifyNode(node, simplifiedDateChild) {
                                    // loop over all the child nodes in this node
                                    for (const child in node) {
                                        switch (child) {
                                            case "$":
                                                // Continue to the next child in the list (same level)
                                                continue;
                                            case "messageDescription":
                                                // Collect the details that belong to the event
                                                var source = '';
                                                var date = '';
                                                
                                                if (node[child].source && node[child].source.simpleItemDescription) {
                                                    simplifiedDateChild.source = node[child].source.simpleItemDescription.$;
                                                }
                                                if (node[child].data && node[child].data.simpleItemDescriptio) {
                                                    simplifiedDateChild.date = node[child].data.simpleItemDescription.$;
                                                }
                                                
                                                return;
                                            default:
                                                // Decend recursively into the child node, looking for the messageDescription
                                                simplifiedDateChild[child] = {};
                                                simplifyNode(node[child], simplifiedDateChild[child]);
                                        }
                                    }
                                }
                                simplifyNode(date.topicSet, simplifiedDate)
                            }
                            
                            utils.handleResult(node, err, simplifiedDate, null, newMsg);
                        });
                        break;
                    case "getEventServiceCapabilities":
                        node.deviceConfig.cam.getEventServiceCapabilities(function(err, date, xml) {
                            utils.handleResult(node, err, date, xml, newMsg);
                        });
                        break;
                    case "reconnect":
                        node.deviceConfig.cam.connect(function(err) {
                            utils.handleResult(node, err, "", null, newMsg);
                        });
                        break
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
            
            // Stop listening to events from the camera
            if (node.eventListener) {
                node.deviceConfig.cam.removeListener('event', node.eventListener);
                node.eventListener = null;
            }
        });
    }
    RED.nodes.registerType("onvif-events",OnVifEventsNode);
}
