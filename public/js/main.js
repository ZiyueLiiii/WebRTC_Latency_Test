/**
 * Socket.io socket
 */
let socket;
/**
 * The stream object used to send media
 */
let localStream = null;
/**
 * All peer connections
 */
let peers = {}

// redirect if not https
if (location.href.substr(0, 5) !== 'https')
    location.href = 'https' + location.href.substr(4, location.href.length - 4)


//////////// CONFIGURATION //////////////////

/**
 * RTCPeerConnection configuration 
 */

const configuration = {
    // Using From https://www.metered.ca/tools/openrelay/
    "iceServers": [{
            urls: "stun:openrelay.metered.ca:80"
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
}

/**
 * UserMedia constraints
 */
let constraints = {
    audio: true,
    video: {
        width: {
            max: 300
        },
        height: {
            max: 300
        }
    }
}

/////////////////////////////////////////////////////////

constraints.video.facingMode = {
    ideal: "user"
}

// enabling the camera at startup
navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    console.log('Received local stream');

    localVideo.srcObject = stream;
    localStream = stream;

    init()

}).catch(e => alert(`getusermedia error ${e.name}`))

/**
 * initialize the socket connections
 */
function init() {
    socket = io()

    socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id)
        addPeer(socket_id, false)

        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', () => {
        console.log('GOT DISCONNECTED')
        for (let socket_id in peers) {
            removePeer(socket_id)
        }
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })
}

/**
 * Remove a peer with given socket_id. 
 * Removes the video element and deletes the connection
 * @param {String} socket_id 
 */
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id)
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentNode.removeChild(videoEl)
    }
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id 
 *                 ID of the peer
 * @param {Boolean} am_initiator 
 *                  Set to true if the peer initiates the connection process.
 *                  Set to false if the peer receives the connection. 
 */
function addPeer(socket_id, am_initiator) {

    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
    })
    

    peers[socket_id].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        })
    })

    peers[socket_id].on('stream', stream => {
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.playsinline = false
        newVid.autoplay = true
        newVid.className = "vid"
        newVid.onclick = () => openPictureMode(newVid)
        newVid.ontouchstart = (e) => openPictureMode(newVid)
        videos.appendChild(newVid)
    })

    getStats(peers[socket_id]._pc, function(result) { //this is only the local pc id
        console.log(result)
        console.log(JSON.stringify({video:result.video,audio:result.audio}))
        console.log({video:result.video,audio:result.audio})
        const el = {video:result.video,audio:result.audio}
        const old = document.getElementById(socket_id)
        if (old){
            old.parentNode.removeChild(old)
        }

        var time = new Date();
        var videolatency = el.video.latency;
        document.getElementById("time").innerHTML = time.toLocaleTimeString();
        document.getElementById("videoLatency").innerHTML = videolatency;

        const div = document.createElement('div')
        div.setAttribute('id', socket_id)
        div.innerHTML = `
        <h2>This device: \n socket_id[${socket_id}]</h2>
        <table>
        <thead>
        <tr>
            <th>Parameters</th>
            <th>Value</th>
            <!-- 添加更多列标题 -->
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>time</td>
                <td>${(new Date()).toLocaleTimeString()}</td>
            </tr>
            <tr>
                <td>audio.bytesReceived</td>
                <td>${el.audio.bytesReceived}</td>
            </tr>
            <tr>
                <td>audio.bytesSent</td>
                <td>${el.audio.bytesSent}</td>
            </tr>
            <tr>
                <td>video.latency</td>
                <td>${el.video.latency}</td>
            </tr>
            <tr>
                <td>audio.latency</td>
                <td>${el.audio.latency}</td>
            </tr>
            <tr>
                <td>audio.packetsLost</td>
                <td>${el.audio.packetsLost}</td>
            </tr>
            <tr>
                <td>audio.recv.codecs</td>
                <td>${el.audio.recv.codecs}</td>
            </tr>
            <tr>
                <td>audio.send.codecs</td>
                <td>${el.audio.send.codecs}</td>
            </tr>
            <tr>
                <td>video.bytesReceived</td>
                <td>${el.video.bytesReceived}</td>
            </tr>
            <tr>
                <td>total Received</td>
                <td>${el.video.bytesReceived+el.audio.bytesReceived}</td>
            </tr>
            <tr>
                <td>total Sent</td>
                <td>${el.video.bytesSent+el.audio.bytesSent}</td>
            </tr>
            <tr>
                <td>video.bytesSent</td>
                <td>${el.video.bytesSent}</td>
            </tr>
            <tr>
                <td>video.packetsLost</td>
                <td>${el.video.packetsLost}</td>
            </tr>
            <tr>
                <td>video.recv.codecs</td>
                <td>${el.video.recv.codecs}</td>
            </tr>
            <tr>
                <td>video.send.codecs</td>
                <td>${el.video.send.codecs}</td>
            </tr>
            <tr>
                <td>encryption</td>
                <td>${result.encryption}</td>
            </tr>
            <tr>
                <td>local.ipAddress</td>
                <td>${result.connectionType.local.ipAddress}</td>
            </tr>
            <tr>
                <td>remote.ipAddress</td>
                <td>${result.connectionType.remote.ipAddress}</td>
            </tr>
            <tr>
                <td>bandwidth.speed</td>
                <td>${result.bandwidth.speed}</td>
            </tr>
            <tr>
                <td>resolutions.recv</td>
                <td>width:${result.resolutions.recv.width} height:${result.resolutions.recv.height}</td>
            </tr>
        </tbody>
        </table>

        `
        //append the div in html to show getStats results
        document.body.appendChild(div)
        
        // to access native "results" array
        result.results.forEach(function(item) {
            if (item.type === 'ssrc' && item.transportId === 'Channel-audio-1') {
                var packetsLost = item.packetsLost;
                var packetsSent = item.packetsSent;
                var audioInputLevel = item.audioInputLevel;
                var trackId = item.googTrackId; // media stream track id
                var isAudio = item.mediaType === 'audio'; // audio or video
                var isSending = item.id.indexOf('_send') !== -1; // sender or receiver
                console.log(item)
                console.log('SendRecv type', item.id.split('_send').pop());
                console.log('MediaStream track type', item.mediaType);
            }
        });

        div.onclick = () => openPictureMode(div)
        div.ontouchstart = (e) => openPictureMode(div)

    }, 1000);
    
    }
    

/**
 * Opens an element in Picture-in-Picture mode
 * @param {HTMLVideoElement} el video element to put in pip mode
 */
function openPictureMode(el) {
    console.log('opening pip')
    el.requestPictureInPicture()
}

/**
 * Switches the camera between user and environment. It will just enable the camera.
 */
function switchMedia() {
    if (constraints.video.facingMode.ideal === 'user') {
        constraints.video.facingMode.ideal = 'environment'
    } else {
        constraints.video.facingMode.ideal = 'user'
    }

    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
        track.stop()
    })

    localVideo.srcObject = null
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {

        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }
        }

        localStream = stream
        localVideo.srcObject = stream

        updateButtons()
    })
}

/**
 * Enable screen share
 */
function setScreen() {
    navigator.mediaDevices.getDisplayMedia().then(stream => {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }

        }
        localStream = stream

        localVideo.srcObject = localStream
        socket.emit('removeUpdatePeer', '')
    })
    updateButtons()
}

/**
 * Disables and removes the local stream and all the connections to other peers.
 */
function removeLocalStream() {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        localVideo.srcObject = null
    }

    for (let socket_id in peers) {
        removePeer(socket_id)
    }
}

/**
 * Enable/disable microphone
 */
function toggleMute() {
    for (let index in localStream.getAudioTracks()) {
        localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
    }
}
/**
 * Enable/disable video
 */
function toggleVid() {
    for (let index in localStream.getVideoTracks()) {
        localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
    }
}

/**
 * updating text of buttons
 */
function updateButtons() {
    for (let index in localStream.getVideoTracks()) {
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
    }
    for (let index in localStream.getAudioTracks()) {
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
    }
}