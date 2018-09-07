# Homework Logbook

## Table of content

* [Homework 2](#Homework-Assignment-2)
* [Homework 3](#Homework-Assignment-3)


## Homework Assignment 2

### Requirements

To build the **API** for a _pizza-delivery company_, where the spec from the manager. ([Original Spec](https://pirple.thinkific.com/courses/take/the-nodejs-master-class/texts/4342291-homework-assignment-2))

### Design

#### User

A `user` has following information -

```javascript
let user = {
    'id': String,   // md5 hash of email for data file name.
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

By definition of `logged In`, the following information should be present in the API call request - 

1. `token` in the `header`, which contains the `token ID`.
2. `email` in the `request query string`, which contains the `user email`, which then is used to compute the `user ID`.

Once order is placed, `receipt` will be sent to the user via email, with integrationof [Mailgun.com sandbox](https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account)

#### Token

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

#### Menu Item

For simplicity, menu items are hardcoded in `all-items.json`

#### Shopping Cart

##### Design choice

* Each user would have one shopping cart.
* The cart can only be modified by a user logged in, _i.e. with valid token presented._
* Shopping cart will be `clear()` once order is placed successfully.

The shopping card is defined as below -

```javascript
const cart = {
    'userId': String, // Implcitly as cartId, used for the file naming.
    'items' [{ 'itemId': String, 'quantity': Number}, ...]
}
```

#### Order

An order will be persisted in the system with the following information -

```javascript
let order = {
    'id': String, // Unique ID.
    'userId': String,
    'items': [{itemId, quantity}],
    'paid': Boolean, // true after success payment received.
}
```

#### Receipt

Once `order` payment is done successfully, ordered items would be sent to the user via email with total cost.

## Homework Assignment 3
_Client side dev for the Pizza API_

To build the simple front-end for the Pizza API from the Homework-2. ([Original Spec](https://pirple.thinkific.com/courses/take/the-nodejs-master-class/texts/4342329-homework-assignment-3))

1. [Signup on the site](#Signup-on-the-site)
2. [View all the items available to order](#view-all-items)
3. [Fill up a shopping cart](#shopping-cart)
4. [Place an order](#Checkout-process) (with [fake credit card credentials](https://stripe.com/docs/testing#cards)), and receive an email receipt.

### Before diving into coding

#### Signup on the site

The following needs to be created - 

* [ ] `Sign Up` Page, and then then `Update Profile` Page.
* [ ] `Log On` would do `POST /api/tokens?` to create a token.
    * [ ] **Technical Debt** Need to support `/api/tokens?id` option.
* [ ] `Log Out` would do `DELETE /api/tokens?` to delete the token with ID.

#### View all items

This is simply a front-end representation of the `GET /api/items`

It's a protected page available to LoggedOn user only.

#### Shopping cart

Fill up a shopping cart requires an `Edit` page for the cart.

[ ] Review the server logic on the cart.

 * Where to add/delete cart for example.

#### Checkout process

* [ ] `Checkout` button on the `Shopping cart` page to generate the order for checkout.
* [ ] `Checkout Page` for payment and shipping address
* [ ] `Email notification` upon success payment made.
* [ ] `On screen` notification upon success payment made and email.

### Work log