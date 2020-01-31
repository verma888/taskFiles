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
