# MindMatch-kgp
![](public/images/favicon.ico)


## What is MindMatch
As the name suggests this application connects users with similar interests. <br>
This is particularly for student community so it matches them on basis of their (Academic Interests, Future Goals, Hobbies etc.)

## How to Run Locally
1. Assuming you have `node`, `npm` and `MongoDB` installed on your PC.
2. Now simply clone this repo <br>
   >`$ git clone https://github.com/akhilchoudhary2k/MindMatch-kgp.git`
3. Now in the same directory install all the dependencies <br>
   >`$ npm install`
4. Set the boolean flag `running_locally` to `true` in `app.js` <br>
   So that code picks-up the DB url and other stuff required for running the code locally. <br>
5. Run your mongoDB Local Server on default port 27017 <br> 
   >`$ mongod`
6. Create your local mongoDB database named `MindMatchDB`
   > `$ mongo` <br>
   > `> use MindMatchDB`
7. Run the repo code
   > `node app.js`
8. Now go to `http://localhost:3000/` and the app is ready to use.
