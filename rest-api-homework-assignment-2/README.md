# Homework Assignment 2

## Requirements

To build the **API** for a _pizza-delivery company_, where the spec from the manager. ([Original Spec](https://pirple.thinkific.com/courses/take/the-nodejs-master-class/texts/4342291-homework-assignment-2))

## Design

### User

A `user` has following information -

```javascript
let user = {
    'id': String,   // Unique ID for user identification., hashed email address.
    'name': String,
    'email': String,
    'address': String,
    'hashedPassword': String
}
```

A `user` could perform `Log In` and `Log Out` by means of `Token`.

* `Log In` would `create` a `Token` with `POST /tokens`
* `Log Out` would `delete` a `Token` with `DELETE /tokens?id`

Once logged in, the `user` could:

* retrieve the full menu items via `GET /items`
* fill a `cart` with `items` via `POST /carts`
* place an `order` via `POST /orders` with integration of [Stripe.com Sandbox](https://stripe.com/docs/testing#cards)

Once order is placed, `receipt` will be sent to the user via email, with integrationof [Mailgun.com sandbox](https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account)

### Token

For user log in and log out, defined as - 

```javascript
let token = {
    'id': String, // Unique ID.
    'userId': String, // Linked with User.
    'expires': Date.now() + 1000 * 3600, // Valid for one hour.
}
```

Logged in user would always present the granted token in the `req.headers`

> _This part would largely borrow from the course code for token_

### Menu Item

For simplicity, menu items are hardcoded in `items.json`

### Shopping Cart

#### Design choice

* Each user would have one shopping cart.
* The cart can only be modified by a user logged in, _i.e. with valid token presented._
* Shopping cart will be `clear()` once order is placed successfully.

The shopping card is defined as below -

```javascript
const cart = {
    'userId': String, // Implcitly as cartId.
    'items' [{ 'itemId': String, 'quantity': Number}, ...]
}
```

### Order

An order will be persisted in the system with the following information -

```javascript
let order = {
    'id': String, // Unique ID.
    'userId': String,
    'items': [{itemId, quantity}],
    'paid': Boolean, // true after success payment received.
}
```

### Receipt

Once `order` payment is done successfully, ordered items would be sent to the user via email with total cost.
