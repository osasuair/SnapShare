/* 
account.pug is dynamically used to create theme for both register and login
requires: file(File Name), title,  */
const express = require('express')
const router = express.Router()


/* 
Handles Get request for Login Page
*/
router.get("/login", (req, res)=> {
    if(req.session.unauth) {
        req.session.unauth = false;
        res.status(403).render("account", {file: "login", title: "Log In", errorName: "Unauthorized", error: "You cannot access that page without Logging In!"});
        return;
    }
    if(req.session.logoutERROR) {
        req.session.logoutERROR = false;
        res.status(403).render("account", {file: "login", title: "Log In", errorName: "Log Out ERROR", error: "Your not Logged In!"});
        return;
    }
    if(req.session.page404) {
        if(req.session.loggedin) {
            res.redirect("/feed");
            return;
        }
        req.session.page404 = false;
        res.status(404).render("account", {file: "login", title: "Log In", errorName: "Page Does not Exist", error: "The page you were trying to access does not exist"});
        return;
    }
    res.status(200).render("account", {file: "login", title: "Log In"})
});
router.post("/login", login);
router.get("/register", (req, res)=> res.status(200).render("account", {file: "register", title: "Register"}));
router.post("/register", register);
router.get("/logout", logout, logoutNext);



// Verify login info, if valid -> redirect to feed, otherwise send error message
function login(req, res) {

	let username = req.body.username;
	let password = req.body.password;

	console.log("Logging in with credentials:");
	console.log("Username: " + username);
	console.log("Password: " + password);

    req.app.locals.db.collection("users").findOne({"username": username}, function(err, user) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }
        // If username is not found in the db send error message
        if (user == null) {
            res.status(403).render("account", {file: "login", title: "Log In", error: "User Does not Exist!"});
            return;
        }
        if (user.password === password) {

            // If user is logged in, log out user before resigning them in to new account
            if (req.session.loggedin) {
                logout(req, res, function() {});
            }

            req.session.loggedin = true; 
            req.session.username = username;
            req.session.artist = user.artist.valid;
            req.session.userId = user._id; 
            res.status(202).redirect("/feed");
        } else {
            res.status(403).render("account", {file: "login", title: "Log In", error: "Wrong Password!"});
        }

    });
}

// Handles post request for register
function register(req, res) {
    let username = req.body.username;
	let password = req.body.password;

    req.app.locals.db.collection("users").findOne({"username": username}, function(err, result) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }
        // If user with same user name in the db exists send error message
        if(result !== null) {
            res.status(200).render("account", {file: "register", title: "Register", error: `The username "${username}" was taken! Try Again!`});
            return;
        }
        if (req.session.loggedin) {
            logout(req, res, function() {});
        }

        let newUser = {
            "username": username,
            "password": password, 
            "following": [], 
            "notifs": [],
            "artInteracted": {
                "review": [],
                "liked": []
            },
            "courses": [],
            "artist": {
                "valid": false,
                "followed": [],
                "courses": [] 
        }};  

        req.app.locals.db.collection("users").insertOne(newUser, function(err, user) {
            if(err) {
                res.status(500).send("Cannot Read Database");
                return;
            }            
            req.session.loggedin = true;
            req.session.username = username;
            req.session.userId = user.insertedId;
            res.status(201).redirect("/feed");
        });
    })
}

// handles log out request
// Ends user's session and sends them to log in screen
function logout(req, res, next) {
	if (req.session.loggedin) {
		req.session.loggedin = false;
		req.session.username = undefined;
        req.session.userId = undefined;
        req.session.artist = undefined;
        req.session.cameFromSwitch = undefined; 
        req.session.firstPost = undefined;
	} else {
        req.session.logoutERROR = true;
	}
    next();
}

function logoutNext(req, res) {
    res.status(200).redirect("/account/login");
    return;
}

module.exports = router;