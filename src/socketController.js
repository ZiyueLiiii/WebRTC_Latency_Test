
peers = {}


module.exports = (io) => {
    io.on('connect', (socket) => {
        console.log('a client is connected' + ' name : ' + socket.id)

        // Initiate the connection process as soon as the client connects

        peers[socket.id] = socket

        // Asking all other clients to setup the peer connection receiver
        for (let id in peers) {
            if (id === socket.id) continue // skip itself
            console.log(id + ' -sending init receive to- ' + socket.id)
            peers[id].emit('initReceive', socket.id)
        }


        /**
         * relay a peerconnection signal to a specific socket
         */
        socket.on('signal', data => {
            console.log('sending signal from ' + socket.id + ' to ', data)
            if (!peers[data.socket_id]) return
            //'signal' parameter is still 'undefined' in this line
            peers[data.socket_id].emit('signal', {
                socket_id: socket.id,
                signal: modifySDP(data)//modify codec in data.signal.sdp
            })

            /**
            * modify the sdp to change the default VP8 codec into H.264
            */
            function modifySDP(data) {
                //change the sdp for H.264 codec
                const sdp = data.signal.sdp

                if (sdp) {
                    //106 -> h264; 100 -> VP9; 96 -> VP8
                    // just change the value of 'aminedCodec' to change the codec in sdp
                    var aimedCodec = "106";
                    var mLineIndex = 0;
                    let lines = sdp.split('\n').map(l => l.trim());
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].indexOf('m=video') === 0) {
                            mLineIndex = i;
                            var elements = lines[i].split(' ');
                            // Just copy the first three parameters; codec order starts on fourth.
                            var newLine = elements.slice(0, 3);
                            // Put target payload first and copy in the rest.
                            newLine.push(aimedCodec);
                            for (var j = 3; j < elements.length; j++) {
                                if (elements[j] !== aimedCodec) {
                                    newLine.push(elements[j]);
                                }
                            }
                            console.log("index: " + mLineIndex + "new Line--> " + newLine.join(' '));
                            lines[mLineIndex] = newLine.join(' ');

                            break;
                        }
                    }
                    var newSDP = lines.join('\r\n');

                    //let modifier = 'AS';
                    //var bandwidth = '20'; //kbps
                    //if (newSDP.indexOf('b=' + modifier + ':') === -1) {
                        // insert b= after c= line.
                    //    newSDP = newSDP.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
                    //} //else {
                        //sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
                    //}
                    //console.log(newSDP);
                      
                }
                data.signal.sdp = newSDP;
                return data.signal
            }
        })

        /**
         * remove the disconnected peer connection from all other connected clients
         */
        socket.on('disconnect', () => {
            console.log('socket disconnected ' + socket.id)
            socket.broadcast.emit('removePeer', socket.id)
            delete peers[socket.id]
        })

        /**
         * Send message to client to initiate a connection
         * The sender has already setup a peer connection receiver
         */
        socket.on('initSend', init_socket_id => {
            console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
            peers[init_socket_id].emit('initSend', socket.id)
        })
    })
}