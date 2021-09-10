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
exports.setNodeStatus = function(node, serviceName, onvifStatus) {
    switch(onvifStatus) {
        case "unconfigured":
            node.status({fill:"red",shape:"ring",text:onvifStatus});
            break;
        case "initializing":
            node.status({fill:"yellow",shape:"dot",text:onvifStatus});
            break;
        case "disconnected":
            node.status({fill:"red",shape:"ring",text:onvifStatus});
            break;
        case "connected":
            // Starting from agsh/onvif version  0.6.5, the cam.capabilities have become obsolete.
            // Use services instead.  See pull request https://github.com/agsh/onvif/pull/155
            // When the cam doesn't offer services, the agsh/onvif library has a fallback to the obsolete capabilities.
            if (node.deviceConfig.cam.services || node.deviceConfig.cam.capabilities) {
                // When connected to the Onvif device, the status depends on whether the device supports the specified service
                if (exports.hasService(node.deviceConfig.cam, serviceName)) {
                    node.status({fill:"green",shape:"dot",text:onvifStatus}); 
                }
                else {
                    node.status({fill:"red",shape:"ring",text:"unsupported"});  
                }
            }
            else {
                node.status({fill:"red",shape:"ring",text:"no services"});
            }
            break;
        case "":
            node.status({});
            break;
        default:
            node.status({fill:"red",shape:"ring",text:"unknown"});
    }
};

exports.handleResult = function(node, err, date, xml, newMsg) {
    if (err) {
        node.error(err.message);

        var lowercase = err.message.toLowerCase();
        
        // Sometimes the OnVif device responds with errors like "Method Not Found", "Action Not Implemented", ... 
        // In that case we will show an error indicating that the action is not supported by the device.
        // WE WON'T SET A TEMPORARY NODE STATUS, BECAUSE OTHERWISE WE SHOULD SHOW THE ORIGINAL STATUS AGAIN AFTER SOME TIME
        // (WHICH IS NOT RELEVANT)/ see https://github.com/bartbutenaers/node-red-contrib-onvif-nodes/issues/12
        //if (lowercase.includes("not found") || lowercase.includes("not implemented")) {
        //    node.status({fill:"red",shape:"dot",text: "unsupported action"});
        //}
        //else {
        //    node.status({fill:"red",shape:"dot",text: "failed"});
        //}
        
        // When a reconnect action fails, then the status needs to become 'disconnected' (because that is no temporary status unlike the others)
        if (newMsg.action == "reconnect") {
            node.status({fill:"red",shape:"dot",text: "disconnected"});
        }
    }
    else {
        if (newMsg) {
            newMsg.payload = date;
            node.send(newMsg);
        }
        
        // When a reconnect action succeeds, then the status needs to become 'connected' (because that is no temporary status unlike the others)
        if (newMsg.action == "reconnect") {
            node.status({fill:"blue",shape:"dot",text: "connected"});
        }
    } 
}

exports.hasService = function (cam, serviceName) {
    if (cam.services) {
        // Check whether there is a service available, whose XAddr ends with the specified service name
        return cam.services.some(function (service) {
            return service.XAddr && service.XAddr.toLowerCase().includes(serviceName.toLowerCase());
        });
    }
    else if (cam.capabilities) {
        // When the cam doesn't offer services, the agsh/onvif library has a fallback to the obsolete capabilities
        return Object.keys(cam.capabilities).some(function (capabilityName) {
            var service = cam.capabilities[capabilityName];
            return service.XAddr && capabilityName.toLowerCase().includes(serviceName.toLowerCase());
        });
    }
    else {
        return false;
    }
}
