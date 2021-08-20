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
            var service = node.deviceConfig.cam.capabilities[serviceName];
                
            // When connected to the Onvif device, check whether it supports the specified service
            if (service && service.XAddr) {
                node.status({fill:"green",shape:"dot",text:onvifStatus}); 
            }
            else {
                node.status({fill:"red",shape:"ring",text:"unsupported"});  
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
        if (newMsg.action = "reconnect") {
            node.status({fill:"red",shape:"dot",text: "disconnected"});
        }
    }
    else {
        if (newMsg) {
            newMsg.payload = date;
            node.send(newMsg);
        }
        
        // When a reconnect action succeeds, then the status needs to become 'connected' (because that is no temporary status unlike the others)
        if (newMsg.action = "reconnect") {
            node.status({fill:"blue",shape:"dot",text: "connected"});
        }
    } 
}
