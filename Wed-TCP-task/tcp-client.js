var Telnet = require('telnet-client')
var fs = require('fs');

var connection = new Telnet()
 
var params = {
  host: '127.0.0.1',
  port: 23,
  //shellPrompt: '/ # ', // or negotiationMandatory: false
  timeout: 1500,
  // removeEcho: 4
}
var msisdn = '9828094587';
var TelnetCommand =`SET:ZTEHLRSUB:MSISDN,${msisdn}:OBO,1:OBI,1:TS21,0:TS22,0:NAM,1;\n`;

// Request = `SET:AIRTELSUB:NODELIST,ECMS:OPTYPE,TEMPBLOCK:SubscriberNumber,${msisdn}:TempBlockingStatus,SET;\n`
/*Response = {
   msisdn, SIM_block_status, transaction_id, response_code, timestamp) 
}*/
    connection.connect(params);
    connection.on('ready', async function () {
        let result = await executeCommand(connection, params, options);
        return resolve(result);
    })
    connection.on('timeout', function () {
        connection.end()
        console.log("connection timed out!")
    });
    connection.on('error', function (err) {
        ("connection error : "+ err.message);
    })

    function executeCommand(params, connection, TelnetCommand) {

        return new BPromise(async (resolve, reject) => {
            try {
                let count = 1;
                let resp = "";
                connection.shell(async function (err, stream) {
                    if (err) {
                        throw err;
                    }
                    try {
                        stream.end(TelnetCommand + "\n");
                        stream.on('close', function () {
                            connection.end();
                        }).on('data', function (data) {
                            if (count >= 3) {
                                resp = resp + getFinalResult(data, TelnetCommand, moduleContext);
                                /*matching substring upto directory name in order to avoid empty output*/
                                if (data.toString().includes(moduleContext.settings.shellPrompt) || data.toString().includes(moduleContext.settings.loginPrompt) || data.toString().includes(moduleContext.settings.passwordPrompt) || data.toString().includes(moduleContext.settings.EMATelnetPromptScreen)) {
                                    resolve({
                                        code: error_codes.success,
                                        result: resp
                                    });
                                }
                            }
                            count++;
                        });
                    }
                    catch (error) {
                        if (retries > 1) {
                            await sleep(retryInterval);
                            return resolve(await executeCommand(moduleContext, connection, TelnetCommand, retries - 1));
                        } else {
                            let msgObj = message.getResponseJson(moduleContext.language, error_codes.serverError);
                            resolve(msgObj);
                        }
                    }
                });
                connection.on('close', function () {
                    return resolve(console.log("connection closed!"));
                });
            } catch (error) {
                reject(error)
            }
        });
    }