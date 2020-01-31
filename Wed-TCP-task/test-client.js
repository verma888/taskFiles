var Telnet = require('telnet-client')
var connection = new Telnet()
 
// these parameters are just examples and most probably won't work for your use-case.
var params = {
  host: '127.0.0.1',
  port: 23,
  //negotiationMandatory: false,
  timeout: 15000,
  removeEcho: 4
}
 
 connection.on('ready', function(prompt) {
   connection.exec(cmd, function(err, response) {
     console.log(response)
   })
 })
connection.connect(params)
connection.on('timeout', function() {
  console.log('socket timeout!')
  connection.end()
})
 
connection.on('close', function() {
  console.log('connection closed')
})
connection.on('data', function(data){
     var res = data.toString('utf8');
     console.log(res);
    connection.write("Is it working???")
})

connection.on('failedlogin', function() {
    console.log('Please provide login details!!!')
  })
