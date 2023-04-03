const { WaveFile } = require("wavefile");
const fs = require("fs");
const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });
const path = require("path");

wss.on("connection", function connection(ws) {
  console.log("New Connection Initiated");

  var inbound_samples = [];
  var outbound_samples = [];

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);

    switch (msg.event) {
      case "connected":
        console.log("A new call was connected");
        break;
        
      case "start":
        console.log("Media Stream Started", msg);
        break;

      case "media":
        var signalwireData = msg.media.payload;
        let signalwireAudioOnly = Buffer.from(signalwireData, "base64");

        if (msg.media.track === "inbound") {
          for (let i = 0; i < signalwireAudioOnly.length; i++) {
            inbound_samples.push(signalwireAudioOnly[i]);
          }
        }

        if (msg.media.track === "outbound") {
          for (let i = 0; i < signalwireAudioOnly.length; i++) {
            outbound_samples.push(signalwireAudioOnly[i]);
          }
        }
        break;

      case "stop":
        console.log(`Call Has Ended, Creating WAV file`);

        let wavForLocal = new WaveFile();

        wavForLocal.fromScratch(2, 8000, "8m", [
            inbound_samples,
            outbound_samples
        ]);

        fs.writeFileSync("call.wav", wavForLocal.toBuffer());
        break;
    }
  });
});

console.log("Listening on Port 3000");
server.listen(3000);