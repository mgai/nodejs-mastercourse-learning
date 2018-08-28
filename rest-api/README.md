# Building a RESTful API.

## Requirements

* The API listens on a `PORT` and accepts incoming HTTP requests for `POST`, `GET`, `PUT`, `DELETE` and `HEAD`.
* The API allows a client to connect, and then -
  * `Create`, `Edit`/`Delete` a user.
* The API allows a user to `Sign in` which gives them a `token` that they can use for subsequent *authenticated* requests.
* The API allows a user to `Sign out` which *invalidates* their `token`.
* The APi allows a `signed-in` user to use their token to create a new `check`.
  * We can also allow users to `define` what does it mean by site `up` or `down` for checks.
* *Signed-in* user can `edit` or `delete` any of their checks.
  * Each user is entitled with up to **5** checks.
* In the background, `workers` perform all the `checks` at the appropriate times, and send `alerts` to the users when a check changes its `state` from `up` to `down`. or vise versa.

* *For SMS notification capacity, **Twilio** would be used.*


## Lesson learned and Notes.

`url` module provides methods to parse the url.

When processing data, `req` would emit two types of events - 

1. `data` event, ONLY IF there's payload.
2. `end` event, **ALWAYS** be emitted regardless of the existence of the payload.

By setting `Content-Type: application/json` with the `res.setHeader()` call, the client who understands JSON can now parse the return instead of treating it as raw string.

Use `typeof() == '...'` to check if the variable is set.

Leverage `process.env.NODE_ENV` for environment context setting.

`process.env` contains all the environment variables, as the name suggests.




## Create SSL certificate.
```bash
openssl req -newkey  rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
### Common name: refers to the host. : localhost
```

## Design notes

### Users

User `phone` must be **unique**, since we would be SMS user.
We will also store the users by their phone number, so that the FS tree would be `.data/user/{phonenumber}.json`

### Checks

Each `check` will be identified with the `createRandomString(20)` call as the ID, which you can see as the `UUID` way or the `ObjectId()` in the MongoDB.

> Here we store Check as an independent object hence it has its own folder in the FS. However in the `NoSQL` approach, since check is definitely a personal belongings to the user, I believe we can simply embed completely all the checks as cascaded JSON object, rather than keeping only the Primary Key within each other.


### Twilio Integration

For Twilio, payload has to be stringified via `querystring.stringify()`, which would do WWW form encode, instead of `JSON.stringify()`.

```javascript
> const qs = require('querystring');
undefined
> let toto = {
... 'From': 'Test',
... 'To': 'TestTo',
... 'Msg': 'Hello, sir!'
... };
undefined
> JSON.stringify(toto)
'{"From":"Test","To":"TestTo","Msg":"Hello, sir!"}'
> qs.stringify(toto)
'From=Test&To=TestTo&Msg=Hello%2C%20sir!'
>
```

#### HTTP and HTTPS

* They do not only start a http(s) server, but also they provide functions for communicating through these protocol.

* General flow would be -
  1. Define the request.
    ```javascript
          let requestDetails = {
              'protocol': 'https',
              'hstname': 'api.twilio.com',
              'method': 'POST',
              'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
              'auth': config.twilio.accountSid+':'+config.twilio.authToken,
              'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': Buffer.byteLength(stringPayload), // Buffer is globally available.
              }
          };
    ```
  2. Initiate the request through `https.request(requestDetails, callback)`
  3. Being a `stream`, general approach would be - 
    1. `req.on('error', handler)` to handle the error, a way of `try/catch`.
    2. `req.write()` to actually write out the request.
    3. `req.end()` will **send** the request out.

To ignore the self signed cert error - `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"`

#### Logging tips

```javascript
    // Send to console log in YELLOW.
    console.log('\x1b[33m%s]\x1b[0m', 'Background workers are running');
```

`NODE_DEBUG=module1,module2` would turn on the DEBUG info for many node modules. Use **Comma seperated format**.

We really do not need to rely sole only on `console.log`, as the proper way is to leverage the debug functionality.

```javascript
const util = require('util');
const debug = util.debuglog('workers'); // This would turn on DEBUG when NODE_DEBUG=workers

debug(...);   // Usage same as console.log
```

It would ouput -

```
WORKERS *PID*: ....
```
