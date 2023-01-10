// Name Maybe ArtZy
// Theme Material Dark maybe with mainly teal accent

const express = require('express');
const session = require('express-session');
const logger = require("morgan");
const config = require("./config.js");

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;

const app = express();
const account = require("./account-server");
const feed = require("./feed-server");

app.set("view engine", "pug"); 
app.set("views", "./views");

app.use(logger("dev"));
app.use('/css', express.static('./node_modules/bootstrap/dist/css'));
app.use('/js', express.static('./node_modules/bootstrap/dist/js'));
app.use(express.static("public"));
app.use(session({ 
	secret: 'some secret here', 
	resave: true,
	saveUninitialized: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use("/account", account);
app.use("/feed", feed);
app.get("/", function(req, res) {
    res.status(301).redirect("/account/login");
})
app.get("*", function (req, res) {
    req.session.page404 = true;
    res.redirect("/account/login");
})

// Initialize database connection
MongoClient.connect(config.mongo_uri , { useNewUrlParser: true }, function(err, client) {
    if(err) throw err;

    app.locals.db = client.db('userArt');

    // Start server once Mongo is initialized
    app.listen(3000);
    console.log("Listening on port 3000, Link: http://localhost:3000");
});
