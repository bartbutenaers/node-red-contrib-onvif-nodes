# node-red-contrib-onvif
Node Red nodes for communicating with OnVif compliant IP devices

**THIS IS AN EXPERIMENTAL NODE-RED CONTRIBUTION.  API WILL BE CHANGED SOON !!!**

## Usage


### Broadcast Node
When this node is triggered (by means of an input message), it will send an OnVif broadcast to all the devices on the network.  All OnVif compliant devices will respond to this, and listed in the output message `msg.payload`:

![Broadcast debug](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-onvif/master/images/onvif_broadcast_debug.png)

***TODO explanation of the message content***

When the checkbox *'Separate output message for each device'* is enabled, a separate output message will be generated for each OnVif compliant device.  When disabled a single output message will be generated, containing an array of all available OnVif devices.

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
