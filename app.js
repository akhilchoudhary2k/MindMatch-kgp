    //jshint esversion:6

    const express = require('express');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');

    //setup server
    const app = express();
    app.set("view engine" , "ejs");
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.static("public"));   // to correctly send the images and css files

    // making a local database named mindmatchDB
    mongoose.connect( "mongodb://localhost:27017/MindMatchDB", { useNewUrlParser: true, useUnifiedTopology: true } );

    // making a schema for the user info
    const userSchema = new mongoose.Schema({
        nameOfUser : String,
        emailOfUser : String,
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
    app.get("/admin", function(req,res){
        res.render('admin-login',{});
    });
    app.get("/about", function(req,res){
        res.render('about',{});
    });
    app.get("/contact", function(req,res){
        res.render('contact',{});
    });


    //start listning (just to turn on the server)
    app.listen(process.env.PORT || 3000, function(){
        console.log("server started on port 3000");
    });
