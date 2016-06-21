var express = require('express');
var router = express.Router();
var co = require('co');
var generate = require('node-chartist');
var fs = require('fs');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/survey');

router.get('/', function(req, res, next) {
	var collection = db.get('survey');
	
	var numRows = 0; //array rows, represents number of series in bar charts
	var numColumns = 0; //array columns, represents number of columns on x axis in bar charts
	var numSlice = 0; //pie chart slices
	
	// options for bar charts
	var options_bar = {
		width: 1000, height: 600, high: 5, low: 1, seriesBarDistance: 10,
		axisX: { 
			title:'Pitanje', 
			offset: 50,
			labelOffset: {
			  x: 88,
			  y: 0
			},
		},
		axisY:  { 
			title:'Prosječna ocjena', 
			offset: 75
		}
	};
	
	//labels for bar charts
	var data_bar = {
		labels: ['3.','4.','5.','6.','7.'],
		series: []
	};
	
	var data_pie = {
		series: []
	};
	
	switch(req.query.pick){
		case 'all_total': {
			collection.find({},function(e,docs){
				
				numRows = 5;
				numColumns = 5;
				var arr = Create3DArray(numRows,numColumns,2);
				
				docs.forEach(function(entry,index){
					//for questions 3.-7. saves response count and answer sum (to get average for each type)
					AddCount(arr,entry,'type','athome',0);
					AddCount(arr,entry,'type','silent',1);
					AddCount(arr,entry,'type','devices',2);
					AddCount(arr,entry,'type','group',3);
					AddCount(arr,entry,'type','loud',4);
				});
				
				GenerateBarDataSeries(arr,numRows,numColumns,data_bar,'type');
				CreateChartAndRender('bar','chart.html',options_bar,data_bar,res,req);
			});
			break;
		}
		case 'count_one':{
			// only those with 1 device (count = 2 (weird, ikr?))
			collection.find({count: '2'},function(e,docs){
				
				numRows = 5;
				numColumns = 5;
				var arr = Create3DArray(numRows,numColumns,2);
				
				docs.forEach(function(entry,index){
					AddCount(arr,entry,'type','athome',0);
					AddCount(arr,entry,'type','silent',1);
					AddCount(arr,entry,'type','devices',2);
					AddCount(arr,entry,'type','group',3);
					AddCount(arr,entry,'type','loud',4);
				});
				
				GenerateBarDataSeries(arr,numRows,numColumns,data_bar,'type');
				CreateChartAndRender('bar','chart.html',options_bar,data_bar,res,req);
			});
			break;
		}
		case 'count_two':{
			// only those with 2 devices (count = 1)
			collection.find({count: '1'},function(e,docs){
				
				numRows = 5;
				numColumns = 5;
				var arr = Create3DArray(numRows,numColumns,2);
				
				docs.forEach(function(entry,index){
					AddCount(arr,entry,'type','athome',0);
					AddCount(arr,entry,'type','silent',1);
					AddCount(arr,entry,'type','devices',2);
					AddCount(arr,entry,'type','group',3);
					AddCount(arr,entry,'type','loud',4);
				});
				
				GenerateBarDataSeries(arr,numRows,numColumns,data_bar,'type');
				CreateChartAndRender('bar','chart.html',options_bar,data_bar,res,req);
			});
			break;
		}
		case 'all_timeused':{
			//columns are 'timeused' options
			collection.find({},function(e,docs){
				
				numRows = 5;
				numColumns = 5;
				var arr = Create3DArray(numRows,numColumns,2);
				
				docs.forEach(function(entry,index){
					AddCount(arr,entry,'timeused','athome',0);
					AddCount(arr,entry,'timeused','silent',1);
					AddCount(arr,entry,'timeused','devices',2);
					AddCount(arr,entry,'timeused','group',3);
					AddCount(arr,entry,'timeused','loud',4);
				});
				
				GenerateBarDataSeries(arr,numRows,numColumns,data_bar,'timeused');
				CreateChartAndRender('bar','chart.html',options_bar,data_bar,res,req);
			});
			break;
		}
		case 'all_count':{
			//columns in graph are 'count' options
			collection.find({},function(e,docs){
				
				numRows = 2;
				numColumns = 5;
				var arr = Create3DArray(numRows,numColumns,2);
				
				docs.forEach(function(entry,index){
					AddCount(arr,entry,'count','athome',0);
					AddCount(arr,entry,'count','silent',1);
					AddCount(arr,entry,'count','devices',2);
					AddCount(arr,entry,'count','group',3);
					AddCount(arr,entry,'count','loud',4);
				});
				
				GenerateBarDataSeries(arr,numRows,numColumns,data_bar,'count');
				CreateChartAndRender('bar','chart.html',options_bar,data_bar,res,req);
			});
			break;
		}
		case 'all_ear':{
			collection.find({},function(e,docs){
				numSlice = 2;
				
				var tmp = [];
				for (var i=0; i<numSlice; i++){
					tmp[i] = 0;
				};
				
				docs.forEach(function(entry,index){
					tmp[entry['count']-1] += 1;
				});
				
				for (var i = 0; i<numSlice; i++){
					data_pie.series.push({name: CountName(i), value: tmp[i]});
				};
				
				var options_pie = {
					width: 800, 
					height: 400,
					//donut: true
					labelInterpolationFnc: function(value) {
						//creates label "(number) x%" on pie chart
						return '(' + value + ')' + ' ' + Math.round(value / Sum(data_pie.series) * 100) + '%';
					}
				};
				CreateChartAndRender('pie','chart.html',options_pie,data_pie,res,req)
			});
			break;
		}
		case 'all_time':{
			collection.find({},function(e,docs){
				numSlice = 4;
				
				var tmp = [];
				for (var i=0; i<numSlice; i++){
					tmp[i] = 0;
				};
				
				docs.forEach(function(entry,index){
					tmp[entry['timeused']-1] += 1;
				});
				
				for (var i = 0; i<numSlice; i++){
					data_pie.series.push({name: TimeusedName(i), value: tmp[i]});
				};
				
				var options_pie = {
					width: 800, 
					height: 400,
					//donut: true
					labelInterpolationFnc: function(value) {
						//creates label "(number) x%" on pie chart
						return '(' + value + ')' + ' ' + Math.round(value / Sum(data_pie.series) * 100) + '%';
					}
				};
				CreateChartAndRender('pie','chart.html',options_pie,data_pie,res,req);
			});
			break;
		}
		case 'all_type':{
			collection.find({},function(e,docs){
				numSlice = 5;
				
				var tmp = [];
				for (var i=0; i<numSlice; i++){
					tmp[i] = 0;
				};
				
				docs.forEach(function(entry,index){
					tmp[entry['type']-1] += 1;
				});
				
				for (var i = 0; i<numSlice; i++){
					data_pie.series.push({name: TypeName(i), value: tmp[i]});
				};
				
				var options_pie = {
					width: 800, 
					height: 400,
					//donut: true
					labelInterpolationFnc: function(value) {
						//creates label "(number) x%" on pie chart
						return '(' + value + ')' + ' ' + Math.round(value / Sum(data_pie.series) * 100) + '%';
					}
				};
				CreateChartAndRender('pie','chart.html',options_pie,data_pie,res,req);
			});
			break;
		}
		default:{
			res.render('results', { title: 'Results', chart: 'chart.html' });
		}
	};
});

// generate bar data series
function GenerateBarDataSeries(arr,numRows,numColumns,data,graphColumn){
	var tmp = [];
	for (var i=0;i<numRows;i++){
		tmp[i] = [];
		for (var j=0;j<numColumns;j++){
			if(arr[i][j][0]!=0){
				tmp[i][j] = arr[i][j][1]/arr[i][j][0];
			}else{
				tmp[i][j]=0;
			};
		};
		
		switch(graphColumn){
			case 'type':
				data.series.push({name: TypeName(i), value: tmp[i]});
				break;
			case 'timeused':
				data.series.push({name: TimeusedName(i), value: tmp[i]});
				break;
			case 'count':
				data.series.push({name: CountName(i), value: tmp[i]});
				break;
		};
	};
};

// returns sum of all values (used in pie charts for calculating percentages)
function Sum(data){
	var ret_val = 0;
	data.forEach(function(entry,index){
		ret_val += entry.value;
	});
	return ret_val;
};

//return type name
function TypeName(index){
	switch(index){
		case 0: return 'STD';
		case 1: return 'OSN';
		case 2: return 'PLUS';
		case 3: return 'NAP';
		case 4: return 'PREM';
	};
};

//return timeused name
function TimeusedName(index){
	switch(index){
		case 0: return 'Povremeno';
		case 1: return '<1h dnevno';
		case 2: return '1-3h dnevno';
		case 3: return '3h+ dnevno';
	};
};

//return count name
function CountName(index){
	switch(index){
		case 0: return 'Oba uha';
		case 1: return 'Jedno uho';
	};
};

// generates bar/pie chart based on parameters, saves it, responds to request
var CreateChartAndRender = co.wrap(function * (type,name,options,data,res,req) {
	//arguments: type - type of chart; name - output html file name; options,data - generating options and data; res - response
	var chart = '<head><link rel="stylesheet" href="/stylesheets/main.css"></link><head><body>';
	chart += yield generate(type, options, data); //=> chart HTML
	chart +='</body>';
	
	fs.writeFile('public/'+name, chart, function (err) {
		if (err) return console.log(err);
		console.log('Chart created!'+(new Date()));
		res.render('results', { title: 'Results', chart: name, last: req.query.pick});
	});
});
		

function AddCount(array,entry,inColumns,field,index){
	if(parseInt(entry[field])!=0){
		array[parseInt(entry[inColumns])-1][index][0]+=1;
		array[parseInt(entry[inColumns])-1][index][1]+=parseInt(entry[field]);
	};
};

function Create3DArray(types,ques,vals) {
	//initializes and fills 3D array with zeroes
    var arr = [];
	for (var i=0;i<types;i++){
		arr[i] = [];
		for (var j=0;j<ques;j++){
			arr[i][j] = [];
			for (var k=0;k<vals;k++){
				arr[i][j][k]=0;
			};
		};
	};
	
	return arr;
};


/* *******************************
	ROUTES FOR TESTING PURPOSES
******************************** */

router.get('/all', function(req, res, next) {
	//temporary for testing purposes, returns all results
	var collection = db.get('survey');
	collection.find({},{sort: {type: 1}},function(e,docs){
		var x = [];
		x[0] = [];
		x[1] = [];
		x[1][0]=0;
		x[1][1]=0;
		var val;
		docs.forEach(function(entry,index){
			//a += entry['name'] + ' ';
			x[1][0] += 1;
			x[1][1] += parseInt(entry['athome']);
		});
		val=x[1][1]/x[1][0];
		val = Math.round(val * 100) / 100;
		res.json({"docs:":docs});
	});
});

router.get('/test', function(req, res, next) {
	//calculated count and sum of responses
	var collection = db.get('survey');
	collection.find({},function(e,docs){
		var arr = Create3DArray(5,5,2);
			docs.forEach(function(entry,index){
				AddCount(arr,entry,'athome',0);
				AddCount(arr,entry,'silent',1);
				AddCount(arr,entry,'devices',2);
				AddCount(arr,entry,'group',3);
				AddCount(arr,entry,'loud',4);
			});
		res.json(arr);
	});
});

/* *****************
	END OF ROUTES
****************** */

module.exports = router;