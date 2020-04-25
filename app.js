    //jshint esversion:6

    const express = require('express');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const md5 = require('md5');


    //setup server
    const app = express();
    app.set("view engine" , "ejs");
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.static("public"));   // to correctly send the images and css files

    // making a local database named mindmatchDB
    mongoose.connect( "mongodb://localhost:27017/MindMatchDB", { useNewUrlParser: true, useUnifiedTopology: true } );

    // making a schema for the user info
    const userSchema = new mongoose.Schema({
        name : String,
        email : String,
        password : String
    });

    // making a model of this userSchema which will represent a collection in MindMatchDB database
    const User = new mongoose.model("User", userSchema); // this will be cleverly converted to plural




    //get request to server
    app.get("/", function(req,res){
        //sending information from server side
        res.render("index", {});
        // res.sendFile(__dirname + "/index.html");
    });


    app.get("/login", function(req,res){
        res.render('login', {});
    });
    app.get("/register", function(req,res){
        res.render('register',{});
    });
    app.get("/adminlogin", function(req,res){
        res.render('admin-login',{});
    });


    app.get("/about", function(req,res){
        res.render('about',{});
    });
    app.get("/contact", function(req,res){
        console.log(req.body);
        res.render('contact',{});
    });

    app.post("/login",function(req,res){
        // console.log(req.body);
        const email = req.body.email;
        const password = md5(req.body.password);
        User.findOne({email:email}, function(err, foundUser){
            if(err){
                console.log(err);
            } else{
                if(foundUser){
                    if(foundUser.password === password){
                        res.render('UserHome', {user,foundUser});
                    }
                }

            }
        });
    });
    app.post("/register",function(req,res){
        // console.log(req.body);
        const newUser = new User({
            name : req.body.name,
            email: req.body.email,
            password: md5(req.body.password1)
        });
        newUser.save();
        res.locals.title = req.body.name+" 's HomePage";
        res.render('UserHome', {user: newUser});
    });
    app.post("/adminlogin",function(req,res){

    });


    //start listning (just to turn on the server)
    app.listen(process.env.PORT || 3000, function(){
        console.log("server started on port 3000");
    });
