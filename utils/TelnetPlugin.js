/**
 *  Telnet commands Telnet Plugin
 *
 *  @author devashish.kumar@comviva.com
 **/
const FileSystemPlugin = require("../fileSystemPlugin");
const message = require("message");
const error_codes = message.error_codes;
const CDRWriter = require("../../pluginCDRWriter");
const NotAllowedCommands = require("../notAllowedCommands");
const BPromise = require("bluebird");
const Telnet = require('telnet-client')
let schema;
/**
 * @class TelnetPlugin
 */
class TelnetPlugin extends FileSystemPlugin {

    init() {

    }

    /**
     * method getMetaDataInfo
     * @returns
     * @memberof TelnetPlugin
     */
    getMetaDataInfo() {
        return super.getMetaDataInfo(loadSchemaFile());
    }

    /**
     * method validate
     * @param {any} module
     * @returns
     * @memberof TelnetPlugin
     */
    validate(module) {
        loadSchemaFile();
        return super.validate(module, schema);
    }
    /**
     * method exec
     * @param {any} moduleContext
     * @returns
     * @memberof TelnetPlugin
     */
    async exec(moduleContext, options) {
        if (options && options.mode === "testConn") {
            return await testConn(moduleContext);
        }
        if (options && options.mode === "testCommand") {
            return await testMode(moduleContext, options);
        }
        return await execMode(moduleContext);
    }

    close() {

    }
}



/* loads the Telnet schema file (once and only once) and returns its schema */
function loadSchemaFile() {
    if (schema) {
        return schema;
    }
    schema = require("./TelnetSchema.json");
    return schema;
}

/*testing connectivity of telnet server*/
function testConn(moduleContext) {
    return new BPromise((resolve, reject) => {
        try {
            logger.trace("Module context is:" + JSON.stringify(moduleContext));
            if (!moduleContext.settings) {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.settingsNotFound));
            }
            let connection = new Telnet()
            connection.connect(moduleContext.settings)
            connection.on('ready', function () {
                connection.end();
                return resolve(message.getResponseJson(moduleContext.language, error_codes.success));
            })
            connection.on('error', function () {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.connectionFail))
            })
        } catch (error) {
            return reject(error);
        }
    });
}

/*testing response out of telnet server*/
function testMode(moduleContext, options) {
    return new BPromise(async (resolve, reject) => {
        try {
            if (!moduleContext.settings) {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.settingsNotFound));
            }

            if (!moduleContext.process.command) {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.commandNotFound));
            }
            let connection = new Telnet()
            connection.connect(moduleContext.settings)
            connection.on('ready', async function () {
                let result = await executeMultipleCommand(connection, moduleContext, options);
                return resolve(result);
            })
            connection.on('timeout', function () {
                connection.end()
                return resolve(message.getResponseJson(moduleContext.language, error_codes.serverTimeout));
            });
            connection.on('error', function () {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.connectionFail))
            })

        } catch (error) {
            return reject(error);
        }
    });
}

/*execute command and return response on simulation*/
function execMode(moduleContext, options) {
    return new BPromise(async resolve => {
        try {
            if (!moduleContext.settings) {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.settingsNotFound));
            }

            if (!moduleContext.process.command) {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.commandNotFound));
            }
            let connection = new Telnet()
            connection.connect(moduleContext.settings)
            connection.on('ready', async function () {
                let result = await executeMultipleCommand(connection, moduleContext, options);
                return resolve(result);
            })
            connection.on('timeout', function () {
                connection.end()
                return resolve(message.getResponseJson(moduleContext.language, error_codes.serverTimeout));
            });
            connection.on('error', function () {
                return resolve(message.getResponseJson(moduleContext.language, error_codes.connectionFail))
            })
        } catch (error) {
            global.logger.error(error);
            return resolve(message.getResponseJson(moduleContext.language, error_codes.pluginInternalError));
        }
    });
}

/*querying multiple commands one by one*/
function executeMultipleCommand(connection, moduleContext, options) {

    let TelnetCommands = moduleContext.process.command;
    return new BPromise((resolve, reject) => {
        try {
            let reqtime = new Date().getTime();
            let finalResult = {
                code: error_codes.success,
                resultsets: {}
            };
            //The Telnet statements will always ends with ";" while splitting it will give empty Query so removing the last ";"
            if (TelnetCommands.substr(TelnetCommands.length - 1) === ";") {
                TelnetCommands = TelnetCommands.slice(0, -1);
            }
            let index = 1;
            moduleContext.settings.shellPrompt = moduleContext.settings.shellPrompt + ' ';
            //Splitting the multiple Telnet statements into single and executing
            BPromise.reduce(TelnetCommands.split(";"), async (finalResult1, TelnetCommand) => {
                let flag = true;
                flag = await isNotAllowedCommand(TelnetCommand)
                let key = "result" + index;
                index++;

                if (!flag) {
                    finalResult.resultsets[key] = message.getResponseJson(moduleContext.language, error_codes.notAllowed);

                    //Logging plugin response to CDR
                    CDRWriter.emit("EXEC_CDR", moduleContext.appId, moduleContext.mid, moduleContext.pluginName, new Date().getTime() - reqtime, finalResult.resultsets[key].code, TelnetCommand, finalResult.resultsets[key].msg);
                } else {
                    try {
                        finalResult.resultsets[key] = await executeCommand(moduleContext, connection, TelnetCommand, moduleContext.settings.maxRetry || 1, moduleContext.settings.retryInterval || 3000);

                        //Logging plugin response to CDR
                        //Successfull CDR file Logging
                        if (finalResult.resultsets[key].code === 0)
                            CDRWriter.emit("EXEC_CDR", moduleContext.appId, moduleContext.mid, moduleContext.pluginName, new Date().getTime() - reqtime, finalResult.resultsets[key].code, TelnetCommand);

                        //Unsuccessfull CDR file Logging
                        else if (finalResult.resultsets[key].code != 0)
                            CDRWriter.emit("EXEC_CDR", moduleContext.appId, moduleContext.mid, moduleContext.pluginName, new Date().getTime() - reqtime, finalResult.resultsets[key].code, TelnetCommand, finalResult.resultsets[key].msg);

                    } catch (error) {
                        finalResult.resultsets[key] = message.getResponseJson(moduleContext.language, error_codes.serverError);

                        //Logging plugin response to CDR
                        CDRWriter.emit("EXEC_CDR", moduleContext.appId, moduleContext.mid, moduleContext.pluginName, new Date().getTime() - reqtime, finalResult.resultsets[key].code, TelnetCommand, finalResult.resultsets[key].msg);
                    }
                    return finalResult.resultsets[key];
                }
            }, finalResult)
                .then((finalResult1) => {
                    return resolve(finalResult);
                });
        } catch (error) {
            reject(error);
        }
    });
}

/*executing individual command and return response*/
function executeCommand(moduleContext, connection, TelnetCommand, retries, retryInterval) {

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
                return resolve(message.getResponseJson(moduleContext.language, error_codes.serverClosed));
            });
        } catch (error) {
            reject(error)
        }
    });
}

/*hold process for millis milli second(s)*/
function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

/*checking if command is allowed or not and return boolean*/
function isNotAllowedCommand(TelnetCommand) {
    let flag = true;
    NotAllowedCommands.forEach(expression => {
        let expr = new RegExp(expression);
        if (TelnetCommand.match(expr)) {
            flag = false;
            return;
        }
    });
    return flag;
}

function getFinalResult(data, TelnetCommand, moduleContext) {
    res = data.toString('utf8');
    if (res.startsWith(TelnetCommand)) {
        if (!TelnetCommand.startsWith("cd"))
            res = res.replace(TelnetCommand, "")
    }
    if ((res.includes(moduleContext.settings.shellPrompt) || res.includes(moduleContext.settings.loginPrompt) || res.includes(moduleContext.settings.passwordPrompt) || res.includes(moduleContext.settings.EMATelnetPromptScreen)) && !TelnetCommand.startsWith("cd")) {
        res = res.replace(/\r?\n?[^\r\n]*$/, "");
    }
    return res;
}
module.exports = TelnetPlugin;
