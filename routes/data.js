var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/survey');

//last export return code
var exp = undefined;

router.get('/', function(req, res, next) {
	var collection = db.get('survey');
	collection.count({},function(e,docs) {
		res.render('data', { title: 'Data', count: docs, exp: exp });
		exp = undefined;
	});
	
});

router.post('/export', function(req,res,next){
	//calls backup.bat script which exports database to JSON and CSV files with date/time of export
	const spawn = require('child_process').spawn;
	const bat = spawn('cmd.exe', ['/c', 'backup.bat']);

	bat.stdout.on('data', (data) => {
		console.log('stdout: ', data);
	});

	bat.stderr.on('data', (data) => {
		console.log('stderr: ', data);
	});

	bat.on('exit', (code) => {
		console.log('Child exited with code '+code+'!');
		exp = code;
		res.redirect('/data');
	});
});

router.get('/test', function(req, res, next) {
	//var collection = db.get('survey');
	//return all
	/*
	collection.find({},function(e,docs){
		res.send(docs);
	});
	*/

	//count
	/*
	collection.count({},function(e,docs) {
		res.send({"count:":docs});
	});
	*/
	res.send('test page');
});

module.exports = router;
