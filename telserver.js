var net = require('net');
var HOST = "127.0.0.1";
var PORT = "1337"
var server = net.createServer();
server.on("connection", handleConnection);
server.listen(PORT,HOST, ()=>{
  console.log('server listening to %j', server.address());  
});

function handleConnection(conn) {    
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;  
  console.log('new client connection from %s', remoteAddress);
  conn.on('data', onConnData);  
  conn.once('close', onConnClose);  
  conn.on('error', onConnError);
  function onConnData(d) {  
    console.log('connection data from %s: %j', remoteAddress, d);  
    conn.write("Response : 0");  
  }
  function onConnClose() {  
    console.log('connection from %s closed', remoteAddress);  
  }
  function onConnError(err) {  
    console.log('Connection %s error: %s', remoteAddress, err.message);  
  }  
}
