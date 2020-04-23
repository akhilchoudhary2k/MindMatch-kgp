    //jshint esversion:6

    const express = require('express');
    const bodyParser = require('body-parser');

    //setup server
    const app = express();
    app.set("view engine" , "ejs");
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.static("public"));   // to correctly send the images and css files


    

    //get request to server
    app.get("/", function(req,res){
        //sending information from server side
        res.sendFile(__dirname + "/index.html");
    });







    //start listning (just to turn on the server)
    app.listen(process.env.PORT || 3000, function(){
        console.log("server started on port 3000");
    });
