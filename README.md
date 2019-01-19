# node-red-contrib-onvif-nodes
Node Red nodes for communicating with OnVif compliant IP devices

**THIS IS AN EXPERIMENTAL NODE-RED CONTRIBUTION.  API WILL BE CHANGED SOON !!!**

**SEE THIS [DISCUSSION](https://discourse.nodered.org/t/onvif-camera-control/6888) ON THE NODE-RED FORUM FOR LATEST INFORMATION**

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-onvif-nodes
```

## Onvif basics
The Open Network Video Interface Forum is an open standard interface to communicate with IP devices on a network.   This standard has become very popular, and therefore lots of manufacturers offer Onvif-compliant IP devices.

All IP devices have their ***own API***, which consists out of a large set of URL's to control the device (to get a snapshot image, to turn the camera left ...).  The disadvantage is that you have to learn all the API's of each camera that you buy, which means that it is not easy to replace a camera by another type (since you always will have to update your Node-Red flow). 

The Onvif standard has been created to solve this issue.  Each Onvif compliant device offers the ***same API*** to control the device, which means that device type X can easily be replaced by device type Y.

Onvif devices can offer multiple (web) services, for all kind of functionalities:
+ Device discovery
+ Device management
+ Media configuration
+ Real time viewing
+ Event handling
+ PTZ camera control
+ ...

Not all Onvif devices offer all those services, since this the device's Onvif ***version*** determines which services are available.  However the Onvif version number is not as important as the Onvif ***profile***.  A number of Onvif profiles are available, which determine which functionality each service offers:
+ Profile S: functionalities of IP video systems, such as video and audio streaming, PTZ controls, ...
+ Profile C: functionalities of IP access control systems, such as door control, event handling, ...
+ Profile G: functionalities of video storage, recording, ...
+ Profile Q: functionalities of device discovery, ...
+ ...

You can find [here](https://www.onvif.org/wp-content/uploads/2018/05/ONVIF_Profile_Feature_overview_v2-1.pdf) which profile is required to fit your needs.  Conclusion is that not all Onvif devices will offer the functionality that you might need!

## Missing functionality and problems
This Node-Red node is build on top of the [onvif](https://github.com/agsh/onvif) library, which is a profile S and Profile G implementation.  So this Node-Red node is absolutely no full implementation of the entire Onvif standard!

Moreover not all device manufacturers implement the Onvif standard correctly.  In that case you might not be able to fully control your devices using these nodes.

Most of the Onvif logic is developed in the library I use underneath.  So to get new functionality or to get a problem fixed, the fastest way to get it done is following these steps:
1. Create a new issue [here](https://github.com/agsh/onvif/issues) to ask your Onvif related question in the onvif library.  This step is **not** required when you have a Node-RED specific question!
2. As soon as step 1 is implemented, create a new issue [here](https://github.com/bartbutenaers/node-red-contrib-onvif/issues) and then I can finish your change in this Node-Red node.

Or if you have programming skills, you might create two pull requests instead.

## Usage

### Discovery node
To search the network for Onvif-compliant devices, the Discovery node can be used.  When this node is triggered (by means of an input message), it will send an OnVif broadcast to all the devices on the network.  All OnVif compliant devices will respond to this, and they will be listed in the output message `msg.payload`:

![Broadcast flow](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_discovery_flow.png)

```
[{"id":"dccb8bf1.9f8a78","type":"onvifdiscovery","z":"bb2edfc9.1718a","name":"","timeout":"5","separate":false,"x":720,"y":820,"wires":[["ff040db0.4745b"]]},{"id":"50c52f5f.7674c","type":"inject","z":"bb2edfc9.1718a","name":"Start","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":550,"y":820,"wires":[["dccb8bf1.9f8a78"]]},{"id":"ff040db0.4745b","type":"debug","z":"bb2edfc9.1718a","name":"OnVif devices","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":920,"y":820,"wires":[]}]
```

The Discovery node has following settings:
+ The ***timeout*** time is by default 5 seconds, which means that the node will wait 5 seconds for all devices to respond. In normal circumstances all responses will arrive within 3 seconds.  However when some devices are not detected, it might be useful to increase the timeout time.  That way slower devices will have more time to respond to the broadcast signal.

+ The checkbox ***'Separate output message for each device'*** allow to control the output messages:
   + When enabled, a separate output message will be generated for each OnVif compliant device.  
   + When disabled, a single output message will be generated (containing an array of all available OnVif devices).
   
For every discovered OnVif compliant device, following data will be generated in the output message:

![Broadcast debug](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_discovery_debug.png)

The ***'address'*** field contains the most important information (in the output message), since it will be used to configure the Onvif device in Node-Red!  *Indeed you will have to create an Onvif device config node for every Onvif device that you have discovered.*  In all other Onvif nodes (Media, PTZ ...), these device config nodes can be selected (in the dropdown) to send Onvif commands to the device:

![Onvif config](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_config_node.png)

### Media node

![Media flow](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_media_flow.png)

```
[{"id":"41130dca.f01204","type":"onvifmedia","z":"bb2edfc9.1718a","name":"","deviceConfig":"79ca9bc.80f4d64","profileToken":"","profileName":"","videoEncoderConfigToken":"","action":"","protocol":"","stream":"","x":750,"y":2960,"wires":[["a8e34d78.b80c9"]]},{"id":"a5cf5b1e.255618","type":"inject","z":"bb2edfc9.1718a","name":"Get UDP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":2960,"wires":[["9f4118d.cb407e8"]]},{"id":"cef67b6f.230d58","type":"inject","z":"bb2edfc9.1718a","name":"Get HTTP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":3000,"wires":[["444cc0c.70f884"]]},{"id":"444cc0c.70f884","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"HTTP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3000,"wires":[["41130dca.f01204"]]},{"id":"a2d3b4c2.d1ad68","type":"inject","z":"bb2edfc9.1718a","name":"Get RTSP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":3040,"wires":[["88d83e40.33ec"]]},{"id":"88d83e40.33ec","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"RTSP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3040,"wires":[["41130dca.f01204"]]},{"id":"77a5cab9.aad1d4","type":"inject","z":"bb2edfc9.1718a","name":"Get video encoder configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3100,"wires":[["6aedd93c.97b488"]]},{"id":"6aedd93c.97b488","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3100,"wires":[["41130dca.f01204"]]},{"id":"7d1da405.821bfc","type":"inject","z":"bb2edfc9.1718a","name":"Get profiles","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":3780,"wires":[["efb276c.20e7388"]]},{"id":"efb276c.20e7388","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getProfiles","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3780,"wires":[["41130dca.f01204"]]},{"id":"1708d2e3.e5610d","type":"inject","z":"bb2edfc9.1718a","name":"Get video sources","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":3280,"wires":[["8ecd4b06.a04018"]]},{"id":"8ecd4b06.a04018","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoSources","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3280,"wires":[["41130dca.f01204"]]},{"id":"cb4f1589.6a0cd8","type":"inject","z":"bb2edfc9.1718a","name":"Get video source configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3320,"wires":[["f74d8d50.abc8c"]]},{"id":"f74d8d50.abc8c","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoSourceConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3320,"wires":[["41130dca.f01204"]]},{"id":"1c0612c3.159d8d","type":"inject","z":"bb2edfc9.1718a","name":"Get audio outputs","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":3520,"wires":[["e7af7b4e.d91b68"]]},{"id":"e7af7b4e.d91b68","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioOutputs","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3520,"wires":[["41130dca.f01204"]]},{"id":"89a8c96a.3c6118","type":"inject","z":"bb2edfc9.1718a","name":"Get audio sources","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":3380,"wires":[["b552c221.2141f"]]},{"id":"b552c221.2141f","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioSources","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3380,"wires":[["41130dca.f01204"]]},{"id":"eccc43f2.12145","type":"inject","z":"bb2edfc9.1718a","name":"Get audio source configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3420,"wires":[["c09a13e7.cb21e"]]},{"id":"c09a13e7.cb21e","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioSourceConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3420,"wires":[["41130dca.f01204"]]},{"id":"cd54693.51e1298","type":"inject","z":"bb2edfc9.1718a","name":"Get audio encoder configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3460,"wires":[["ccd110fd.d5038"]]},{"id":"ccd110fd.d5038","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioEncoderConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3460,"wires":[["41130dca.f01204"]]},{"id":"a8e34d78.b80c9","type":"debug","z":"bb2edfc9.1718a","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":940,"y":2960,"wires":[]},{"id":"57b52e88.1c37f","type":"inject","z":"bb2edfc9.1718a","name":"Get video encoder configuration","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3140,"wires":[["51327b4b.97ffb4"]]},{"id":"51327b4b.97ffb4","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfiguration","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3140,"wires":[["41130dca.f01204"]]},{"id":"8807a2f3.6a1a","type":"inject","z":"bb2edfc9.1718a","name":"Get video encoder configuration options","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":3180,"wires":[["c00bf744.976818"]]},{"id":"c00bf744.976818","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfigurationOptions","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3180,"wires":[["41130dca.f01204"]]},{"id":"75b34347.982acc","type":"inject","z":"bb2edfc9.1718a","name":"Get audio output configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":3560,"wires":[["4abb4b36.f9e624"]]},{"id":"4abb4b36.f9e624","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioOutputConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3560,"wires":[["41130dca.f01204"]]},{"id":"16f421.30236be","type":"inject","z":"bb2edfc9.1718a","name":"Get snapshot URI","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":3660,"wires":[["4688f15b.8c7d2"]]},{"id":"4688f15b.8c7d2","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getSnapshotUri","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3660,"wires":[["41130dca.f01204"]]},{"id":"cc4a2484.19f118","type":"inject","z":"bb2edfc9.1718a","name":"Get OSD's","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":160,"y":3720,"wires":[["7ddd1bea.6a9844"]]},{"id":"7ddd1bea.6a9844","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getOSDs","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3720,"wires":[["41130dca.f01204"]]},{"id":"9f4118d.cb407e8","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"UDP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":2960,"wires":[["41130dca.f01204"]]},{"id":"109bb607.4858ca","type":"inject","z":"bb2edfc9.1718a","name":"Create profile","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":3820,"wires":[["ab6668f4.8be638"]]},{"id":"ab6668f4.8be638","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"createProfile","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"testToken","tot":"str"},{"t":"set","p":"profileName","pt":"msg","to":"myProfile","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3820,"wires":[["41130dca.f01204"]]},{"id":"f645ee6b.ea2e6","type":"inject","z":"bb2edfc9.1718a","name":"Delete profile","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":3860,"wires":[["3b575ff6.6f156"]]},{"id":"3b575ff6.6f156","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"deleteProfile","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_user_profile1","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3860,"wires":[["41130dca.f01204"]]},{"id":"f3564f.1ef0a9b","type":"inject","z":"bb2edfc9.1718a","name":"Get snapshot","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":3620,"wires":[["a5855f9e.ad26a"]]},{"id":"a5855f9e.ad26a","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getSnapshot","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3620,"wires":[["41130dca.f01204"]]},{"id":"ec4354f1.867598","type":"inject","z":"bb2edfc9.1718a","name":"Set video encoder configuration options","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":3220,"wires":[["b883bfc9.250b6"]]},{"id":"b883bfc9.250b6","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"setVideoEncoderConfigurationOptions","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":3220,"wires":[[]]},{"id":"79ca9bc.80f4d64","type":"onvif_device_config","z":"","xaddress":"192.168.1.200","name":"Camera keuken"}]
```

The action ***getSnapshotUri*** returns the URL that can be used for retrieving a snapshot image from the camera.  That URL could be passed to a HttpRequest node to fetch the snapshot image:

![Media snapshot](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_media_snapshot.png)

```
[{"id":"ed82ed59.593e6","type":"http request","z":"bb2edfc9.1718a","name":"","method":"GET","ret":"bin","url":"","tls":"","x":1170,"y":2820,"wires":[["50246c7e.8dabd4"]]},{"id":"50246c7e.8dabd4","type":"image","z":"bb2edfc9.1718a","name":"","width":200,"x":1350,"y":2820,"wires":[]},{"id":"f8779ce3.3f67","type":"onvifmedia","z":"bb2edfc9.1718a","name":"","deviceConfig":"","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"getSnapshotUri","protocol":"","stream":"","x":810,"y":2820,"wires":[["a734ba31.f75d78"]]},{"id":"6ac5b6bb.1d3bd8","type":"inject","z":"bb2edfc9.1718a","name":"Get snapshot","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":630,"y":2820,"wires":[["f8779ce3.3f67"]]},{"id":"a734ba31.f75d78","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"url","pt":"msg","to":"payload.uri","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":990,"y":2820,"wires":[["ed82ed59.593e6"]]}]
```

However the flow will become complex and the device's credentials (username/password) should be again specified in the httprequest node.  Therefore action ***getSnapshot*** has been added to execute all these steps in a single operation:

![Media snapshot short](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_media_snapshot_short.png)

```
[{"id":"5756138c.5e3fac","type":"inject","z":"bb2edfc9.1718a","name":"Get snapshot image","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":890,"y":2560,"wires":[["7346f703.240908"]]},{"id":"7346f703.240908","type":"onvifmedia","z":"bb2edfc9.1718a","name":"","deviceConfig":"","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"getSnapshot","protocol":"","stream":"","x":1090,"y":2560,"wires":[["fb09de66.f5ec2"]]},{"id":"fb09de66.f5ec2","type":"image","z":"bb2edfc9.1718a","name":"","width":200,"x":1270,"y":2560,"wires":[]}]
```

### Device Node
When this node is triggered (by means of an input message), it will generate an output message `msg.payload` containing information about that device:

***TODO screenshot and explanation of the message content***

### Snapshot Node
When this node is triggered (by means of an input message), it will generate an output message `msg.payload` containing a snapshot image from the camera (as a Buffer).

***TODO screenshot***

The resolution of the image depends on the **profile** specified in the node's config screen.  For example if value *'1_def_profile2'* is set for my Panasonic camera, the snapshot image will be a JPEG of resolution 640x480.  Indeed in the output of the *Device Node*, the resolution of every available profile will be visible:
![Snapshot debug](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_snapshot_debug.png)

### PTZ Node
This node allows the OnVif device to be PTZ controlled: Pan / Tilt / Zoom.

+ `Pan`: Move the camera to the *left* (value between -1.0 and 0.0) or *right* (value between 0.0 and 1.0).
+ `Tilt`: Move the camera *down* (value between -1.0 and 0.0) or *up* (value between 0.0 and 1.0).
+ `Zoom`: Zoom the camera *out* (value between -1.0 and 0.0) or *in* (value between 0.0 and 1.0).

The higher the (absolute) values, the faster the movement will be executed.  This means that the motor will turn faster.

An extra option `Time` can be specified, which is the time interval (in seconds) that the movement will be applied.  For example a tilt value of *-0.5* with time *2*, means that the device will move down at half speed during 2 seconds.

Those tree values can also be set via the input message, at condition that the value is `0` in the node's config screen.  The input message fields that can be used are respectively `msg.pan`, `msg.tilt` and `msg.zoom`.

![PTZ flow](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_ptz_flow.png)

## TODOs
+ Check why zoom in/out doesn't work on a Panasonic camera.
+ Implement rtsp streaming.
+ Implement entire API of [node-onvif](https://github.com/futomi/node-onvif).
+ Solve authentication errors when flow is (re)deployed.
