# Homework Logbook

## Table of content

* [Homework 2](#Homework-Assignment-2)
* [Homework 3](#Homework-Assignment-3)
* [Homework 4](#Homework-Assignment-4)


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
4. [Place an order](#Checkout-process) \(with [fake credit card credentials](https://stripe.com/docs/testing#cards)\), and receive an email receipt.

### Before diving into coding

#### Signup on the site

The following needs to be created - 

* [ ] `Sign Up` Page, and then then `Update Profile` Page.
* [X] ~~*`Log On` would do `POST /api/tokens?` to create a token.*~~ [2018-10-22]
    * [ ] Need to support `/api/tokens?id` option.
* [X] ~~*`Log Out` would do `DELETE /api/tokens?` to delete the token with ID.*~~ [2018-10-22]

#### View all items

This is simply a front-end representation of the `GET /api/items`

By default, this page should be visible to public.

As such, we need to make sure the Meta data for SEO.

The link would be `http://localhost:3000/items` or `https://localhost:3001/items`

#### Shopping cart

Fill up a shopping cart requires an `Edit` page for the cart.

[ ] Review the server logic on the cart.

 * Where to add/delete cart for example.

#### Checkout process

* [X] ~~*`Checkout` button on the `Shopping cart` page to generate the order for checkout.*~~ [2018-10-22]
* [X] ~~*`Checkout Page` for payment and shipping address*~~ [2018-10-22]
* [X] ~~*`Email notification` upon success payment made.*~~ [2018-10-22]
* [X] ~~*`On screen` notification upon success payment made and email.*~~ [2018-10-22]

### Work log

Due to the holiday and daytime workload, this project was delayed for quite a long time unfortunately.

## Homework Assignment 4

### Requirement

To add the Admin CLI for the pizza-delivery app, which would allow the managers to perform the following - 

* View all the current menu items.
* View all the recent orders in the system (orders placed in the 24 hours)
* Lookup the details of a specfic order by order ID
* View all the users who have signed up in the last 24 hours.
* Lookup the details of a specific user by email address.

### Design - events

* [exit](#exit)
* [man/help](#man/help)
* [list items](#list-items)
* [list new orders](#list-new-orders)
* [more order info](#more-order-info)
* [list new uers](#list-new-users)
* [more user info](#more-user-info)

#### exit

```
exit
```

Exit command that would trigger the program to exit.

#### man/help

```
man
help
```

Show user manual for the CLI commands.

#### list items

```
list items
```

List all items available in the APP for order.

Basically - `console.dir(require('./all-items.json'), {'color': true})`

### list new orders

```
list new orders
```

By checking the `order.createdAt` attribute against `Date.now() - 1000 * 3600 * 24`.

### more order info

```
more order info --{userId/orderId}
```

Because in my current implementation, the `orders` are nested inside each `userId` folder, hence you need to provide the parameter in the form of `userId/orderId`, for the information to be displayed.

### list new users

```
list new users
```

By checking the `user.createdAt` attribute against `Date.now() - 1000 * 3600 * 24`.

### more user info

```
more order info --{userId}
```
