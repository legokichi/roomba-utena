const SerialPort = require("serialport");
const express = require('express');
const expressWs = require('express-ws');

function plug(handler){
    return function _handler(req, res, next){
        handler(req, res).catch(next);
    };
}


async function main(){
    const ports = await SerialPort.list();
    const arduinoPorts = ports.filter((o)=> o.manufacturer === "Arduino (www.arduino.cc)");
    if (arduinoPorts.length < 1){
        throw new Error("arduino not found");
    }
    console.log(arduinoPorts[0]);
    const serial = new SerialPort(arduinoPorts[0].comName, {
        baudRate: 115200,
    });
    [
        "open",
        "error",
        "close",
        "data",
        "drain",
    ].forEach((ev)=>{ serial.on(ev, console.info.bind(console, "serial-"+ev)); });
    await new Promise((resolve, reject)=> serial.once('open', resolve));
    console.log(serial.isOpen);

    const app = express();
    const exws = expressWs(app);

    app.get('/camera', plug(async (req, res)=>{
        
    }));

    app.get('/', plug(async (req, res)=>{
        res.setHeader("content-type", "text/html");
        res.send(`<script>
async function main(){
    const ws = window.ws = new WebSocket("ws://"+location.host+"/");
    ws.binaryType = 'arraybuffer';
    ["open", "message", "error", "close"].forEach((ev)=>{ ws.addEventListener(ev, console.info.bind(console, ev)); });
    await new Promise((resolve)=>{ ws.addEventListener("open", resolve, {once: true}); });

    ws.send(new Uint8Array([
        128, // Start
        143, // Safe
    ]).buffer);

    await new Promise((resolve)=> setTimeout(resolve, 1000));

    ws.send(new Uint8Array([
        128, // Start
        131, // Safe
        140, // Song
        0, // Song Number
        1, // Song Length
        72, // Note Number
        8, // Duration
    ]).buffer);

    await new Promise((resolve)=> setTimeout(resolve, 1000));

    while(true){
        ws.send(new Uint8Array([
            128, // Start
            131, // Safe
            141, // Song
            0, // Song Number
        ]).buffer);
        await new Promise((resolve)=> setTimeout(resolve, 1000));
    }
}
main().catch(console.error);
</script>`);
        res.end();
    }));
    
    app.ws('/', (ws, req)=>{
        [
            "close",
            "open",
            "error",
            "ping",
            "pong",
            "unexpected-response",
            "upgrade",
            "message",
        ].forEach((ev)=>{ ws.on(ev, console.info.bind(console, "ws"+ev)); });
        ws.on('message', (msg)=>{
            serial.write(msg);
        });
        
    });

    serial.on("data", (buf)=>{
        exws.getWss().clients.forEach((ws)=>{
            ws.send(buf);
        });
    });

    app.listen(8080);
}

main().catch(console.error);
