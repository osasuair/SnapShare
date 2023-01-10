const express = require('express');

function newNotif(req, user, notification) {
    let id = "" + Date.now() + Math.random();
    req.app.locals.db.collection("users").updateOne({"username": user}, {$push: {notifs: {id: id, notification: notification}}});
}

function delNotif(req, user, id) {
    req.app.locals.db.collection("users").updateOne({"username": user}, {$pull: {notifs: {id: id}}}, function(err, result){
        if(err|| result.modifiedCount == 0) {
            return false;
        }
        return true;
    });
}

module.exports = {newNotif, delNotif}