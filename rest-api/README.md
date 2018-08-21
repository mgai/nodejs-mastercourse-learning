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
