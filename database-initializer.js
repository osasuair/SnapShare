const fs = require("fs")
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let config = JSON.parse(fs.readFileSync("config.json"));

let users = JSON.parse(fs.readFileSync("db-init/users.json"));
let artwork = JSON.parse(fs.readFileSync("db-init/gallery.json"));


// Connect to client and clear all old files in artwork and users collections, then initialize the two collections with the hardcoded objects
MongoClient.connect(config.mongo_uri, { useNewUrlParser: true }, function(err, client) {
    if(err) throw err;

    let userArt = client.db('userArt');
    userArt.dropCollection("artwork", function(err, result){
        if(err){
            console.log("Error dropping collection. Likely case: artwork collection did not exist (don't worry unless you get other errors...)")
        }else{
            console.log("Cleared artwork collection.");
        }

        // Inserting users and artwork to mongodb database
        userArt.collection("artwork").insertMany(artwork, function(err, result){
            if(err) throw err;
            console.log("Successfuly inserted " + result.insertedCount + " artworks.")
            userArt.dropCollection("users", function(err, result){
                if(err){
                    console.log("Error dropping collection. Likely case: users collection did not exist (don't worry unless you get other errors...)")
                }else{
                    console.log("Cleared users collection.");
                }
                userArt.collection("users").insertMany(users, function(err, result){
                    if(err) throw err;
                    console.log("Successfuly inserted " + result.insertedCount + " users.")
                    process.exit();
                })
            });
        })
    });

});
