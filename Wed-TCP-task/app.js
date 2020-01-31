var fs = require('fs');
var filePath = "./Num.txt";
var net = require('net');
var HOST = "127.0.0.1";
var PORT = "9999";
//telnet connection
var client = new net.Socket();
    client.connect(PORT, HOST);

    
    client.once('close', function() {
        console.log('Connection closed');
    });

    client.on('timeout', function() {
        console.log('connection timeout!')
        client.end("Bye Bye")
      })

    

    client.setEncoding('utf8');

//telnet command function

var execuComm = function(msisdn, response){
    var Count = 0001;
    var time = new Date().getTime();
var response = `${msisdn},Y,${Count},001,${time}`
       
var cmd =`SET:ZTEHLRSUB:MSISDN,${msisdn}:OBO,1:OBI,1:TS21,0:TS22,0:NAM,1;\n`;
var cmd1 = `SET:AIRTELSUB:NODELIST,ECMS:OPTYPE,TEMPBLOCK:SubscriberNumber,${msisdn}:TempBlockingStatus,SET;\n`
 client.write(cmd + `\n`+ cmd1 + `\n`,function(err, result){
if(err) throw err;
console.log(result)

 });
 client.write(`\n` +response + `\n`);  
 Count++;
}

// Read numbers from file and split it to an array of numbers
fs.readFile(`${filePath}`,'utf-8', (err, data)=>{
    if(err) throw err;
    var res1 = data.replace( /\r?\n/g," ").split(" ");
    //console.log(res1);

// pass the number to telnet server command
    for(i=0;i<res1.length;i++){
            var msisdn = res1[i];
            execuComm(msisdn);
            client.on('data', function(data) {
                console.log('Client received: ' + data);
                client.destroy();
            })
    }
})
// if(data.includes("001")){
//     fs.appendFile(`log.txt`, data, (err) => {
//         if(err) throw err;
//         console.log("Log saved  to log file!!")
//     });
// }