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

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 5
};

// Determine which enviornment was passed as a command-line arg.
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check whether NODE_ENV is a valid setting.
// Default to staging if not valid.
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module.
module.exports = environmentToExport;
