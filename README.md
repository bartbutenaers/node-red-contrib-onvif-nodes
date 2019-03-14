# node-red-contrib-onvif-nodes
Node Red nodes for communicating with OnVif compliant IP devices

**THIS IS AN EXPERIMENTAL NODE-RED CONTRIBUTION.  API WILL BE CHANGED SOON !!!**

**SEE THIS [DISCUSSION](https://discourse.nodered.org/t/onvif-camera-control/6888) ON THE NODE-RED FORUM FOR LATEST INFORMATION**

***TODO: Discuss which error should be visualised in the node status...***

***TODO: Check whether the credentials are safe within config node (in cam instance), or can all nodes access them??***

***TODO: Discuss how we can have user friendly config screens, to get a usable set of nodes (without needing great tools like ONVIF Device Manager.***

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
2. As soon as step 1 is implemented, create a new issue [here](https://github.com/bartbutenaers/node-red-contrib-onvif-nodes/issues) and then I can finish your change in this Node-Red node.

Or if you have programming skills, you might create two pull requests instead.

## Discovery node
To search the network for Onvif-compliant devices, the Discovery node can be used.  When this node is triggered (by means of an input message), it will send an OnVif broadcast to all the devices on the network.  All OnVif compliant devices will respond to this, and they will be listed in the output message `msg.payload`:

![Broadcast flow](/images/onvif_discovery_flow.png)

```
[{"id":"a19788d1.afaf98","type":"onvif-discovery","z":"50df184.124f2e8","name":"","timeout":5,"separate":true,"x":500,"y":480,"wires":[["ed0cc23.44c014"]]},{"id":"be6e8353.f7716","type":"inject","z":"50df184.124f2e8","name":"Start searching","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":280,"y":480,"wires":[["a19788d1.afaf98"]]},{"id":"ed0cc23.44c014","type":"debug","z":"50df184.124f2e8","name":"Onvif devices","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":700,"y":480,"wires":[]}]
```

The Discovery node has following settings:
+ The ***timeout*** time is by default 5 seconds, which means that the node will wait 5 seconds for all devices to respond. In normal circumstances all responses will arrive within 3 seconds.  However when some devices are not detected, it might be useful to increase the timeout time.  That way slower devices will have more time to respond to the broadcast signal.

+ The checkbox ***'Separate output message for each device'*** allow to control the output messages:
   + When enabled, a separate output message will be generated for each OnVif compliant device.  As soon as an Onvif device has responded, an output message will be generated immediately.  However the node will continue waiting for other Onvif devices to respond, until the timeout time has been reached.
   + When disabled, a single output message will be generated (containing an array of all available OnVif devices).  This message will only appear after the timeout time, to allow all Onvif devices to respond.

For every discovered OnVif compliant device, following data will be generated in the output message:

![Broadcast debug](/images/onvif_discovery_debug.png)

The ***'XAddrs'*** field contains the IP address (and the port number), which will be used to configure the Onvif device in Node-Red!  *Indeed you will have to create an Onvif device config node for every Onvif device that you have discovered.*  

During discovery the node status will be *'discovering'*.  But once the timeout has passed, the discovery process is *'completed'* and the number of discovered devices will be displayed:

![Broadcast status](/images/onvif_discovery_status.png)

As long as the discovery process is active, no second discovery process can be started (via the same Discovery node).

## Config node
The config node contains all information required to connect to an Onvif device:
+ IP address: When you don't know the IP address of your Onvif nodes, please see the Discovery node above.
+ Port: When you don't know the IP address of your Onvif nodes, please see the Discovery node above.  If no port number visible, use port ```80``` by default.
+ Username: Optional but highly advised to secure your camera by username/password credentials.
+ Password: Optional but highly advised to secure your camera by username/password credentials.

***TODO: Add a search box that starts a discovery, and from which users can select an IP address of an Onvif device.***

In all other Onvif nodes (Media, PTZ ...), these device config nodes can be selected (in the dropdown) to send Onvif commands to the device:

![Onvif config](/images/onvif_config_node.png)

The config node will handle all communication with the Onvif device:

![Config node communication](/images/onvif_config_comm.png)

Since all Onvif nodes (of the same Onvif device) share the same config node, that config node will load the required data only once from the Onvif device.  This caching mechanism reduces the communication between Node-RED and the Onvif device.

CAUTION: the IP addres of the Onvif device should not be changed by your DHCP server (e.g. inside your router), otherwise the Onvif device won't be accessible anymore afterwards.

## Media node
This node offers functionality about all kind of media, like audio/video/images.

***TODO: action 'reconnect' results in TypeError: Cannot read property 'call' of undefined.***

***TODO: action 'get OSDs' results in Method not found exception.***

### Audio media

![Audio media flow](/images/onvif_media_audio.png)

```
[{"id":"9e153ee9.48599","type":"inject","z":"26dbe156.c7049e","name":"Get audio outputs","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":290,"y":2580,"wires":[["28bffb9c.327f64"]]},{"id":"28bffb9c.327f64","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioOutputs","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2580,"wires":[["2e3b7d54.e13c82"]]},{"id":"ed3a82b7.32feb","type":"inject","z":"26dbe156.c7049e","name":"Get audio sources","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":290,"y":2462,"wires":[["2778fdc6.d45322"]]},{"id":"2778fdc6.d45322","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioSources","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2462,"wires":[["2e3b7d54.e13c82"]]},{"id":"3fda29eb.f08d36","type":"inject","z":"26dbe156.c7049e","name":"Get audio source configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2502,"wires":[["64a7d4f8.a5713c"]]},{"id":"64a7d4f8.a5713c","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioSourceConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2502,"wires":[["2e3b7d54.e13c82"]]},{"id":"4d4b782d.2005b8","type":"inject","z":"26dbe156.c7049e","name":"Get audio encoder configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2542,"wires":[["96c9bf7e.b344d"]]},{"id":"96c9bf7e.b344d","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioEncoderConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2542,"wires":[["2e3b7d54.e13c82"]]},{"id":"3f98ea7e.33d2a6","type":"inject","z":"26dbe156.c7049e","name":"Get audio output configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2620,"wires":[["3a66ad61.76ac62"]]},{"id":"3a66ad61.76ac62","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getAudioOutputConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2620,"wires":[["2e3b7d54.e13c82"]]},{"id":"dff49691.20aad8","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":1070,"y":2460,"wires":[]},{"id":"2e3b7d54.e13c82","type":"onvif-media","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"","protocol":"HTTP","stream":"RTP-Unicast","x":871,"y":2460,"wires":[["dff49691.20aad8"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

### Video media

![Video media flow](/images/onvif_media_video.png)

```
[{"id":"b8b92f3c.51354","type":"inject","z":"26dbe156.c7049e","name":"Get video encoder configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2140,"wires":[["5a666ad3.2952e4"]]},{"id":"5a666ad3.2952e4","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2140,"wires":[["63aa701b.8c9d9"]]},{"id":"2fce045f.1f784c","type":"inject","z":"26dbe156.c7049e","name":"Get video sources","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":290,"y":2300,"wires":[["dd47df99.1a3fe"]]},{"id":"dd47df99.1a3fe","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoSources","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2300,"wires":[["63aa701b.8c9d9"]]},{"id":"916154c8.408b88","type":"inject","z":"26dbe156.c7049e","name":"Get video source configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2340,"wires":[["7b07286e.c802d8"]]},{"id":"7b07286e.c802d8","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoSourceConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2340,"wires":[["63aa701b.8c9d9"]]},{"id":"5739570a.eb8348","type":"inject","z":"26dbe156.c7049e","name":"Get video encoder configuration","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":2180,"wires":[["cb58f5b1.958fc8"]]},{"id":"cb58f5b1.958fc8","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfiguration","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2180,"wires":[["63aa701b.8c9d9"]]},{"id":"a27a367c.953b48","type":"inject","z":"26dbe156.c7049e","name":"Get video encoder configuration options","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":350,"y":2220,"wires":[["b5a68b86.701138"]]},{"id":"b5a68b86.701138","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getVideoEncoderConfigurationOptions","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2220,"wires":[["63aa701b.8c9d9"]]},{"id":"73c056c.612d7a8","type":"inject","z":"26dbe156.c7049e","name":"Set video encoder configuration options","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":350,"y":2262,"wires":[["57ccd383.b4791c"]]},{"id":"57ccd383.b4791c","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"setVideoEncoderConfigurationOptions","tot":"str"},{"t":"set","p":"videoEncoderConfigToken","pt":"msg","to":"1_user_conf3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":620,"y":2262,"wires":[["63aa701b.8c9d9"]]},{"id":"1bc43860.0842c8","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":1030,"y":2140,"wires":[]},{"id":"63aa701b.8c9d9","type":"onvif-media","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"","protocol":"HTTP","stream":"RTP-Unicast","x":831,"y":2140,"wires":[["1bc43860.0842c8"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

### Stream URLs

![Stream URLs flow](/images/onvif_media_streamurl.png)

```
[{"id":"25868d80.b669b2","type":"inject","z":"26dbe156.c7049e","name":"Get UDP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":300,"y":1980,"wires":[["519a78b1.ab8f98"]]},{"id":"34d26bbc.6f7464","type":"inject","z":"26dbe156.c7049e","name":"Get HTTP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":300,"y":2020,"wires":[["5b572094.ac46c"]]},{"id":"5b572094.ac46c","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"HTTP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":629,"y":2020,"wires":[["d02bb043.673cf"]]},{"id":"ad234b85.9f4ba8","type":"inject","z":"26dbe156.c7049e","name":"Get RTSP stream URL","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":300,"y":2060,"wires":[["8b9e80fc.49837"]]},{"id":"8b9e80fc.49837","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"RTSP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":629,"y":2060,"wires":[["d02bb043.673cf"]]},{"id":"44d1df3f.62193","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":1049,"y":1980,"wires":[]},{"id":"519a78b1.ab8f98","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStreamUri","tot":"str"},{"t":"set","p":"protocol","pt":"msg","to":"UDP","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"1_def_profile3","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":629,"y":1980,"wires":[["d02bb043.673cf"]]},{"id":"d02bb043.673cf","type":"onvif-media","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"","protocol":"","stream":"","x":850,"y":1980,"wires":[["44d1df3f.62193"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

The RTSP url can be used to setup a real-time-streaming-protocol with the camera.  In this Node-RED [discussion](https://discourse.nodered.org/t/how-to-display-cctv-camera-in-dashboard-rtsp/5860/47?u=bartbutenaers), you can find my flow to decode an RTSP stream in Node-RED to a continious stream of images (after you have installed FFmpeg).

### Media profiles
Every Onvif device will contain a series of default media profiles.  Every profile contains following data:
+ A unique name.
+ A unique token which will only be used internally by these Onvif nodes (based on the name, the nodes will lookup the token automatically).
+ The configuration for all available media services (audio, video, ptz ...). 

For example the *'getProfiles'* action (in the example flow below) will return all available media profiles in my Onvif device:

![Get media profiles](/images/onvif_get_profiles.png)

When having a look e.g. at the details of the video encoding configuration, you will see a JPEG of resultion 320x240:

![Example profile](/images/onvif_example_profile.png)

Such a profile names need to be specified for most media actions.  So instead of having to repeat the information over and over again, the Onvif device will use the information from the specified profile.  For example when a snapshot as JPEG with resolution 320x240 is needed, you only need to specify the profile name *'JPEG_320x240'* ...

Following example flow shows how to view and manipulate profiles:
	
![Video media flow](/images/onvif_media_profiles.png)

```
[{"id":"3e1bb7ba.4aea98","type":"inject","z":"26dbe156.c7049e","name":"Get profiles","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":2900,"wires":[["3ef210b5.e10dc"]]},{"id":"3ef210b5.e10dc","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getProfiles","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":2900,"wires":[["c0548e0f.c2176"]]},{"id":"78adef9.6574c1","type":"inject","z":"26dbe156.c7049e","name":"Create profile","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":2940,"wires":[["51f16c10.71d124"]]},{"id":"51f16c10.71d124","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"createProfile","tot":"str"},{"t":"set","p":"profileToken","pt":"msg","to":"testToken","tot":"str"},{"t":"set","p":"profileName","pt":"msg","to":"myProfile","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":2940,"wires":[["c0548e0f.c2176"]]},{"id":"f41a1d44.ceef1","type":"inject","z":"26dbe156.c7049e","name":"Delete profile","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":2980,"wires":[["2888251b.9d850a"]]},{"id":"2888251b.9d850a","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"deleteProfile","tot":"str"},{"t":"set","p":"profileName","pt":"msg","to":"myProfile","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":520,"y":2980,"wires":[["c0548e0f.c2176"]]},{"id":"6782c13e.298af","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":970,"y":2900,"wires":[]},{"id":"c0548e0f.c2176","type":"onvif-media","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"","protocol":"HTTP","stream":"RTP-Unicast","x":771,"y":2900,"wires":[["6782c13e.298af"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

***TODO: Not possible yet to create an entire new profile, incl. configurations.***

### Snapshot images

Remark: to be able to run the example flow, some manual interventions are required:
+ The node-red-contrib-image-output should be installed, to show the snapshot image in the flow editor.
+ Select an available profile from your Onvif device via the 'search' icon!  Indeed the resolution of the snapshot image depends on the **profile** specified in the node's config screen, e.g. there might be a profile that offers JPEGs with resolution 640x480. 
+ In the first flow the username and password (of the Onvif config node) should be repeated in the httprequest node.

The action ***getSnapshotUri*** returns the URL that can be used for retrieving a snapshot image from the camera.  That URL could be passed to a HttpRequest node to fetch the snapshot image:

![Media snapshot](/images/onvif_media_snapshot_http.png)

```
[{"id":"ed82ed59.593e6","type":"http request","z":"bb2edfc9.1718a","name":"","method":"GET","ret":"bin","url":"","tls":"","x":1170,"y":2820,"wires":[["50246c7e.8dabd4"]]},{"id":"50246c7e.8dabd4","type":"image","z":"bb2edfc9.1718a","name":"","width":200,"x":1350,"y":2820,"wires":[]},{"id":"f8779ce3.3f67","type":"onvifmedia","z":"bb2edfc9.1718a","name":"","deviceConfig":"","profileToken":"","profileName":"","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"getSnapshotUri","protocol":"","stream":"","x":810,"y":2820,"wires":[["a734ba31.f75d78"]]},{"id":"6ac5b6bb.1d3bd8","type":"inject","z":"bb2edfc9.1718a","name":"Get snapshot","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":630,"y":2820,"wires":[["f8779ce3.3f67"]]},{"id":"a734ba31.f75d78","type":"change","z":"bb2edfc9.1718a","name":"","rules":[{"t":"set","p":"url","pt":"msg","to":"payload.uri","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":990,"y":2820,"wires":[["ed82ed59.593e6"]]}]
```

However the flow will become complex and the device's **credentials** (username/password) should be repeated in the httprequest node.  Therefore action ***getSnapshot*** has been added to execute all these steps in a single operation:

![Media snapshot short](/images/onvif_media_snapshot_short.png)

```
[{"id":"907621a9.98d79","type":"inject","z":"26dbe156.c7049e","name":"Get snapshot image","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1430,"y":100,"wires":[["ddb99a63.98e938"]]},{"id":"7074982e.851308","type":"image","z":"26dbe156.c7049e","name":"","width":200,"x":1820,"y":100,"wires":[]},{"id":"ddb99a63.98e938","type":"onvif-media","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profileToken":"","profileName":"JPEG_320x240","videoEncoderConfigToken":"","videoEncoderConfigName":"","videoEncoderConfigEncoding":"","action":"getSnapshot","protocol":"HTTP","stream":"RTP-Unicast","x":1630,"y":100,"wires":[["7074982e.851308"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","port":"80","name":"MyCamKitchen"}]
```

## Device Node
When this node is triggered (by means of an input message), it will generate an output message `msg.payload` containing information about that device:

+ ***Device information***: brand, type, ...
+ ***Hostname***: host name
+ ***System date and time***: clock of the camera.  This is the only information that is available without authorization (although I experienced that some camera's return a Not Authorized).
+ ***Services***: all services offered by the device.
+ ***Capabilities***: all capabilities offered by the device.
+ ***Scopes***: all scopes offered by the device.
+ ***Service capabilities***: all service capabilities offered by the device.
+ ***Reboot***: reboot the device remotely.
+ ***Reconnect***: reconnect to the device again.

***TODO Reconnect fails for my Panasonic (unauthorized), because getSystemDateTime is called underneath.  Normally getSystemDateTime is the only Onvif functionality that shouldn't require credentials ...***

When no action has been specified in the node's config screen, the action needs to be defined in the ```msg.action``` of the input message:

![Device](/images/onvif_device.png)

```
[{"id":"bacb880f.853a88","type":"inject","z":"26dbe156.c7049e","name":"Get device information","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":1520,"wires":[["90cf9e45.fef83"]]},{"id":"90cf9e45.fef83","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getDeviceInformation","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1520,"wires":[["569d0223.dcc0cc"]]},{"id":"c17d3b0c.763f78","type":"inject","z":"26dbe156.c7049e","name":"Get services","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":1640,"wires":[["b2189543.3cbc28"]]},{"id":"b2189543.3cbc28","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getServices","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1640,"wires":[["569d0223.dcc0cc"]]},{"id":"d710fda6.e8aae","type":"inject","z":"26dbe156.c7049e","name":"Get system datetime","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":1600,"wires":[["cc3c9656.8496a8"]]},{"id":"cc3c9656.8496a8","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getSystemDateAndTime","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1600,"wires":[["569d0223.dcc0cc"]]},{"id":"a744dbdf.67e6c8","type":"inject","z":"26dbe156.c7049e","name":"Get capabilities","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":1680,"wires":[["5d9e78c8.149b38"]]},{"id":"5d9e78c8.149b38","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getCapabilities","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1680,"wires":[["569d0223.dcc0cc"]]},{"id":"c4b35b2e.3088b8","type":"inject","z":"26dbe156.c7049e","name":"Get scopes","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":1720,"wires":[["65b4227b.29ca5c"]]},{"id":"65b4227b.29ca5c","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getScopes","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1720,"wires":[["569d0223.dcc0cc"]]},{"id":"d86390ea.9497c","type":"inject","z":"26dbe156.c7049e","name":"System reboot","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":1760,"wires":[["b977019e.b468"]]},{"id":"b977019e.b468","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"systemReboot","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1760,"wires":[["569d0223.dcc0cc"]]},{"id":"b42d91a3.9ce6","type":"inject","z":"26dbe156.c7049e","name":"Get service capabilities","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":1800,"wires":[["54209451.26faec"]]},{"id":"54209451.26faec","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getServiceCapabilities","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1800,"wires":[["569d0223.dcc0cc"]]},{"id":"43651b47.8d7824","type":"inject","z":"26dbe156.c7049e","name":"Get hostname information","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":1560,"wires":[["d49b6d87.e936d"]]},{"id":"d49b6d87.e936d","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getHostname","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1560,"wires":[["569d0223.dcc0cc"]]},{"id":"6227d5ec.51a9ec","type":"inject","z":"26dbe156.c7049e","name":"Reconnect to device","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":1840,"wires":[["c24552ea.311e3"]]},{"id":"c24552ea.311e3","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"reconnect","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":1840,"wires":[["569d0223.dcc0cc"]]},{"id":"569d0223.dcc0cc","type":"onvif-device","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","action":"","x":730,"y":1520,"wires":[["7c39ee64.2d193"]]},{"id":"7c39ee64.2d193","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":890,"y":1520,"wires":[]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

## Event Node (NOT FUNCTIONAL YET !!!)
This node allows to listen to all the events registered by the device.  The node will start listening to events when ```msg.action=start``` arrives and stops listening when ```msg.action=stop``` arrives:

![Events flow](/images/onvif_events.png)

```
[{"id":"7ea5e0c3.4d741","type":"inject","z":"26dbe156.c7049e","name":"Start listening","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":910,"y":860,"wires":[["378b6778.87ee38"]]},{"id":"378b6778.87ee38","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"start","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1220,"y":860,"wires":[["9199d036.ef115"]]},{"id":"e7a5c111.16471","type":"inject","z":"26dbe156.c7049e","name":"Stop listening","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":910,"y":900,"wires":[["1830bf3.8165041"]]},{"id":"1830bf3.8165041","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"start","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1220,"y":900,"wires":[["9199d036.ef115"]]},{"id":"b0958785.83ca18","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":1580,"y":860,"wires":[]},{"id":"82df60a3.e2b02","type":"inject","z":"26dbe156.c7049e","name":"Get event properties","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":930,"y":940,"wires":[["cd2a67b4.251db8"]]},{"id":"cd2a67b4.251db8","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getEventProperties","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1220,"y":940,"wires":[["9199d036.ef115"]]},{"id":"9b6039a9.8ed2a8","type":"inject","z":"26dbe156.c7049e","name":"Get event service capabilities","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":960,"y":980,"wires":[["fad5135e.3a95"]]},{"id":"fad5135e.3a95","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getEventServiceCapabilities","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1220,"y":980,"wires":[["9199d036.ef115"]]},{"id":"9199d036.ef115","type":"onvif-events","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","action":"","x":1410,"y":860,"wires":[["b0958785.83ca18"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```
***TODO: Get event service capabilities results in "method not found" ***

***TODO: Start listening aborts the entire flow with error: You should create pull-point subscription first! (see https://github.com/agsh/onvif/issues/76)***

## PTZ Node
This node allows the OnVif device to be PTZ controlled (Pan/Tilt/Zoom), but also offers a home position and multiple preset positions.  Of course this is only possible when the camera hardware supports PTZ.

***TODO: For cameras without zoom (i.e. only PT) like mine, the getStatus gives an error (so I cannot determine the current PTZ location.  See https://github.com/agsh/onvif/issues/103 for which I have to create a pull request.***

### Moving the camera
An PTZ camera can be remotely controlled to change the direction (vertical and horizontal) and zoom (in and out):
+ `Pan`: Move the camera to the *left* (value between -1.0 and 0.0) or *right* (value between 0.0 and 1.0).
+ `Tilt`: Move the camera *down* (value between -1.0 and 0.0) or *up* (value between 0.0 and 1.0).
+ `Zoom`: Zoom the camera *out* (value between -1.0 and 0.0) or *in* (value between 0.0 and 1.0).

The higher the (absolute) values, the faster the movement will be executed.  This means that the motor will turn faster.

Those 3 values can also be set via the input message, when the value is `0` in the node's config screen.  The input message fields are respectively `msg.pan`, `msg.tilt` and `msg.zoom`.

An extra `Time` option can be specified, which is the time interval (in seconds) that the movement will be applied.  For example a tilt value of *-0.5* with time *2*, means that the device will move down at half speed during 2 seconds.

![PTZ flow](/images/onvif_ptz_flow.png)

```
[{"id":"8bbc7b61.cb4188","type":"inject","z":"26dbe156.c7049e","name":"Right","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1330,"y":260,"wires":[["a6e564c.fde6698"]]},{"id":"d5281b45.ea95c8","type":"inject","z":"26dbe156.c7049e","name":"Left","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1330,"y":300,"wires":[["86b893d2.4f029"]]},{"id":"cee5bb21.150338","type":"inject","z":"26dbe156.c7049e","name":"Zoom in","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1340,"y":340,"wires":[["467c1396.0ea46c"]]},{"id":"643c2f21.4f1dc","type":"inject","z":"26dbe156.c7049e","name":"Zoom out","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1340,"y":380,"wires":[["e58c624a.ab789"]]},{"id":"a6e564c.fde6698","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"pan_speed","pt":"msg","to":"0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":260,"wires":[["a11d9175.e42f"]]},{"id":"86b893d2.4f029","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"pan_speed","pt":"msg","to":"-0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":300,"wires":[["a11d9175.e42f"]]},{"id":"467c1396.0ea46c","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"zoom_speed","pt":"msg","to":"0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":340,"wires":[["a11d9175.e42f"]]},{"id":"e58c624a.ab789","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"zoom_speed","pt":"msg","to":"-0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":380,"wires":[["a11d9175.e42f"]]},{"id":"412839c6.6f0b78","type":"inject","z":"26dbe156.c7049e","name":"Stop","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1330,"y":420,"wires":[["a0cfe609.370f98"]]},{"id":"a0cfe609.370f98","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"stop","tot":"str"},{"t":"set","p":"stopPanTilt","pt":"msg","to":"true","tot":"bool"},{"t":"set","p":"stopZoom","pt":"msg","to":"true","tot":"bool"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":420,"wires":[["a11d9175.e42f"]]},{"id":"d5076069.ec979","type":"inject","z":"26dbe156.c7049e","name":"Up","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1330,"y":180,"wires":[["2a43b711.797118"]]},{"id":"77155c06.44ac04","type":"inject","z":"26dbe156.c7049e","name":"Down","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1330,"y":220,"wires":[["5ada4b2.f1145b4"]]},{"id":"2a43b711.797118","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"tilt_speed","pt":"msg","to":"0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":180,"wires":[["a11d9175.e42f"]]},{"id":"5ada4b2.f1145b4","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"tilt_speed","pt":"msg","to":"-0.5","tot":"num"},{"t":"set","p":"action","pt":"msg","to":"continuousMove","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1540,"y":220,"wires":[["a11d9175.e42f"]]},{"id":"1e729e64.1ac1c2","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":1990,"y":180,"wires":[]},{"id":"a11d9175.e42f","type":"onvif-ptz","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profile":"1_def_profile3","action":"","panSpeed":0,"tiltSpeed":0,"zoomSpeed":0,"panPosition":0,"tiltPosition":0,"zoomPosition":0,"panTranslation":0,"tiltTranslation":0,"zoomTranslation":0,"time":1,"preset":"","presetName":"","stopPanTilt":true,"stopZoom":true,"configurationToken":"","x":1798,"y":180,"wires":[["1e729e64.1ac1c2"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

### Home position
A PTZ camera has a home position, where it will be positioned when nobody is manually controlling the camera.  You can use the PTZ control to move the camera to a certain position, and then you **'set'** the home position.  After the home position has been set, you can again use PTZ control to move the camera around.  But when you press the **'goto home position'**, the camera will automatically go back to the home position that you have set earlier.

![PTZ home](/images/onvif_ptz_home.png)

```
[{"id":"326d2b12.c82824","type":"inject","z":"26dbe156.c7049e","name":"Goto home position","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1530,"y":180,"wires":[["fb20eab3.8f6e08"]]},{"id":"fb20eab3.8f6e08","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"gotoHomePosition","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1760,"y":180,"wires":[["ef9555d.c18a2a8"]]},{"id":"5ad9fb27.cde234","type":"inject","z":"26dbe156.c7049e","name":"Set home position","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1530,"y":220,"wires":[["ca5af8d7.7d1858"]]},{"id":"ca5af8d7.7d1858","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"setHomePosition","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":1760,"y":220,"wires":[["ef9555d.c18a2a8"]]},{"id":"6f2a191d.95af58","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":2170,"y":180,"wires":[]},{"id":"ef9555d.c18a2a8","type":"onvif-ptz","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profile":"1_def_profile3","action":"","panSpeed":0,"tiltSpeed":0,"zoomSpeed":0,"panPosition":0,"tiltPosition":0,"zoomPosition":0,"panTranslation":0,"tiltTranslation":0,"zoomTranslation":0,"time":1,"preset":"","presetName":"","stopPanTilt":true,"stopZoom":true,"configurationToken":"","x":1978,"y":180,"wires":[["6f2a191d.95af58"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

### Pre-programmed positions
While a PTZ camera has only a single home position, it will also have multiple preset positions.  The number of preset positions available depends on the device manufacturer.

![PTZ preset](/images/onvif_ptz_preset.png)

```
[{"id":"3860ac52.e39594","type":"inject","z":"26dbe156.c7049e","name":"Get presets","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1790,"y":80,"wires":[["982f2ad5.2d9c08"]]},{"id":"982f2ad5.2d9c08","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getPresets","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":80,"wires":[["29cb85ae.8c89ca"]]},{"id":"f7f04caf.8744","type":"inject","z":"26dbe156.c7049e","name":"Set 'first' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1800,"y":120,"wires":[["945a0df7.765ea"]]},{"id":"945a0df7.765ea","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"setPreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"first","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":120,"wires":[["29cb85ae.8c89ca"]]},{"id":"414c78cd.e3c7c8","type":"inject","z":"26dbe156.c7049e","name":"Remove 'first' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1810,"y":200,"wires":[["677fe0f0.05929"]]},{"id":"677fe0f0.05929","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"removePreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"first","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":200,"wires":[["29cb85ae.8c89ca"]]},{"id":"7d1c3cb6.e252e4","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"gotoPreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"first","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":280,"wires":[["29cb85ae.8c89ca"]]},{"id":"cf9fb5ac.2929f8","type":"inject","z":"26dbe156.c7049e","name":"Goto 'first' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1800,"y":280,"wires":[["7d1c3cb6.e252e4"]]},{"id":"eabc7f84.63e97","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":2490,"y":80,"wires":[]},{"id":"29cb85ae.8c89ca","type":"onvif-ptz","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profile":"1_def_profile3","action":"","panSpeed":0,"tiltSpeed":0,"zoomSpeed":0,"panPosition":0,"tiltPosition":0,"zoomPosition":0,"panTranslation":0,"tiltTranslation":0,"zoomTranslation":0,"time":1,"preset":"","presetName":"","stopPanTilt":true,"stopZoom":true,"configurationToken":"","x":2298,"y":80,"wires":[["eabc7f84.63e97"]]},{"id":"c882fdef.c80fa","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"setPreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"second","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":160,"wires":[["29cb85ae.8c89ca"]]},{"id":"617bb836.79ada8","type":"inject","z":"26dbe156.c7049e","name":"Set 'second' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1810,"y":160,"wires":[["c882fdef.c80fa"]]},{"id":"96127480.40b808","type":"inject","z":"26dbe156.c7049e","name":"Remove 'second' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1820,"y":240,"wires":[["ce53fe72.a63f5"]]},{"id":"ce53fe72.a63f5","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"removePreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"second","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":240,"wires":[["29cb85ae.8c89ca"]]},{"id":"1897b282.93917d","type":"inject","z":"26dbe156.c7049e","name":"Goto 'second' preset","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1810,"y":320,"wires":[["53cde90a.bfcf48"]]},{"id":"53cde90a.bfcf48","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"gotoPreset","tot":"str"},{"t":"set","p":"presetName","pt":"msg","to":"second","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2060,"y":320,"wires":[["29cb85ae.8c89ca"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```

You could for example set a separate preset position for every of the 3 doors in your room. And afterwards the Node-RED flow could repeat looping over all 3 preset positions, so the camera would be repositioned in time. 

Remark: the Onvif protocol will generate a *token* to unique identify your preset position.  To avoid that every Node-RED flow needs to store all the tokens, this node will do the mapping between the tokens and the unique names (that you could choose yourself).

### Get PTZ information
A lot of information can be requested from the PTZ node:
+ Minimum and maximum pan/tilt positions.
+ Minimum and maximum zoom factors.
+ Number of available preset positions.
+ ...

![PTZ info](/images/onvif_ptz_info.png)

```
[{"id":"2d9d8551.c0018a","type":"inject","z":"26dbe156.c7049e","name":"Get nodes","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1800,"y":120,"wires":[["207254a6.890ccc"]]},{"id":"207254a6.890ccc","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getNodes","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2080,"y":120,"wires":[["eaa9238d.ffd3b"]]},{"id":"9aedef2e.69825","type":"inject","z":"26dbe156.c7049e","name":"Get configurations","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1830,"y":160,"wires":[["be886408.707d68"]]},{"id":"be886408.707d68","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getConfigurations","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2080,"y":160,"wires":[["eaa9238d.ffd3b"]]},{"id":"f6c561a5.4b2bd","type":"inject","z":"26dbe156.c7049e","name":"Get configuration options","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1850,"y":200,"wires":[["7ab75a66.7a4044"]]},{"id":"7ab75a66.7a4044","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getConfigurationOptions","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2080,"y":200,"wires":[["eaa9238d.ffd3b"]]},{"id":"9ba5ac30.13fde","type":"inject","z":"26dbe156.c7049e","name":"Get status","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1800,"y":240,"wires":[["e2a06007.832d6"]]},{"id":"e2a06007.832d6","type":"change","z":"26dbe156.c7049e","name":"","rules":[{"t":"set","p":"action","pt":"msg","to":"getStatus","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":2080,"y":240,"wires":[["eaa9238d.ffd3b"]]},{"id":"c4f1111f.4570a","type":"debug","z":"26dbe156.c7049e","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":2490,"y":120,"wires":[]},{"id":"eaa9238d.ffd3b","type":"onvif-ptz","z":"26dbe156.c7049e","name":"","deviceConfig":"e6c78b2e.fe4dc8","profile":"1_def_profile3","action":"","panSpeed":0,"tiltSpeed":0,"zoomSpeed":0,"panPosition":0,"tiltPosition":0,"zoomPosition":0,"panTranslation":0,"tiltTranslation":0,"zoomTranslation":0,"time":1,"preset":"","presetName":"","stopPanTilt":true,"stopZoom":true,"configurationToken":"","x":2298,"y":120,"wires":[["c4f1111f.4570a"]]},{"id":"e6c78b2e.fe4dc8","type":"onvif-config","z":"","xaddress":"192.168.1.200","name":"MyCamKitchen"}]
```
