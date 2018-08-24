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
