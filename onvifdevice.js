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
                case "getInformation":
                    newMsg.payload = node.device.getInformation();
                    node.send(newMsg);
                    break;
                case "getProfileList":
                    newMsg.payload = node.device.getProfileList();
                    node.send(newMsg);
                    break;
                case "getUdpStreamUrl":
                    newMsg.payload = node.device.getUdpStreamUrl();
                    node.send(newMsg);
                    break;
                case "getHostname":
                    node.device.services.device.getHostname().then((result) => {
                        newMsg.payload = result.data.GetHostnameResponse.HostnameInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getDNS":
                    node.device.services.device.getDNS().then((result) => {
                        newMsg.payload = result.data.GetDNSResponse.DNSInformation.DNSFromDHCP;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getNetworkInterfaces":
                    node.device.services.device.getNetworkInterfaces().then((result) => {
                        newMsg.payload = result.data.GetNetworkInterfacesResponse.NetworkInterfaces;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getNetworkProtocols":
                    node.device.services.device.getNetworkProtocols().then((result) => {
                        newMsg.payload = result.data.GetNetworkProtocolsResponse.NetworkProtocols;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                    
                case "getNetworkDefaultGateway":
                    node.device.services.device.getNetworkDefaultGateway().then((result) => {
                        newMsg.payload = result.data.GetNetworkDefaultGatewayResponse.NetworkGateway;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                      
                case "getSystemDateAndTime":
                    node.device.services.device.getSystemDateAndTime().then((result) => {
                        newMsg.payload = result.data.GetSystemDateAndTimeResponse.SystemDateAndTime;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                     
                case "getRelayOutputs":
                    node.device.services.device.getRelayOutputs().then((result) => {
                        newMsg.payload = result.data.GetRelayOutputsResponse;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                     
                case "getNTP":
                    node.device.services.device.getNTP().then((result) => {
                        newMsg.payload = result.data.GetNTPResponse.NTPInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;  
                case "getDynamicDNS":
                    node.device.services.device.getDynamicDNS().then((result) => {
                        newMsg.payload = result.data.GetDynamicDNSResponse.DynamicDNSInformation;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;  
                case "getServices":
                    var params = {
                        'IncludeCapability': true
                    };

                    // Following snippet results in "Error: 500 Internal Server Error - Method Not Found"
                    //promise = node.device.services.device.getServices(params).then((result) => {
                    //    newMsg.payload = result;
                    //    node.send(newMsg);
                    //}).catch((error) => {
                    //    console.error(error);  
                    //});
                    newMsg.payload = node.device.services;
                    node.send(newMsg);
                    break;
                case "getCurrentProfile":
                    debugger;
                    newMsg.payload = node.device.getCurrentProfile();
                    node.send(newMsg);
                    break;
                case "getCapabilities":
                    node.device.services.device.getCapabilities().then((result) => {
                        newMsg.payload = result.data.GetCapabilitiesResponse.Capabilities;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;      
                 case "getWsdlUrl":
                    node.device.services.device.getWsdlUrl().then((result) => {
                        newMsg.payload = result.data.GetWsdlUrlResponse.WsdlUrl;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getDiscoveryMode":
                    node.device.services.device.getDiscoveryMode().then((result) => {
                        newMsg.payload = result.data.GetDiscoveryModeResponse.DiscoveryMode;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getScopes":
                    node.device.services.device.getScopes().then((result) => {
                        newMsg.payload = result.data.GetScopesResponse.Scopes;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "reboot":
                    node.device.services.device.reboot().then((result) => {
                        newMsg.payload = result.data.SystemRebootResponse.Message;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getUsers":
                    node.device.services.device.getUsers().then((result) => {
                        newMsg.payload = result.data.GetUsersResponse.User;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;
                case "getZeroConfiguration":
                    node.device.services.device.getZeroConfiguration().then((result) => {
                        newMsg.payload = result.data.GetZeroConfigurationResponse.ZeroConfiguration;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;     
                case "getServiceCapabilities":
                    // TODO dit geeft een "Method Not Found"
                    node.device.services.device.getServiceCapabilities().then((result) => {
                        debugger;
                        //TODO newMsg.payload = result.data.;
                        node.send(newMsg);
                    }).catch((error) => {
                        console.error(error);
                    });
                    break;                    
            }
            
            // TODOs
            // Heeft dit zin ?? Is dit enkel op de device instance in deze node ???
            // device.changeProfile(min_index);
            
            /*
            setscopes, addscopes, removescopes
            setHostname
            setDNS
            setNetworkProtocols
            setNetworkDefaultGateway
            createUsers
            deleteUsers
            setUser
            setNTP
            */
        });
    }
    RED.nodes.registerType("onvifdevice",OnVifDeviceNode);
}
 
