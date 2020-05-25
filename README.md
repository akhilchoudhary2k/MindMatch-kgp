# MindMatch-kgp
![](public/images/favicon.ico)


## What is MindMatch
As the name suggests this application connects users with similar interests. <br>
This is particularly for student community so it matches them on basis of their (Academic Interests, Future Goals, Hobbies etc.)

## How to Install
1. Assuming you have ```node``` and ```npm``` installed on your PC.
2. Now download this repository or simply clone it <br>
   >```git clone https://github.com/akhilchoudhary2k/MindMatch-kgp.git ```
3. Now in the same directory install all the dependencies <br>
   >```npm install```
4. As all the database connection keys and password hashing keys are saved inside .env file <br>
   So they are not visible in the code.
5. Therefore you need to define your own secret hashing key <br>
   In **app.js** **Line number23**  <br>
   >replace ```secret: process.env.SECRET_KEY,``` <br>
   >with    ```secret: <your custom key>,```
6. Now you have to create your local **mongoDB** database <br>
   First install mongoDB on your PC <br>
   Then in **app.js** 
   >comment out ```Line number 32``` and replace ```Line number33``` with ```Line number 31```
7. Now run your mongoDB Local Server
   using the command <br>
   >```mongod```
8. Now go to ```http://localhost:3000/``` and the app is ready to use.
