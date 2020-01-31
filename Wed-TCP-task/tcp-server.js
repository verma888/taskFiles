var net = require('net');
var fs = require("fs");
var PORT = 23;
var HOST = "127.0.0.1";
var server = net.createServer();
//connection 
server.on("connection", (socket)=>{

    var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;  
    console.log('new client connection from : '+ remoteAddress);
    
    socket.on("data", (data)=>{
       console.log("\n connection data from "+ remoteAddress + ": "+data+ `\n`);
        socket.write(`\n Response : 0` );
        socket.write(`\n`+ data);
    })
  

    socket.on("error", (error)=>{
        console.log("Error occured : "+error.message);
    })
    socket.once("close", ()=>{
        console.log("connection closed!");
    })
    socket.on("timeout", ()=>{
        console.log("connection is timed out!");
        socket.end();
    })
})
server.listen(PORT, HOST, ()=>{
    console.log(`server is up at port : ${PORT}`);
})