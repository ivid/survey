var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/survey');


router.get('/', function(req, res, next) {
	res.render('survey', { title: 'Survey', success: '' });
});

router.post('/', function(req, res) {
    var collection = db.get('survey');

    collection.insert({
		"name" : req.body.name,
		"surname" : req.body.surname,
		"location" : req.body.location,
		"type" : req.body.type,
		"timeused" : req.body.timeused,
		"count" : req.body.count,
		"athome" : req.body.athome,
		"silent" : req.body.silent,
		"devices" : req.body.devices,
		"group" : req.body.group,
		"loud" : req.body.loud,
		"note" : req.body.note
    }, function (err, doc) {
        if (err) {
            res.render('survey', { title: 'Survey', success: 'Problem encountered inserting to database! ' + (new Date()) + '' });
        }
        else {
			res.render('survey', { title: 'Survey', success: 'Insert successful! ' + (new Date()) + '' });
        }
    });
});


module.exports = router;