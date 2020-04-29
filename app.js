    //jshint esversion:6

    require('dotenv').config();
    const express = require('express');
    const ejs = require('ejs');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const session = require('express-session');
    const passport = require("passport");
    const passportLocalMongoose = require('passport-local-mongoose');
    const _ = require('lodash');

    //setup server
    const app = express();

    app.set("view engine" , "ejs");
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.static("public"));   // to correctly send the images and css files

    app.use(session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // making a local database named mindmatchDB
    mongoose.connect( "mongodb://localhost:27017/MindMatchDB", { useNewUrlParser: true, useUnifiedTopology: true } );
    // mongoose.set("useCreateIndex", true);

    const messageSchema = {
            sender: String,
            reciever: String,
            read: Boolean,
            messages: [ {who: String, value: String} ]
    };

    // making a schema for the user info
    const userSchema =  mongoose.Schema({

        chat: [ messageSchema ],

        hasFilledTheForm: Boolean,
        isAdmin: Boolean,

        username : String,
        fname: String,
        lname: String,
        email : String,
        password : String,
        registered: { type: Date, default: Date.now },
        age: Number,
        gender: String,
        department: String,
        cgpa: Number,
        hometown: String,
        coaching: String,
        fromkota: String,   // instead of boolean use Yes, No
        eaa: String,
        sportsvalue: Number,
        techvalue: Number,
        socultvalue: Number,
        socities: [String], // array of strings
        hobbies: [String],  // array of strings
        favouritesubject: String, //out of PCM
        programmingexperiancevalue: Number,
        projectsinterestvalue: Number,
        projectsinterestorder: [String],
        futureorientationorder: [String], //order of these            research	finance    	cp/algo	   software/opensoft
        depcinterest: String,
        researchgroupinterest: String,
        introextrovert: String,
        moneyorpeace: String,
        competitiveexamsorder: [String], // ICPC, GRE, CAT, NDA

        todisplay: [String]
    });
    userSchema.plugin(passportLocalMongoose);

    // making a model of this userSchema which will represent a collection in MindMatchDB database
    const User = new mongoose.model("User", userSchema); // this will be cleverly converted to plural

    passport.use(User.createStrategy());
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());


    //get request to server
    app.get("/", function(req,res){
        //sending information from server side
        res.render("index", {});
    });
    app.get("/login", function(req,res){
        var message ="";
        res.render('login', {message : message});
    });
    app.get("/register", function(req,res){
        var message ="";
        res.render('register',{message : message});
    });
    app.get("/adminlogin", function(req,res){
        res.render('admin-login',{});
    });


    app.get("/about", function(req,res){
        res.render('about',{});
    });
    app.get("/contact", function(req,res){
        res.render('contact',{});
    });
    app.get("/help", function(req,res){
        res.send("Will make it");
    });

    app.get("/logout", function(req,res){
        req.logout();
        res.redirect("/");
    });

    app.get("/AdminHome", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render("AdminHome");
        } else{
            res.redirect('/adminlogin');
        }
    });

    app.post("/login",function(req,res){
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        User.findOne({username: req.body.username}, function(err,found){
            if(!found){
                var message = "No such username exists";
                res.render('login', {message: message});
            }else{
                // console.log(req.body);
                req.login(user, function(err){
                    if(err){
                        console.log(err);
                    } else{
                        passport.authenticate("local")(req,res,function(){
                            if(req.body.username==='admin') res.redirect("/AdminHome");
                            else res.redirect("/UserHome" );
                        });
                    }
                });

            }
        });
    });

    app.get("/UserHome",function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render('UserHome',{user : req.user});
        } else{
            res.redirect('/login');
        }
    });

    app.post("/register",function(req,res){
        // console.log(req.body);

        if(req.body.password != req.body.password2 ){
            var message="Passwords do not match";
            res.render('register', {message: message});
        }
        else{
            User.register( {username:req.body.username} , req.body.password , function(err,user){
                if(err){
                    console.log(err.message);
                    var message = err.message;
                    res.render("register", {message: message});
                } else{
                    // console.log(req.body);
                    User.updateOne( {_id:user._id},  {email: req.body.email, fname:req.body.name, isAdmin:false}  , function(err){
                        if(err) console.log(err);
                    } );
                    passport.authenticate("local")(req,res,function(){
                        res.redirect("/UserHome");
                    });
                }
            });
        }
    });

    app.post("/adminlogin",function(req,res){

    });



    // routes when the user is logged in

    app.get("/chat/:reciever", function(req,res){
        if(req.isAuthenticated()){
            console.log("GET req. from:" + req.user.username + " to:" + req.params.reciever);
            res.locals.username = req.user.username ; // just to put username in the navbar
            var sender = req.user.username;
            var reciever = req.params.reciever;
            var array = [];
            console.log(req.user.chat.length);
            for(var i=0;i<req.user.chat.length;i++){
                if(req.user.chat[i].sender == reciever || req.user.chat[i].reciever == reciever ){
                    array = req.user.chat[i].messages;
                }
            }
            console.log(array);
            res.render('chat', {sender: sender, reciever: reciever, messages: array});
        }else{
            res.redirect('/login');
        }
    });

    app.post("/chat/:reciever", function(req,res){
        if(req.isAuthenticated()){
            var array = [];
            console.log("POST req. from:" + req.user.username + " to:" + req.params.reciever);
            res.locals.username = req.user.username ; // just to put username in the navbar

            //save in reciever's database
            User.findOne({username: req.params.reciever}, function(err, found){
                if(!found) console.log("error in finding the user");
                else{
                    console.log("updating in "+ req.params.reciever + "'s database");
                    var chatArray = found.chat;
                    var temp = -1; // to store the chat array element
                    var ind  = -1;

                    for(var i=0; i<chatArray.length; i++){
                        if( chatArray[i]!=null && (chatArray[i].sender == req.user.username || chatArray[i].reciever == req.user.username ) ){
                            temp = chatArray[i];
                            ind = i;
                            break;
                        }
                    }

                    // no previous chat
                    if(temp == -1) {
                        console.log(" no previous chat");
                        var m = {who: req.user.username, value: req.body.newMessage};
                        var messageArray = [];
                        messageArray.push(m);
                        var obj = {sender: req.user.username, reciever: req.params.reciever, read:false ,messages: messageArray };
                        found.chat.unshift(obj);
                        found.save();
                        console.log("successfully saved in reciever's database");
                    } else{
                    // found previous chat
                    console.log("found previous chat");

                        var m2 = {who: req.user.username, value: req.body.newMessage};
                        found.chat[ind].messages.push(m2);

                        var currentChatObject = found.chat[ind];
                        // delete found.chat[ind];
                        found.chat.splice(ind, 1);
                        found.chat.unshift( currentChatObject );
                        found.save();
                        console.log("successfully saved in reciever's database");
                    }
                }
            });

            //save in sender's database
            User.findOne({username: req.user.username}, function(err, found){

                var temp = -1; // to store the chat array element
                var ind  = -1;
                console.log("updating in " + req.user.username + "'s database");
                for(var i=0; i<found.chat.length; i++){
                    if(  found.chat[i]!=null && (found.chat[i].reciever == req.params.reciever || found.chat[i].sender == req.params.reciever ) ){
                        temp = found.chat[i];
                        ind = i;
                        break;
                    }
                }

                //not found i.e. sender is first time sending the message to reciever
                if(ind==-1){
                    console.log(" no previous chat");
                    var m = {who: req.user.username , value: req.body.newMessage};
                    var messageArray = [];
                    messageArray.push(m);
                    var obj = {sender: req.user.username, reciever: req.params.reciever, read:true ,messages: messageArray };
                    found.chat.unshift(obj);
                    array = messageArray;
                    found.save( function(err){
                        console.log("successfully saved in sender's database");
                        res.render('chat', {sender: req.user.username, reciever: req.params.reciever, messages: array });
                    } );


                }
                else{
                // found i.e. sender has already chatted with reciever
                    console.log("found previous chat");
                    var m2 = {who: req.user.username, value: req.body.newMessage};
                    found.chat[ind].messages.push(m2);

                    var currentChatObject = found.chat[ind];
                    array = currentChatObject.messages;
                    // delete found.chat[ind];
                    found.chat.splice(ind, 1);
                    found.chat.unshift( currentChatObject );
                    found.save( function(err){
                        console.log("successfully saved in sender's database");
                        res.render('chat', {sender: req.user.username, reciever: req.params.reciever, messages: array });
                    } );
                }
            });

            // res.render('chat', {sender: req.user.username, reciever: req.params.reciever, messages: array });
        }else{
            res.redirect('/login');
        }
    });

    app.get("/profile/:userName", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ; // just to put username in the navbar
            // req.user -> who made this get request
            // req.params.userName -> whose profile should be displayed

            User.findOne( {username: req.params.userName}, function(err,foundUser){
                if(err) console.log(err);
                else{
                    if(foundUser) res.render('User-profile',{user : foundUser});
                    else res.send("No such user");
                }
            } );
        } else{
            res.redirect('/login');
        }
    });

    app.post("/updatedetails", function(req,res){
        // console.log(req.body);
        if(req.isAuthenticated()){
            console.log("who submitted = " + req.user.username +" "+req.user._id );
            // console.log(req.body);

            User.updateOne({_id:req.user._id},{
                hasFilledTheForm: true,
                lname: req.body.lname,
                age: req.body.age,
                gender: req.body.gender,
                cgpa: req.body.cgpa,
                department: req.body.department,
                hometown: req.body.hometown,
                coaching: req.body.coaching,
                fromkota: req.body.fromkota,
                eaa: req.body.eaa,
                sportsvalue: req.body.sportsvalue,
                techvalue: req.body.techvalue,
                socultvalue: req.body.socultvalue,
                introextrovert: req.body.introextrovert,
                depcinterest: req.body.depcinterest,
                researchgroupinterest: req.body.researchgroupinterest,
                socities: req.body.socities,
                hobbies: req.body.hobbies,
                projectsinterestvalue: req.body.projectsinterestvalue,
                programmingexperiancevalue: req.body.programmingexperiancevalue,
                futureorientationorder: req.body.futureorientationorder,
                competitiveexamsorder: req.body.competitiveexamsorder
            },function(err){
                if(err) console.log(err);
                else console.log("data updated successfully");
            });

            res.locals.username = req.user.username ;
            res.render('success');
        } else{
            res.redirect('/login');
        }
    });

    app.get("/getsuggestions", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render('User-getsuggestions',{user : req.user});
        } else{
            res.redirect('/login');
        }
    });

    app.get("/updatedetails", function(req,res){
        if(req.isAuthenticated()){
            console.log("from updatedetails route : " + req.user.username );
            res.locals.username = req.user.username ;
            res.render('User-updatedetails',{user : req.user});
        } else{
            res.redirect('/login');
        }
    });

    app.get("/messages", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render('User-messages',{user : req.user, User: User});
        } else{
            res.redirect('/login');
        }
    });

    app.get("/search", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render('User-search',{user : req.user});
        } else{
            res.redirect('/login');
        }
    });

    // ********************************************************************************************
    // make these


    app.post("/search", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;

            var q = req.body.query;
            var wordsArray = q.trim().split(" ");
            // convert all the words in it to lowercase
            for(var i=0;i<wordsArray.length;i++){
                wordsArray[i] = _.lowerCase(wordsArray[i]);
            }
            console.log(wordsArray);

            var resultArray = [];
            User.find({}, function(err, found ){

                doWork(found, resultArray, wordsArray, function(){
                    console.log("render the results page");
                    res.render('search-results', {resultArray: resultArray});
                } );

            });

        } else{
            res.redirect('/login');
        }
    });

    function doWork(found, resultArray, wordsArray , callback){
        //iterate over all users
        for(var i=0;i<found.length;i++){
            var a = _.lowerCase(found[i].username);
            var b = _.lowerCase(found[i].fname);
            var c = (found[i].lname) ?  _.lowerCase(found[i].lname) : "-1" ;

            //for all the elements of wordsArray
            for(var k=0 ; k<wordsArray.length ; k++){
                var bool = ( a.includes(wordsArray[k]) || b.includes(wordsArray[k]) || c.includes(wordsArray[k]) );
                if(bool) {
                    // console.log("suitable=" + found[i].username);
                    resultArray.push(found[i]);
                    break;
                }
            }
        }

        console.log("hi I am doWork() function");
        callback();
    }

    app.get("/connect/:username", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.send("will make it");
        } else{
            res.redirect('/login');
        }
    });
    // ************************************************************************************************

    app.get("/privacysettings", function(req,res){
        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            res.render('User-privacysettings',{user : req.user});
        } else{
            res.redirect('/login');
        }
    });

    app.post("/privacysettings", function(req,res){

        if(req.isAuthenticated()){
            res.locals.username = req.user.username ;
            // res.render('User-privacysettings',{user : req.user});
            // console.log(req.user);

            var arr = Object.keys(req.body);    // will convert the recieved json object to an array of strings
            console.log( typeof(arr) );
            // console.log( arr );

            var arr2 = ['fname', 'username', 'email', 'gender', 'age' ]; // these are the must display fields
            arr2.forEach(function(element){
                arr.push(element);
            });
            User.updateOne( {_id : req.user._id}, {todisplay: arr}, function(err){
                if(err) console.log(err);
                else {
                    res.locals.username = req.user.username ;
                    res.render('success');
                }
            } );

        } else{
            res.redirect('/login');
        }

    });


    //start listning (just to turn on the server)
    app.listen(process.env.PORT || 3000, function(){
        console.log("server started on port 3000");
    });
