/*
 * Create and export configuration variables.
 */

// General container for all environments.
const environments = {};

/*
 * The reason why we define 'envName', is that we are NOT exporting
 * the entire `environments` variable, but the sub part in the context,
 * therefore, `envName` is created to mark the actual enviornment used.
 */

twilio = {
    'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone': '+15005550006'
};

templateGlobals = {
    'appName':  'UptimeChecker',
    'companyName':  'NotARealCompany, Inc',
    'yearCreated':   '2018',
};


// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    twilio, // Here it's passed by reference.
    templateGlobals: {
        ...templateGlobals,
        'baseUrl': 'http://localhost:3000/'
    }
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 5,
    twilio, // Here it's passed by reference.
    templateGlobals: {
        ...templateGlobals,
        'baseUrl': 'http://localhost:5000/'
    }
};

// Determine which enviornment was passed as a command-line arg.
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check whether NODE_ENV is a valid setting.
// Default to staging if not valid.
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module.
module.exports = environmentToExport;
