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
            
            var action = node.action || msg.action;
            
            if (!action) {
                console.warn('When no action specified in the node, it should be specified in the msg.action');
                return;
            }
            
            newMsg.xaddr = this.deviceConfig.xaddress;
            newMsg.action = action;
            
            switch (action) {
                case "hardware":
                    newMsg.payload = node.device.getInformation();
                    node.send(newMsg);
                    break;
                case "profiles":
                    newMsg.payload = node.device.getProfileList();
                    node.send(newMsg);
                    break;
                case "streamurl":
                    newMsg.payload = node.device.getUdpStreamUrl();
                    node.send(newMsg);
                    break;
                case "hostname":
                    node.device.services.device.getHostname().then((result) => {
                        newMsg.payload = result.data.GetHostnameResponse.HostnameInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "dns":
                    node.device.services.device.getDNS().then((result) => {
                        newMsg.payload = result.data.GetDNSResponse.DNSInformation.DNSFromDHCP;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "interfaces":
                    node.device.services.device.getNetworkInterfaces().then((result) => {
                        newMsg.payload = result.data.GetNetworkInterfacesResponse.NetworkInterfaces;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "protocols":
                    node.device.services.device.getNetworkProtocols().then((result) => {
                        newMsg.payload = result.data.GetNetworkProtocolsResponse.NetworkProtocols;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                    
                case "gateway":
                    node.device.services.device.getNetworkDefaultGateway().then((result) => {
                        newMsg.payload = result.data.GetNetworkDefaultGatewayResponse.NetworkGateway;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                      
                case "datetime":
                    node.device.services.device.getSystemDateAndTime().then((result) => {
                        newMsg.payload = result.data.GetSystemDateAndTimeResponse.SystemDateAndTime;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                     
                case "relayoutputs":
                    node.device.services.device.getRelayOutputs().then((result) => {
                        newMsg.payload = result.data.GetRelayOutputsResponse;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                     
                case "ntp":
                    node.device.services.device.getNTP().then((result) => {
                        newMsg.payload = result.data.GetNTPResponse.NTPInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;  
                case "dynamicdns":
                    node.device.services.device.getDynamicDNS().then((result) => {
                        newMsg.payload = result.data.GetDynamicDNSResponse.DynamicDNSInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;  
                case "services":
                    var params = {
                        'IncludeCapability': true
                    };
                
                    promise = node.device.services.device.getServices(params).then((result) => {
                        newMsg.payload = result;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                        // TODO Hier komen we steeds met deze fout:
                        //    Error: 500 Internal Server Error - Method Not Found
                        //    at parse.then (/home/pi/.node-red/node_modules/node-onvif/lib/modules/soap.js:144:16)
                        //    at process._tickCallback (internal/process/next_tick.js:109:7)
                        
                    });
                    break;
            }
        });
    }
    RED.nodes.registerType("onvifdevice",OnVifDeviceNode);
}
