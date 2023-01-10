const express = require('express');
const router = express.Router();
let ObjectId = require('mongodb').ObjectId;

router.get("/", searchPage);
router.get("/results", results);

function searchPage(req, res) {
    req.app.locals.db.collection("artwork").distinct("category", function(err1, categories) {
        req.app.locals.db.collection("artwork").distinct("era", function(err2, eras) {
            if (err1 ||err2) {
                res.status(500).send("Cannot Read Database");
                return;
            }
            req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
                res.render("search", {categories, eras, notifs: user.notifs, artist: req.session.artist});            
            });
        });
    });
}

async function results(req, res) {
    let query= {};
    let skip = 0;
    let limit = 6;

    let url = "/feed/search" +req.url.split("skip="+req.query.skip).join("").replace("&&", "&")
    url = url.endsWith("&") ? url.slice(0, -1) : url
    // Convert url query to query for mongodb
    if(req.query.artist)
		query.artist = {"$regex" : ".*" + req.query.artist + ".*", "$options": "i"};
    if(req.query.name)
		query.name = {"$regex" : ".*" + req.query.name + ".*", "$options": "i"};
	if(req.query.description)
		query.description = {"$regex" : ".*" + req.query.description + ".*", "$options": "i"};
    if(req.query.category)
        query.category = req.query.category;
    if(req.query.era)
        query.era = req.query.era;
    if(req.query.skip) {
        skip = (Number(req.query.skip)<0 ? 0 : Number(req.query.skip));
    }

    const artwork = await req.app.locals.db.collection("artwork").find(query).limit(limit).sort("time", -1).skip(skip*limit).toArray();
    const total = await req.app.locals.db.collection("artwork").countDocuments(query);

    req.app.locals.db.collection("users").findOne({"_id": ObjectId(req.session.userId)}, function(err, user){
        res.render("search-result", {notifs: user.notifs, artist: req.session.artist, artwork, total, limit, skip, url});
    });
}

module.exports = router;