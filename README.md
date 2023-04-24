# WebRTC Video Conferencing with simple-peer
A simple video conferencing example using simple-peer.
This project allows multiple devices to connect with eachother with audio and video using webrtc.
The package [simple-peer](https://github.com/feross/simple-peer) is used for webrtc.
The implementation of the signaling server is done with [socket.io](https://socket.io/)

## Running

run `npm install` and then `npm start` in the main directory.

Then open the browser at `localhost:3012` or `[your network ip/ public dns]:3012`.



## Configuration

Configurations can be found in `app.js` and `public/js/main.js`.

Replace the ssl certificates `ssl/key.pem` and `ssl/cert.pem` with your own.

## cert or key problem

If your terminal throw errors on the: `ee key is too small`

Please go to \ssl folder and remove the key.pem and cert.pem

Then regenerate them by running `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`
