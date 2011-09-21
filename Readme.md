Sample E-Commerce App
---------------------

Highlights use of custom open graph to share purchases and coupon redemptions
back to your friends.

Buying a product generates a "purchased" story. If you enter in a working
coupon code, a "redeem" coupon story is also generated.

How to install
--------------

1. Goto https://developers.facebook.com/apps and create a new app.
2. Give your app a namespace, in this example we used "carshoppe" but it should be something different.
3. Create the app using the Heroku cloud service provider and select node.js
4. If you have not setup a Heroku account before, follow the instructions that Heroku will email you.
5. Verify that your Heroku auto-created sample app works.
6. Back in the configuration of your app, create two objects types "Car Part" and "Coupon".
7. Create an action type called "Purchase" that is connected to "Car Part".
8. Create an action type called "Redeem" that is connected to "Coupon".
9. Copy the files from this Shoppe sample app, and overwriting any files from the Heroku sample app.
10. Edit web.js and replace thw two instances of "carshoppe" with the namespace you chose in step 2.
11. Check in your code, and push the changes to Heroku.
12. Enjoy.
