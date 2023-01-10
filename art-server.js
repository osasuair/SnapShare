const express = require('express');
const router = express.Router();
const notifs = require("./notification")
let ObjectId = require('mongodb').ObjectId;

router.get("/", sendArtworks);
router.get("/skips", sendMaxSkips);
router.post("/review", postReview);
router.delete("/review", delReview);
router.put("/like", like);
router.get("/post", getPost);
router.post("/post", newPost, firstPost);
router.delete("/post/:name", delPost);
router.get("/:id", sendArt);


function getPost(req, res) {
    // Verify that either the user is an artist or this is their first post
    if(req.session.artist|| (req.session.firstPost && req.session.cameFromSwitch) ){
        req.session.cameFromSwitch = false;
        req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
            let body = {notifs: user.notifs, artist: req.session.artist, firstPost: req.session.firstPost};

            // Error handling
            if(req.session.artNameTaken) {
                req.session.artNameTaken = false;
                body["error"] = "That Artwork name was taken. Try Again!"
            }
            res.render("new-post", body)
        });
    }else {
        req.session.notArtist = true;
        res.redirect(303, "/feed");
    }
}

// Gets a single Artwork based on the param sent with request
function sendArt(req, res) {
    req.app.locals.db.collection("artwork").findOne({"_id": ObjectId(req.params.id)}, function (err, art) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }
        req.app.locals.db.collection("users").findOne(ObjectId(req.session.userId), function(err, user){
            if(!(req.session.username == art.artist)) art.reviews.map((rev) => rev.push((rev[0] == req.session.username)));
            res.render("artwork", {
                artwork: art, 
                user: req.session.username,
                artist: req.session.artist, 
                notifs: user.notifs, 
                owner: (req.session.username === art.artist)
            });
        });
    });
}

// Sends all the artwork to page based on their query
function sendArtworks(req, res) {
    let query = {} 
    req.query.skip= Number(req.query.skip)<0 ? 0 : Number(req.query.skip);

    req.app.locals.db.collection("users").findOne(ObjectId(req.session.userId), function (err, user) {
        query["artist"] = {"$in": user.following};
        if(req.query.all === "true") query = {}
        req.app.locals.db.collection("artwork").find(query).sort({time: -1}).limit(1).skip(req.query.skip).toArray(function (err, result) {
            if (err) {
                res.status(500).send("Cannot Read Database");
                return;
            }
            if(result.length == 0){
                res.status(204).send("No more")
                return;
            }
            if(!(req.session.username == result[0].artist)) result[0].reviews.map((rev) => rev.push((rev[0] == req.session.username)));
            result.push({liked: result[0].likes.includes(req.session.username), numLikes: result[0].likes.length});
            result.push({owner: (req.session.username == result[0].artist)})
            res.json(result);
        });
    });
}

function sendMaxSkips(req, res) {
    let query = {} 
    req.app.locals.db.collection("users").findOne(ObjectId(req.session.userId), function (err, user) {
        query["artist"] = {"$in": user.following};
        if(req.query.all ==="true") query = {};
        req.app.locals.db.collection("artwork").countDocuments(query, function(err, result){
            res.status(200).send(""+ (result));
        });
    });
}

async function postReview(req, res) {
    let review = req.body;

    const result = await req.app.locals.db.collection("artwork").findOne({"_id": ObjectId(review.artId)});
    if(result.artist == req.session.username) {
        res.status(403).send("Cannot Leave Review on Your own Post");
        return;
    }
    // Generate Id for the review
    let revID = "" + Date.now()+Math.random();

    req.app.locals.db.collection("artwork").updateOne({"_id": ObjectId(review.artId)}, {$push: {reviews: [req.session.username, review.rev, revID]}}, async function (err) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }

        let interact = {artId: review.artId, n: 1}; 
        let bulkUpdate = [
            {   
                updateOne: {
                    filter: {
                        "_id": ObjectId(req.session.userId),
                        "artInteracted.review.artId": review.artId,
                    },
                    update: {$inc: {"artInteracted.review.$.n": 1}}
                }
            },
            {
                updateOne: {
                    filter: {
                        "_id": ObjectId(req.session.userId),
                        "artInteracted.review.artId": {$ne: review.artId},
                    },
                    update: {$push: {"artInteracted.review": interact}}
                }
            }
            
        ];
        await req.app.locals.db.collection("users").bulkWrite(bulkUpdate);
        res.json({username: req.session.username, n: (result.reviews.length), id: revID});
    });
}

async function delReview(req, res) {
    let review = req.query;
    let artwork = await req.app.locals.db.collection("artwork").findOne({"_id": ObjectId(review.artId)});
    let update = artwork.reviews.find((elm) => (elm[0] === req.session.username && elm[2] ===review.id));
    if(!update) {
        res.send(404);
        return;
    }

    req.app.locals.db.collection("artwork").updateOne({"_id": ObjectId(review.artId)}, {$pull: {reviews: update}}, async function (err, result) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }

        let interact = {artId: review.artId, n: 1}; 
        let bulkUpdate = [
            {
                updateOne: {
                    filter: {
                        "_id": ObjectId(req.session.userId),
                        "artInteracted.review.artId": review.artId,
                        "artInteracted.review.n": 1
                    },
                    update: {$pull: {"artInteracted.review": interact}}
                }
            },
            {   
                updateOne: {
                    filter: {
                        "_id": ObjectId(req.session.userId),
                        "artInteracted.review.artId": review.artId,
                    },
                    update: {$inc: {"artInteracted.review.$.n": -1}}
                }
            }
        ];
        await req.app.locals.db.collection("users").bulkWrite(bulkUpdate);
        res.send(req.session.username);
    });
}

function like(req, res) {
    let review = req.body;
    let resbody = {like : true};  

    req.app.locals.db.collection("artwork").findOne({"_id": ObjectId(review.artId)}, function(err, result) {
        if (err) {
            res.status(500).send("Cannot Read Database");
            return;
        }

        if(result.artist == req.session.username) {
            res.status(403).send("Cannot leave like on your own Post");
            return;
        }

        resbody["numLikes"] = result.likes.length+1;

        // Unliking ->
        if(result.likes.includes(req.session.username)) {
            resbody.like = false;
            resbody.numLikes -=2;

            req.app.locals.db.collection("users").updateOne({"_id": ObjectId(req.session.userId)}, {$pull: {"artInteracted.liked": review.artId}}, function (err, result) {
                if (err) {
                    res.status(500).send("Cannot Read Database");
                    return;
                }
            });
        } 
        // Liking post
        else {
            req.app.locals.db.collection("users").updateOne({"_id": ObjectId(req.session.userId)}, {$push: {"artInteracted.liked": review.artId}}, function (err, result) {
                if (err) {
                    res.status(500).send("Cannot Read Database");
                    return;
                }
            });
        }

        let i = (resbody.like ? "$push" : "$pull");
        req.app.locals.db.collection("artwork").updateOne({"_id": ObjectId(review.artId)}, {[i] : {likes: req.session.username}}, function (err, result) {
            if (err) {
                res.status(500).send("Cannot Read Database");
                return;
            }
            res.json(resbody);
        });
        
    })
}

async function newPost(req, res, next) {
    if(!req.session.artist && !req.session.firstPost) {
        req.session.notArtist = true;
        res.redirect(302, "/feed");
        return;
    }
    
    let art = {};
    art["artist"] = req.session.username;
    art["year"] = String(new Date().getFullYear());
    art["time"] = Date.now()
    art["description"] = "";
    art["reviews"] = [];
    art["likes"] = [];

    if(req.body.name && req.body.category && req.body.link) {
        const artworks = await req.app.locals.db.collection("artwork").find().toArray();
        if(artworks.some(art=> art.name == req.body.name)) {
            if(req.session.firstPost) req.session.cameFromSwitch = true;
            req.session.artNameTaken = true
            res.redirect(302, "/feed/art/post");
            return;
        }

        art["name"] = req.body.name;
        art["category"] = req.body.category;
        art["image"] = req.body.link;
    } else {
        res.redirect(302, "/feed/art/post");
        return;
    }

    if(req.body.description) {
        art["description"] = req.body.description;
    }
    if(req.body.date) {
        const d = new Date(req.body.date)
        if(d){
            art["time"] = d.getTime();
            art["year"] = String(d.getFullYear());
        }
    }
    art["era"] = getEra(Number(art["year"]));

    req.app.locals.db.collection("artwork").insertOne(art, async function (err, result) {
        if(req.session.firstPost) {
            next();
            return;
        }

        // Notification to all Users
        const artist = await req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)})
        artist.artist.followed.forEach(user => {
            notifs.newNotif(req, user, `New Post: ${art.name} by ${art.artist}`)
        })
        res.redirect(302, "/feed/art/"+result.insertedId.toString())
    });
}

// If the user successfully posted their first post, switch account to artist
function firstPost(req, res) {
    req.session.firstPost = false;
    req.session.cameFromSwitch =false;
    req.session.artist = true;
    req.app.locals.db.collection("users").updateOne({"_id": ObjectId(req.session.userId)}, {$set: {"artist.valid": req.session.artist}});
    res.redirect(302, "/feed/user/profile");
}

async function delPost(req, res) {
    const artwork = await req.app.locals.db.collection("artwork").findOne({name: req.params.name});
    if(artwork.artist !== req.session.username) {
        res.status(401).send("Unauthorized")
        return;
    }

    let reviews = new Set();
    artwork.reviews.map((review) => reviews.add(review[0]));
    reviews.forEach(async elm => {
        await req.app.locals.db.collection("users").updateOne(
            {username: elm}, 
            {$pull: {"artInteracted.review": {artId: artwork._id.toString()}}});
    });

    artwork.likes.forEach(async elm => {
        await req.app.locals.db.collection("users").updateOne(
            {username: elm, "artInteracted.liked": artwork._id.toString()}, 
            {$pull: {"artInteracted.liked": `${artwork._id.toString()}`}});
    })
    req.app.locals.db.collection("artwork").deleteOne({name: req.params.name});

    res.sendStatus(200)
}

function getEra(year) {
    let wordEra = ["", "Medival Art", "Renaissance", "Neoclassicism", "Romanticism", "Modern art", "Contemporary art", "Futuristic Art"]
    let index = [0, 1400, 1602, 1830, 1930, 1952, 2022, Infinity].findIndex((era) => year<= era)
    return wordEra[index];
}

module.exports = router;