const express = require('express');
const router = express.Router();
let ObjectId = require('mongodb').ObjectId;
let art = require("./art-server")
let user = require("./user-server")
let search = require("./search-server")

router.use(auth);
router.use("/art", art);
router.use("/user", user);
router.use("/search", search);
router.get("/", feed);
router.get("/explore", explore);

// This route is ran by every request except for the log in and register 
function auth(req, res, next) {
    //if they have admin rights
    console.log("Authenticating..");
	if (!req.session.loggedin) {
        req.session.unauth = true;
        res.redirect(303, "/account/login")
		return;
	}
	next();
}

function feed(req, res, next) {
    let items = {title:"Feed", artist: req.session.artist, all: false}
    if(req.session.page404) {
        req.session.page404 = false;
        items["errorName"] = "Page does not Exist"
        items["error"] = "The page you were trying to access does not exist"
    }
    if(req.session.notArtist) {
        req.session.notArtist = false;
        items["errorName"] = "Unauthorized"
        items["error"] = "You need to be an Artist to access that page"
    }

    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
        if(!user) {
            res.session.unauth = true;
            res.redirect("/account/login")
        }
        items["notifs"] = user.notifs;
        res.render("feed", items);
    });
}

function explore(req, res, next) {
    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
        res.render("feed", {title:"Explore", artist: req.session.artist, notifs: user.notifs, all: true});
    });
}

module.exports = router;