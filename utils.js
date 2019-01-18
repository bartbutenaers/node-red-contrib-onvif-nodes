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
exports.initializeDevice = function(node, serviceName) {
    const onvif  = require('onvif');
    
    node.cam = null;
        
    // Create an OnvifDevice object, if a device configuration has been specified
    if (node.deviceConfig) {
        node.status({fill:"yellow",shape:"dot",text:"initializing"});
        
        if (node.deviceConfig.credentials && node.deviceConfig.credentials.user) {
            var options = {
                hostname: node.deviceConfig.xaddress,
                username: node.deviceConfig.credentials.user,
                password: node.deviceConfig.credentials.password
            };
        }
        else {
            var options = {
                hostname: node.deviceConfig.xaddress
            };
        }
        
        // Create a new camera instance.
        // It tries to connect automatically to the device, and load a lot of data.
        new onvif.Cam(options, function(err) { 
            // As soon as the device has been setup, we will keep a reference to it
            node.cam = this;
            
            if (err) {
                console.error(err);
                node.status({fill:"red",shape:"ring",text:"disconnected"});
            }
            else {  
                var service = node.cam.capabilities[serviceName];
                
                // Check whether the Onvif device implements the specified interface
                if (service && service.XAddr) {
                    node.status({fill:"green",shape:"dot",text:"connected"}); 
                }
                else {
                    node.status({fill:"red",shape:"ring",text:"unsupported"});  
                }
            }
        });
    }
    else {
        node.status({fill:"red",shape:"ring",text:"unconfigured"});
    }
};

exports.handleResult = function(node, err, stream, xml, newMsg) {
    if (err) {
        var lowercase = err.message.toLowerCase();
    
        console.log(err);
        
        // Sometimes the OnVif device responds with errors like "Method Not Found", "Action Not Implemented", ... 
        // In that case we will show an error indicating that the action is not supported by the device.
        //if (lowercase.includes("not found") || lowercase.includes("not implemented")) {
        //    node.status({fill:"red",shape:"dot",text: "unsupported action"});
        //}
        //else {
        //    node.status({fill:"red",shape:"dot",text: "failed"});
        //}
    }
    else {
        newMsg.payload = stream;
        node.send(newMsg);
    }
}
