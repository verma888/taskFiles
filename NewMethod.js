var Telnet = require('telnet-client')
var connection = new Telnet();

var params = {
    host: '127.0.0.1',
    port: 1337,
    //shellPrompt: '/ # ',
    negotiationMandatory: false,
    timeout: 10000,
    // removeEcho: 4
  }
   
  connection.on('ready', function(data) {
    var msisdn = "9828098765";   
     var cmd = `SET:ZTEHLRSUB:MSISDN,${msisdn}:OBO,1:OBI,1:TS21,0:TS22,0:NAM,1;\n`;
    connection.exec(cmd, function(err, response) {
      console.log(response)
      })
  })
   
  connection.on('timeout', function() {
    console.log('socket timeout!')
    connection.end()
  })
 
connection.on('close', function() {
  console.log('connection closed')
})
 
connection.connect(params, ()=>{
    console.log("connected to server !");
    connection.write("Hello from client. ")
})
connection.shell(function (err, res){
  console.log(res);
  connection.write("Hiiiiiiiiiiiiiiii");
})