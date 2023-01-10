const express = require('express');
const notifs = require("./notification")
const router = express.Router();
let ObjectId = require('mongodb').ObjectId;

router.delete("/notif", delNotif);
router.get("/profile", getProfile);
router.get("/profile/posts", getPosts)
router.get("/artist/:name", getArtist);
router.get("/course",(req, res) => {
    if(!req.session.artist) {
        req.session.notArtist = true;
        res.redirect(302, "/feed");
        return;
    }
    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
        let body = {notifs: user.notifs, artist: req.session.artist};
        if(req.session.courseError) {
            req.session.courseError = false;
            body["error"] = "Something went wrong! Try Again!"
        }
        res.render("new-course", {notifs: user.notifs, artist: req.session.artist})
    });
});
router.put("/course", joinCourse);
router.post("/course", newCourse);
router.delete("/course", delCourse);
router.put("/follow", follow);
router.delete("/follower", remFollower);
router.put("/switchArtist", switchArtist);

function getProfile(req, res) {
    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, async function (err, user) {
        if(err) {
            res.status(500).send("Cannot Read Database");
            return;
        }
        let likesID = user.artInteracted.liked.map(id => ObjectId(id));
        let reviewsID = user.artInteracted.review.map(id => ObjectId(id.artId));
    
        const likes = await req.app.locals.db.collection("artwork").find({"_id": {$in: likesID}}).project({year: 0, category: 0, image: 0, reviews: 0, likes: 0, era: 0}).sort({time: -1}).toArray();
        const reviews = await req.app.locals.db.collection("artwork").find({"_id": {$in: reviewsID}}).project({year: 0, category: 0, image: 0, reviews: 0, likes: 0, era: 0}).sort({time: -1}).toArray();
            
        res.render("profile", {notifs: user.notifs, artist: req.session.artist, user: user, likes: likes, reviews: reviews});
    });
}

function delNotif(req, res) {
    notifs.delNotif(req, req.session.username, req.query.id);
    res.sendStatus(204);
}

function getArtist(req, res) {
    req.app.locals.db.collection("users").findOne({"username": req.params.name}, async function(err, artist) {
        let owner = false;
        let info = {};

        const user = await req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)});
        if(artist.artist.valid){
            info.artwork = await req.app.locals.db.collection("artwork").find({artist: req.params.name}).sort({time:-1}).toArray();
            info.following = user.following.includes(artist.username);
            // Get just the id of all courses if the user is enrolled in the course
            info.courses = artist.artist.courses.map(function(course) {
                if(course.enrolled.includes(req.session.username)) {
                    return course.id;
                }
            });
        }
        if(req.session.username == req.params.name) owner = true;

        let likesID = artist.artInteracted.liked.map(id => ObjectId(id));
        let reviewsID = artist.artInteracted.review.map(id => ObjectId(id.artId));
        const likes = await req.app.locals.db.collection("artwork").find({"_id": {$in: likesID}}).project({year: 0, category: 0, image: 0, reviews: 0, likes: 0, era: 0}).sort({time: -1}).toArray();
        const reviews = await req.app.locals.db.collection("artwork").find({"_id": {$in: reviewsID}}).project({year: 0, category: 0, image: 0, reviews: 0, likes: 0, era: 0}).sort({time: -1}).toArray();

        res.render("artist", {notifs: user.notifs, artist: req.session.artist, theArtist: artist, info: info, owner: owner, likes: likes, reviews: reviews})
    });
}

async function getPosts(req, res) {
    if(!req.session.artist){
        req.session.notArtist = true;
        res.redirect(302, "/feed");
        return;
    }
    let skip = 0;
    let limit = 6;

    if(req.query.skip) {
        skip = (Number(req.query.skip)<0 ? 0 : Number(req.query.skip));
    }

    const artwork = await req.app.locals.db.collection("artwork").find({artist: req.session.username}).limit(limit).skip(skip*limit).sort({time: -1}).toArray();
    const total = await req.app.locals.db.collection("artwork").countDocuments({artist: req.session.username});

    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
        res.render("posts", {notifs: user.notifs, artist: req.session.artist, artwork, total, skip, limit, username: req.session.username})
    });
}


/* 
Joins/Drops Course dependent on client query 
*/
function joinCourse(req, res) {
    req.query.id = req.query.id;
    
    // Check if user is enrolled in course
    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId), "courses.id": req.query.id}, async function (err1, found) {
        if(err1) {
            res.status(500).send("Cannot Read Database");
            return;
        }

        let updateUser, updateCourse, newCourse;
        if(found) {
            let course = found.courses.find((course) => course.id === req.query.id);
            notifs.newNotif(req, req.session.username, `Cancelled Course: ${course.name} by ${course.author}`)

            // If user is in course then remove them as requested 
            updateUser = {$pull: {courses: course}};
            updateCourse = {$pull: {"artist.courses.$.enrolled": req.session.username}};
        } else {
            // If user not in course then add them to course
            const user = await req.app.locals.db.collection("users").findOne({username: req.query.author});
            newCourse = user.artist.courses.find(elm => elm.id == req.query.id);
            notifs.newNotif(req, req.session.username, `Joined Course: ${newCourse.name} by ${newCourse.author}`)

            delete newCourse.enrolled; // users who aren't artist shouldn't see who else is in enrolled in course
            updateUser = {$push: {courses: newCourse}};
            updateCourse = {$push: {"artist.courses.$.enrolled": req.session.username}};
        }

        req.app.locals.db.collection("users").bulkWrite([
            {
                updateOne: {
                    filter: {"_id": ObjectId(req.session.userId)},
                    update: updateUser
                }
            },
            {
                updateOne: {
                    filter: {username: req.query.author, "artist.courses.id": req.query.id},
                    update: updateCourse
                }
            }
        ], function (err, result) {
            if(err) {
                res.status(500).send("Cannot Read Database");
                return;
            }
            res.sendStatus(204);
        });

    });    
}   

function newCourse(req, res) {
    if(!req.session.artist) {
        req.session.notArtist = true;
        res.redirect(302, "/feed");
        return;
    }

    let course = {};
    course["id"] = Date.now() + "" + Math.random();
    course["author"] = req.session.username;
    course["enrolled"] = [];

    if(req.body.title && req.body.description){
        course["name"] = req.body.title;
        course["description"] = req.body.description;
    } else {
        req.session.courseError = true;
        res.redirect(302, "/feed/user/course");
        return;
    }
    // Notification to all Users   
    req.app.locals.db.collection("users").findOneAndUpdate({"_id": ObjectId(req.session.userId)}, {$push: {"artist.courses": course}}, function (err, artist){
        artist.value.artist.followed.forEach(user => {
            notifs.newNotif(req, user, `New Course: ${course.name} by ${artist.value.username}`)
        })
        res.redirect(302, "/feed/user/profile")
    });
}

/* 
Follows/Unfollows user based on query from client
*/
function follow(req, res) {
    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId), following: req.query.user}, function (err1, found) {
        // Follow Notification 
        let edit = found ? "$pull" : "$push";
        
        req.app.locals.db.collection("users").bulkWrite([
            { 
                updateOne: {
                    filter: {"_id": ObjectId(req.session.userId)},
                    update: {[edit]: {following: req.query.user}}
                }
            },
            {
                updateOne: {
                    filter: {"username": req.query.user},
                    update: {[edit]: {"artist.followed": req.session.username}}
                }
            }
        ], function(err, result){
            if(err) {
                res.status(500).send("Cannot Read Database");
                return;
            }
            if(result.nModified == 2 && !found){
                notifs.newNotif(req, req.session.username, `Now Following: ${req.query.user}`);
                notifs.newNotif(req, req.query.user, `New Follower: ${req.session.username}`);
            }
            res.sendStatus(204);
        });
    })  
} 

function remFollower(req, res) {
    if(!req.session.artist) {
        res.send("Unauthorized");
        return;
    }

    req.app.locals.db.collection("users").bulkWrite([
        { 
            updateOne: {
                filter: {"username": req.query.user},
                update: {$pull: {following: req.session.username}}
            }
        },
        {
            updateOne: {
                filter: {"_id": ObjectId(req.session.userId)},
                update: {$pull: {"artist.followed": req.query.user}}
            }
        }
    ], function(err, result){
        if(err) {
            res.status(500).send("Cannot Read Database");
            return;
        }
        res.sendStatus(204);
    });
}

async function switchArtist(req, res) {
    const artwork = await req.app.locals.db.collection("artwork").findOne({artist: req.session.username});

    if(req.session.artist || artwork){

        req.session.artist = !req.session.artist;
        req.app.locals.db.collection("users").updateOne({"_id": ObjectId(req.session.userId)}, {$set: {"artist.valid": req.session.artist}});
        res.sendStatus(200);
    } else {
        req.session.firstPost = true;
        req.session.cameFromSwitch = true;
        res.sendStatus(203);
    }
}

async function delCourse(req, res) {
    if(!req.session.artist) {
        res.send("Unauthorized");
        return;
    }

    const result1 = await req.app.locals.db.collection("users").findOneAndUpdate({"_id": ObjectId(req.session.userId)}, {"$pull": {"artist.courses": {id: req.query.id}}});
    let user = result1.value

    if(!user){
        res.status(404).send("Course not found");
        return;
    }
    let enrolledUsers = user.artist.courses.find(elm=>elm.id == req.query.id).enrolled;

    const result2 = await req.app.locals.db.collection("users").updateMany({username: {$in: enrolledUsers}}, {"$pull": {courses: {id: req.query.id}}})
    res.sendStatus(204);
}  

module.exports = router;