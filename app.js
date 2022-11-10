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
var passwordValidator = require('password-validator');
const { Octokit } = require("@octokit/core");
const { forEach } = require('lodash');
const octokit = new Octokit({ auth: process.env.AUTH_TOKEN });

//setup server
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public")); // to correctly send the images and css files

var running_locally = false;
app.use(session({
    secret: (running_locally ? "bla_bla_secret" : process.env.SECRET_KEY),
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// making a local database named mindmatchDB
var local_DB_URL = "mongodb://localhost:27017/MindMatchDB";
var hosted_DB_URL = "" + process.env.DATABASE_URL;
var DB_URL = (running_locally ? local_DB_URL : hosted_DB_URL);

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log("ERROR: ", err.message);
});
// mongoose.set("useCreateIndex", true);

const messageSchema = {
    sender: String,
    reciever: String,
    read: Boolean,
    messages: [{
        who: String,
        value: String
    }]
};

// making a schema for the user info
const userSchema = mongoose.Schema({

    connections: [String], // will contain the usernames of the person who want to connect
    requests: [String],
    sentrequests: [String],
    chat: [messageSchema],

    hasFilledTheForm: Boolean,
    isAdmin: Boolean,

    username: String,
    fname: String,
    lname: String,
    email: String,
    password: String,
    registered: {
        type: Date,
        default: Date.now
    },
    age: Number,
    gender: String,
    department: String,
    cgpa: Number,
    hometown: String,
    coaching: String,
    fromkota: String, // instead of boolean use Yes, No
    eaa: String,
    sportsvalue: Number,
    techvalue: Number,
    socultvalue: Number,
    coursetype: String,
    hobbies: [String], // array of strings
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


//get request to server for home page
app.get("/", function (req, res) {
    //sending information from server side
    res.render("index", {});
});




app.get("/login", function (req, res) {
    var message = "";
    res.render('login', {
        message: message
    });
});
app.get("/register", function (req, res) {
    var message = "";
    res.render('register', {
        message: message
    });
});
app.get("/adminlogin", function (req, res) {
    res.render('admin-login', {});
});


app.get("/about", function (req, res) {
    res.render('about', {});
});
app.get("/contact", function (req, res) {
    res.render('contact', {});
});


app.get("/contributors", async function(req, res){
    const response = await octokit.request("GET /repos/{owner}/{repo}/contributors", {
        owner: "akhilchoudhary2k",
        repo: "MindMatch-kgp",
      });
    res.render('contributors', {info_list: response.data});

});


app.get("/help", function (req, res) {
    res.send("Will make it");
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get("/AdminHome", function (req, res) {
    if (req.isAuthenticated() && req.user.username == 'admin') {
        var u = 0, c = 0, m = 0; // users connections messages

        User.find({}, function (err, found) {
            u = found.length;
            found.forEach(function (user) {

                c += user.connections.length;
                var arr = user.chat;

                console.log(user.username, arr);
                if (arr && arr.length > 0) {
                    arr.forEach(function (obj) {
                        // if(obj.messages) m+= obj.messages.length;
                        if (obj) m += obj.messages.length;
                    });
                }
            });
            console.log("m", m);



            res.render("AdminHome", { userCount: u, conCount: c / 2, messCount: m / 2 });
        });

    } else {
        res.redirect('/adminlogin');
    }
});

app.post("/login", async function (req, res, next) {
    try {
        req.body.username=req.body.username.toLowerCase();
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        const found = await User.findOne({ username: req.body.username })
        if (!found) {
            var message = "No such username exists";
            return res.render('login', {
                message: message
            });
        }
        passport.authenticate("local",
            (err, user, options) => {
                if (user) {
                    req.login(user, (error) => {
                        if (error) {
                            res.render("login", {
                                message: error.message
                            })
                        } else {
                            if (req.body.username === 'admin') res.redirect("/AdminHome");
                            else res.redirect("/UserHome");
                        };
                    });
                }
                else {
                    if (req.body.username === 'admin')
                    {
                        res.redirect("adminlogin");
 }
                  else {
                    res.render("login", {
                        message: "Username or Password is incorrect"
                    });
                  }
                }
            })(req, res, next);
    } catch (e) {
        console.log(e);
    }
});

app.get("/UserHome", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('UserHome', { user: req.user });
    } else {
        res.redirect('/login');
    }
});

app.get("/UserHome", async function(req, res) {
    let fullNames = {};
    function getFullName(username){
        User.findOne({
            username: username
        }, function(err, found) {
            if(found) {
            return [found.fname, found.lname]
            }
        });
    }
    for (i in username.connections){
        var nullCheck = await getFullName(username.connections[i]);
        //replace all null values with "N/A"
        if (nullCheck[0] === null){
            nullCheck[0] = "N/A";
        }
        if (nullCheck[1] === null){
            nullCheck[1] = "N/A";
        }
        fullNames[i] = nullCheck;
    }
    res.render('UserHome', fullNames);
});

app.post("/register", function (req, res) {
    req.body.username=req.body.username.toLowerCase();
    var schema = new passwordValidator();
    schema
        .is().min(5)                                    // Minimum length 5
        .is().max(10)                                   // Maximum length 10
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                                // Must have at least 1 digits
        .has().not().spaces()                           // Should not have spaces
        .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
    if (schema.validate(req.body.password2)) {
        if (req.body.password != req.body.password2) {
            var message = "Passwords do not match";
            res.render('register', {
                message: message
            });
        } else {
            if (req.body.username.indexOf(' ') >= 0) {
                var message = "username should not contain whitespace";
                return res.render('register', {
                    message: message
                });
            }
            var trimmedUsername = req.body.username.trim();
            if (trimmedUsername.length >= 4) {
                User.register({
                    username: req.body.username,
                }, req.body.password, function (err, user) {
                    if (err) {
                        console.log(err.message);
                        var message = err.message;
                        res.render("register", {
                            message: message
                        });
                    } else {
                        // console.log(req.body);
                        User.updateOne({
                            _id: user._id
                        }, {
                            email: req.body.email,
                            fname: req.body.name,
                            isAdmin: false
                        }, function (err) {
                            if (err) console.log(err);
                        });
                        passport.authenticate("local")(req, res, function () {
                            res.redirect("/UserHome");
                        });
                    }
                });
            }
            else {
                var message = "username should be atleast 4 characters";
                res.render('register', {
                    message: message
                });
            }
        }
    }
    else {
        var message = "Stronger Password Needed [Min length:5 & must include lowercase, uppercase, digit]";
        res.render('register', {
            message: message
        });
    }
});

app.post("/adminlogin", function (req, res) {

});

// routes when the user is logged in

app.get("/chat/:reciever", function (req, res) {
    if(req.user.username != "admin" && req.params.userName == 'admin'){
        return res.redirect("/UserHome");
    }
    if (req.isAuthenticated()) {
        console.log("GET req. from:" + req.user.username + " to:" + req.params.reciever);
        res.locals.username = req.user.username; // just to put username in the navbar
        var sender = req.user.username;
        var reciever = req.params.reciever;
        var array = [];
        console.log(req.user.chat.length);
        for (var i = 0; i < req.user.chat.length; i++) {
            if (req.user.chat[i].sender == reciever || req.user.chat[i].reciever == reciever) {
                array = req.user.chat[i].messages;
            }
        }
        console.log(array);
        res.render('chat', {
            sender: sender,
            reciever: reciever,
            messages: array
        });
    } else {
        res.redirect('/login');
    }
});

app.post("/chat/:reciever", function (req, res) {
    if(req.user.username != "admin" && req.params.userName == 'admin'){
        return res.redirect("/UserHome");
    }
    if (req.isAuthenticated()) {
        var array = [];
        console.log("POST req. from:" + req.user.username + " to:" + req.params.reciever);
        res.locals.username = req.user.username; // just to put username in the navbar

        //save in reciever's database
        User.findOne({
            username: req.params.reciever
        }, function (err, found) {
            if (!found) console.log("error in finding the user");
            else {
                console.log("updating in " + req.params.reciever + "'s database");
                var chatArray = found.chat;
                var temp = -1; // to store the chat array element
                var ind = -1;

                for (var i = 0; i < chatArray.length; i++) {
                    if (chatArray[i] != null && (chatArray[i].sender == req.user.username || chatArray[i].reciever == req.user.username)) {
                        temp = chatArray[i];
                        ind = i;
                        break;
                    }
                }

                // no previous chat
                if (temp == -1) {
                    console.log(" no previous chat");
                    var m = {
                        who: req.user.username,
                        value: req.body.newMessage
                    };
                    var messageArray = [];
                    messageArray.push(m);
                    var obj = {
                        sender: req.user.username,
                        reciever: req.params.reciever,
                        read: false,
                        messages: messageArray
                    };
                    found.chat.unshift(obj);
                    found.save();
                    console.log("successfully saved in reciever's database");
                } else {
                    // found previous chat
                    console.log("found previous chat");

                    var m2 = {
                        who: req.user.username,
                        value: req.body.newMessage
                    };
                    found.chat[ind].messages.push(m2);

                    var currentChatObject = found.chat[ind];
                    // delete found.chat[ind];
                    found.chat.splice(ind, 1);
                    found.chat.unshift(currentChatObject);
                    found.save();
                    console.log("successfully saved in reciever's database");
                }
            }
        });

        //save in sender's database
        User.findOne({
            username: req.user.username
        }, function (err, found) {

            var temp = -1; // to store the chat array element
            var ind = -1;
            console.log("updating in " + req.user.username + "'s database");
            for (var i = 0; i < found.chat.length; i++) {
                if (found.chat[i] != null && (found.chat[i].reciever == req.params.reciever || found.chat[i].sender == req.params.reciever)) {
                    temp = found.chat[i];
                    ind = i;
                    break;
                }
            }

            //not found i.e. sender is first time sending the message to reciever
            if (ind == -1) {
                console.log(" no previous chat");
                var m = {
                    who: req.user.username,
                    value: req.body.newMessage
                };
                var messageArray = [];
                messageArray.push(m);
                var obj = {
                    sender: req.user.username,
                    reciever: req.params.reciever,
                    read: true,
                    messages: messageArray
                };
                found.chat.unshift(obj);
                array = messageArray;
                found.save(function (err) {
                    console.log("successfully saved in sender's database");
                    res.render('chat', {
                        sender: req.user.username,
                        reciever: req.params.reciever,
                        messages: array
                    });
                });


            } else {
                // found i.e. sender has already chatted with reciever
                console.log("found previous chat");
                var m2 = {
                    who: req.user.username,
                    value: req.body.newMessage
                };
                found.chat[ind].messages.push(m2);

                var currentChatObject = found.chat[ind];
                array = currentChatObject.messages;
                // delete found.chat[ind];
                found.chat.splice(ind, 1);
                found.chat.unshift(currentChatObject);
                found.save(function (err) {
                    console.log("successfully saved in sender's database");
                    res.render('chat', {
                        sender: req.user.username,
                        reciever: req.params.reciever,
                        messages: array
                    });
                });
            }
        });

        // res.render('chat', {sender: req.user.username, reciever: req.params.reciever, messages: array });
    } else {
        res.redirect('/login');
    }
});

app.get("/profile/:userName", function (req, res) {
    if(req.user.username != "admin" && req.params.userName == 'admin'){
        return res.redirect("/UserHome");
    }
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username; // just to put username in the navbar
        // req.user -> who made this get request
        // req.params.userName -> whose profile should be displayed

        User.findOne({ username: req.params.userName }, function (err, foundUser) {
            if (err) console.log(err);
            else {
                if (foundUser) res.render('User-profile', {
                    user: foundUser
                });
                else res.send("No such user");
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.post("/updatedetails", function (req, res) {
    // console.log(req.body);
    if (req.isAuthenticated()) {
        console.log("who submitted = " + req.user.username + " " + req.user._id);
        // console.log(req.body);

        User.updateOne({
            _id: req.user._id
        }, {
            hasFilledTheForm: true,
            lname: req.body.lname,
            age: req.body.age,
            gender: req.body.gender,
            cgpa: req.body.cgpa,
            department: req.body.department,
            hometown: req.body.hometown,
            // coaching: req.body.coaching,
            fromkota: req.body.fromkota,
            eaa: req.body.eaa,
            sportsvalue: req.body.sportsvalue,
            techvalue: req.body.techvalue,
            socultvalue: req.body.socultvalue,
            introextrovert: req.body.introextrovert,
            depcinterest: req.body.depcinterest,
            researchgroupinterest: req.body.researchgroupinterest,
            coursetype: req.body.coursetype,
            hobbies: req.body.hobbies,
            projectsinterestvalue: req.body.projectsinterestvalue,
            programmingexperiancevalue: req.body.programmingexperiancevalue,
            futureorientationorder: req.body.futureorientationorder,
            competitiveexamsorder: req.body.competitiveexamsorder
        }, function (err) {
            if (err) console.log(err);
            else console.log("data updated successfully");
        });

        res.locals.username = req.user.username;
        res.render('success');
    } else {
        res.redirect('/login');
    }
});

app.get("/getsuggestions", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('User-getsuggestions', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});

app.post("/getsuggestions", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;

        var array = []; // {username , firstname, % value}
        User.find({}, function (err, found) {
            var ind = 0;

            // if there are no users other than admin and self
            if (found.length <= 2) res.render("suggestion-results", { array: array });
            else {
                found.forEach(function (user) {
                    if (user.username != 'admin' && user.username != req.user.username) {
                        ind++;
                        var obj = { username: user.username, fname: user.fname, percentage: 0 };
                        getpercentage(req.user, user, obj, function () {
                            if (obj.percentage >= 20) {
                                array.push(obj);
                            }
                        });
                        if (ind == found.length - 2) {
                            // sort the array in decreasing order of % match value
                            array.sort(function (a, b) {
                                if (a.percentage > b.percentage) return -1;
                                if (a.percentage < b.percentage) return 1;
                                else return 0;
                            });
                            res.render("suggestion-results", { array: array });
                            console.log("most finally", array.length);
                        }
                    }
                });
            }
        });
    } else {
        res.redirect('/login');
    }
});


function getpercentage(me, other, obj, callback) {
    // obj.percentage = 50 +  Math.floor( 50*Math.random() );
    var currentScore = 0, totalScore = 1;

    var a = Math.abs(me.age - other.age);
    totalScore += 50;
    if (a <= 2) {
        currentScore += 50;
    } else if (a <= 5) {
        currentScore += 20;
    } else {
        currentScore += 0;
    }
    totalScore += 50;
    if (me.department == other.department) currentScore += 50;

    totalScore += 50;
    if (_.lowerCase(me.hometown) == _.lowerCase(other.hometown)) currentScore += 50;


    totalScore += 10;
    if (me.fromkota == other.fromkota) currentScore += 10;

    totalScore += 20;
    if (me.eaa == other.eaa) currentScore += 20;

    totalScore += 100;
    if (me.introextrovert == other.introextrovert) currentScore += 100;

    totalScore += 100;
    if (me.depcinterest == other.depcinterest) currentScore += 100;

    totalScore += 50;
    if (me.researchgroupinterest == other.researchgroupinterest) currentScore += 50;

    totalScore += 200;
    if (me.coursetype == other.coursetype) currentScore += 200;

    totalScore += 100;
    if (me.futureorientationorder == other.futureorientationorder) currentScore += 100;

    // now comes the slider fields
    // we will first calcuate the % difference in that slider's value
    // and then the % similarity value and that value will be multiplied by the weight
    // df --->  difference fraction  i.e.  |a-b| / ((a+b)/2)
    var df;
    if (me.cgpa && other.cgpa) {
        df = (Math.abs(me.cgpa - other.cgpa)) / ((me.cgpa + other.cgpa) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    if (me.sportsvalue && other.sportsvalue) {
        df = (Math.abs(me.sportsvalue - other.sportsvalue)) / ((me.sportsvalue + other.sportsvalue) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    if (me.techvalue && other.techvalue) {
        df = (Math.abs(me.techvalue - other.techvalue)) / ((me.techvalue + other.techvalue) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    if (me.socultvalue && other.socultvalue) {
        df = (Math.abs(me.socultvalue - other.socultvalue)) / ((me.socultvalue + other.socultvalue) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    if (me.projectsinterestvalue && other.projectsinterestvalue) {
        df = (Math.abs(me.projectsinterestvalue - other.projectsinterestvalue)) / ((me.projectsinterestvalue + other.projectsinterestvalue) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    if (me.programmingexperiancevalue && other.programmingexperiancevalue) {
        df = (Math.abs(me.programmingexperiancevalue - other.programmingexperiancevalue)) / ((me.programmingexperiancevalue + other.programmingexperiancevalue) / 2);
        totalScore += 50;
        currentScore += 50 * (1 - df);
    }

    // now comes the hobies and competitive Exams sets
    // we have to calculate the no. of common elements in these sets

    // Hobbies
    var common, n1, n2;
    if (me.hobbies && other.hobbies) {
        common = 0;
        n1 = me.hobbies.length;
        n2 = other.hobbies.length;

        for (var i = 0; i < n1; i++) {
            if (other.hobbies.includes(me.hobbies[i])) common++;
        }
        totalScore += 150;
        currentScore += 150 * (2 * common) / (Math.max(1, n1 + n2));
        console.log(other.username, "hobbies matching, common= ", common, " n1=", n1, " n2=", n2);
    }

    // competitive Exams
    if (me.competitiveexamsorder && other.competitiveexamsorder) {
        common = 0;
        n1 = me.competitiveexamsorder.length;
        n2 = other.competitiveexamsorder.length;
        for (var j = 0; j < n1; j++) {
            if (other.competitiveexamsorder.includes(me.competitiveexamsorder[j])) common++;
        }
        totalScore += 150;
        currentScore += 150 * (2 * common) / (Math.max(1, n1 + n2));
        console.log(other.username, "competitive Exams matching, common= ", common, " n1=", n1, " n2=", n2);
    }

    temp = Math.floor((10000 * currentScore) / totalScore);
    obj.percentage = temp / 100;
    callback();
}

app.get("/updatedetails", function (req, res) {
    if (req.isAuthenticated()) {
        console.log("from updatedetails route : " + req.user.username);
        res.locals.username = req.user.username;
        res.render('User-updatedetails', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/messages", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('User-messages', {
            user: req.user,
            User: User
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/search", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('User-search', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});



app.post("/search", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;

        var q = req.body.query;
        var wordsArray = q.trim().split(" ");
        // convert all the words in it to lowercase
        for (var i = 0; i < wordsArray.length; i++) {
            wordsArray[i] = _.lowerCase(wordsArray[i]);
        }
        console.log(wordsArray);

        var resultArray = [];
        User.find({username:{$nin:['admin', req.user.username]}}, function (err, found) {
            doWork(found, resultArray, wordsArray, function () {
                console.log("render the results page");
                res.render('search-results', {
                    resultArray: resultArray
                });
            });

        });

    } else {
        res.redirect('/login');
    }
});

function doWork(found, resultArray, wordsArray, callback) {
    //iterate over all users
    for (var i = 0; i < found.length; i++) {
        var a = _.lowerCase(found[i].username);
        var b = _.lowerCase(found[i].fname);
        var c = (found[i].lname) ? _.lowerCase(found[i].lname) : "-1";

        //for all the elements of wordsArray
        for (var k = 0; k < wordsArray.length; k++) {
            var bool = (a.includes(wordsArray[k]) || b.includes(wordsArray[k]) || c.includes(wordsArray[k]));
            if (bool) {
                // console.log("suitable=" + found[i].username);
                resultArray.push(found[i]);
                break;
            }
        }
    }

    console.log("hi I am doWork() function");
    callback();
}

// ********************************************************************************************

app.post("/connect/:username", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;

        // put the connection request in sender's sentrequests chatArray
        if (!req.user.sentrequests.includes(req.params.username)) {
            User.findOne({
                username: req.user.username
            }, function (err, u) {
                u.sentrequests.push(req.params.username);
                u.save();
            });

        }

        //put the connection request in :username 's requests array
        User.findOne({
            username: req.params.username
        }, function (err, found) {
            if (err) console.log(err);
            else {
                // if not already present then only insert
                if (!found.requests.includes(req.user.username)) {
                    found.requests.unshift(req.user.username);
                    found.save();
                    console.log("inserted successfully");
                } else console.log("already sent");
            }
        });

        var url = '/profile/' + req.params.username;
        res.redirect(url);
        // res.send("will make it");
    } else {
        res.redirect('/login');
    }
});

app.get('/requests', function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('requests', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/requests', function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        console.log("sender = " + req.body.button + ", reciever = " + req.user.username);

        // update in sender's database
        User.findOne({
            username: req.body.button
        }, function (err, s) {
            if (err) console.log(err);
            else {
                console.log("saving in sender's database");
                if (!s.connections.includes(req.user.username)) {
                    s.connections.push(req.user.username);
                }

                var ind = -1;
                for (var i = 0; i < s.sentrequests.length; i++) {
                    if (s.sentrequests[i] == req.user.username) {
                        ind = i;
                        break;
                    }
                }
                if (ind != -1) {
                    s.sentrequests.splice(ind, 1);
                }
                s.save();
            }
        });

        //update in reciever's database
        User.findOne({
            username: req.user.username
        }, function (err, reciever) {
            if (err) console.log(err);
            else {
                console.log("saving in reciever's database");

                // to handle the resubmission of the form so that duplicate entries are not saved
                if (!reciever.connections.includes(req.body.button)) {
                    reciever.connections.push(req.body.button);
                }

                var ind = -1;
                for (var i = 0; i < reciever.requests.length; i++) {
                    if (reciever.requests[i] == req.body.button) {
                        ind = i;
                        break;
                    }
                }
                if (ind != -1) {
                    reciever.requests.splice(ind, 1);
                }
                doWork2(reciever, function () {
                    console.log("saved in  reciever's database");
                    res.render('requests', {
                        user: reciever
                    });
                });
                // reciever.save();

            }
        });

        // res.render('requests', {user: req.user});
    } else {
        res.redirect('/login');
    }
});

function doWork2(user, callback) {
    user.save();
    callback();
}

// ************************************************************************************************

app.get("/privacysettings", function (req, res) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.render('User-privacysettings', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});

app.post("/privacysettings", function (req, res) {

    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        // res.render('User-privacysettings',{user : req.user});
        // console.log(req.user);

        var arr = Object.keys(req.body); // will convert the recieved json object to an array of strings
        console.log(typeof (arr));
        // console.log( arr );

        var arr2 = ['fname', 'username', 'email', 'gender', 'age']; // these are the must display fields
        arr2.forEach(function (element) {
            arr.push(element);
        });
        User.updateOne({
            _id: req.user._id
        }, {
            todisplay: arr
        }, function (err) {
            if (err) console.log(err);
            else {
                res.locals.username = req.user.username;
                res.render('success');
            }
        });

    } else {
        res.redirect('/login');
    }

});

//start listning (just to turn on the server)

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("server started on port", port);
});
