var express = require('express');
var app = express();
var mongoose = require('mongoose');
var assert = require('assert');
//var MONGODBURL = 'mongodb://COMPS381F:381project@ds054128.mongolab.com:54128/MongoLab-2';
var MONGODBURL = 'mongodb://65.52.186.24:27017/MongoLab-2';
var restaurantSchema = require('./models/restaurants');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var returnObj = {
	'msg' : '',
	'code' : 0
}
var defaultObject = 
	{ 'address' : { 
		'building' : "",
		'coord' : [0, 0],
		'street' : "",
		'zipcode' : "" },
	  'borough' : "",
	  'cuisine' : "",
	  'grades' : [],
	  'name' : "",
	  'restaurant_id' : "" };

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.get('/', function(req,res) {
    res.sendFile(__dirname + '/public/index.html');  // serve static files
});

app.get('/newForm', function(req,res) {
	res.sendFile(__dirname + '/public/input.html');
});


//Create
//new restaurant
//need check id exist *****
app.post('/addRes', urlencodedParser, function(req,res) {
	
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	
	if ((req.body.name == null) || (req.body.name == '')){
		err.msg = 'Required Name fields missing!';
	}else if ((req.body.borough == null) || (req.body.borough == '')){
		err.msg = 'Required Borough fields missing!';
	}else if ((req.body.cuisine == null) || (req.body.cuisine == '')){
		err.msg = 'Required Cuisine fields missing!';
	}else if ((req.body.restaurant_id == null) || (req.body.restaurant_id == '')){
		err.msg = 'Required Restaurant ID fields missing!';
	}
	if (err.msg != ''){
		err.code = 10;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			var err = returnObj;
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			//check if id exist first
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			modelObj.aggregate(
				{$group : {_id : "$restaurant_id", counting : {$sum : 1}}}, 
				{$match : {_id : queryObj.restaurant_id}},
				function (err, results){
					if (results.length == 0){
						var newObject = defaultObject;
						if (queryObj.building != null){newObject.address.building = queryObj.building};
						if (queryObj.coord1 != null){newObject.address.coord[0] = parseFloat(queryObj.coord1)};
						if (queryObj.coord2 != null){newObject.address.coord[1] = parseFloat(queryObj.coord2)};
						if (queryObj.street != null){newObject.address.street = queryObj.street};
						if (queryObj.zipcode != null){newObject.address.zipcode = queryObj.zipcode};
						newObject.borough = queryObj.borough;
						newObject.cuisine = queryObj.cuisine;
						newObject.name = queryObj.name;
						newObject.restaurant_id = queryObj.restaurant_id;
						
						var documentObj = new modelObj(newObject);
						documentObj.save(function(error){
							if (error != null){
								var err = returnObj;
								err.msg = 'Error occour while saving the new record! Detail = ' + error;
								err.code = 11;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(err));
							}else{								
								var success = {
									'msg' : '',
									'code' : 0
								};
								success.msg = 'Success adding new restaurant record';
								success.code = 0;
								res.writeHead(200, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(success));
							}
							db.close();
						});	
					}else{
						err.msg = 'Restaurant ID is already existed!';
						err.code = 12;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(success));
						db.close();
					}
				}
			);
		});
	}
});


			
app.post('/addGrades', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	if ((req.body.restaurant_id == null) || (req.body.restaurant_id == '')) {
		err.msg = 'The target restaurant is not specific mentioned!';
		err.code = 20;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.body.date == null) || (req.body.date == '')){
		err.msg = 'Date is missing!';
		err.code = 21;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.body.grade == null) || (req.body.grade == '')){
		err.msg = 'Grade is missing!';
		err.code = 22;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.body.score == null) || (req.body.score == '')){
		err.msg = 'Score is missing!';
		err.code = 23;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var targetResName = '';
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			
			var gradeSchema = mongoose.Schema({
				date: Date, 
				grade: String, 
				score: Number,
			});
			gradeModel = mongoose.model('gradeSchema', gradeSchema);
			var newObject = {
				date : Date,
				grade : String,
				score : Number
			}
			
			newObject.date = new Date(Date.parse(queryObj.date));
			newObject.grade = queryObj.grade;
			newObject.score = parseFloat(queryObj.score);
			modelObj.find(
				{restaurant_id : queryObj.restaurant_id},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 24;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant match!';
						err.code = 25;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						targetResName = results[0].name;
						modelObj.update(
							{restaurant_id : queryObj.restaurant_id},
							{ $push: { grades: newObject }},
							{multi : true},
							function(results, error){
								if (error['ok'] != 1){
									err.msg = 'Error occour while saving the new record! Detail = ' + JSON.stringify(error);
									err.code = 48;
									res.writeHead(404, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(err));
									db.close();
								}else{									
									var success = {
										'msg' : '',
										'code' : 0
									};
									success.msg = 'Success adding new grade to record of following restaurant : ' + targetResName;
									success.code = 0;
									res.writeHead(200, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(success));
									db.close();
								}
							}
						);
					}
				}
			);
		});
		
	}
});


//Remove
//Remove Restaurant

app.delete('/delRes', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	if (JSON.stringify(req.body) == "{}") {
		err.msg = 'The target restaurant is not specific mentioned!';
		err.code = 30;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var targetResName = '';
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			var criteria = {};
			if (queryObj.restaurant_id != null){
				criteria.restaurant_id = queryObj.restaurant_id;
			}else{
				if (queryObj.building != null){criteria.address.building = queryObj.building};
				if (queryObj.coord1 != null){criteria.address.coord[0] = parseFloat(queryObj.coord1)};
				if (queryObj.coord2 != null){criteria.address.coord[1] = parseFloat(queryObj.coord2)};
				if (queryObj.street != null){criteria.address.street = queryObj.street};
				if (queryObj.zipcode != null){criteria.address.zipcode = queryObj.zipcode};
				if (queryObj.borough != null){criteria.borough = queryObj.borough};
				if (queryObj.cuisine != null){criteria.cuisine = queryObj.cuisine};
				if (queryObj.name != null){criteria.name = queryObj.name};
			}
			modelObj.find(
				criteria,
				function(error, results){;
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 31;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant match!';
						err.code = 32;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						var waitList = [];
						for (i in results){
							waitList.push(results[i].restaurant_id);
						}
						var output = {
							'targetRemovedRestaurant' : waitList,
							'msg' : '',
							'code' : 0
						};
						modelObj.remove({restaurant_id : {$in : waitList}}, function(error2){
							if (error2 != null){
								output.msg = error2;
								output.code = 33;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
							}else{
								output.msg = 'Success!'
								res.writeHead(200, {'Content-type' : 'application/JSON'});
							}
							res.end(JSON.stringify(output));
							db.close();
						});
					}
				}
			);
			
		});
					
	}
});

app.delete('/delGradesByID', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	if ((req.body._id == null) || (req.body._id == '')) {
		err.msg = 'The target grades record is not specific mentioned!';
		err.code = 40;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if (req.body._id.length != 24) {
		err.msg = 'The grades record id inputted is not valid!';
		err.code = 41;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var targetResName = '';
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			var ObjectId = require('mongoose').Types.ObjectId;
			modelObj.find(
			
				{grades : {$elemMatch : {_id : ObjectId(queryObj._id)}}},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 42;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No grades record match!';
						err.code = 43;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						var ress = {"Restaurant_ID" : results[0].restaurant_id, "Name" : results[0].name};
						var de = {"_id" : results[0].grades[0]._id, "date" : results[0].grades[0].date, "grade" : results[0].grades[0].grade, "score" : results[0].grades[0].score};
						modelObj.update (
							{"restaurant_id" : results[0].restaurant_id},
							{$pull : {grades : {_id : ObjectId(queryObj._id)}}},
							function ( error ) {
								if (error != null){
									err.msg = 'Error occour deleting the grades record! Detail = ' + JSON.stringify(error);
									err.code = 44;
									res.writeHead(404, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(err));
									db.close();
								}else{									
									var success = {
										'target Grades Record' : de,
										'target Restaurant' : ress,
										'msg' : "Success!",
										'code' : 0
									};
									success.code = 0;
									res.writeHead(200, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(success));
									db.close();
								}
							}
						);
					}
				}
			);
		});
					
	}
});

app.delete('/delAllGrades', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	if ((req.body.restaurant_id == null) || (req.body.restaurant_id == '')) {
		err.msg = 'The target restaurant is not specific mentioned!';
		err.code = 50;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var targetResName = '';
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			
			modelObj.find(
				{restaurant_id : queryObj.restaurant_id},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 51;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant match!';
						err.code = 52;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						targetResName = results[0].name;
						modelObj.update (           
							{restaurant_id: req.body.restaurant_id},
							{$set : {grades: []}},
							{multi : true},
							function ( error ) {
								if (error != null){
									err.msg = 'Error occour deleting the grades record! Detail = ' + JSON.stringify(error);
									err.code = 53;
									res.writeHead(404, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(err));
									db.close();
								}else{									
									var success = {
										'msg' : '',
										'code' : 0
									};
									success.msg = 'Success deleting all the grades record of the following restaurant : ' + targetResName;
									success.code = 0;
									res.writeHead(200, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(success));
									db.close();
								}
							}
						);
					}
				}
			);
		});
					
	}
});


app.delete('/delResWithNoGradesRecord', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			
			modelObj.find(
				{grades : []},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 60;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant found with no grading records!';
						err.code = 61;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						
						var waitList = [];
						for (i in results){
							waitList.push(results[i]._id);
						}
						var output = {
							'targetRemovedRestaurant' : waitList,
							'msg' : '',
							'code' : 0
						};
						modelObj.remove({_id : {$in : waitList}}, function(error2){
							if (error2 != null){
								output.msg = error2;
								output.code = 62;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
							}else{
								res.writeHead(200, {'Content-type' : 'application/JSON'});
							}
							res.end(JSON.stringify(output));
							db.close();
						});
						
					}
				}
			);
		});
		
});



app.delete('/delResWithAvgScoreBelowSpecificValue', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	var matchCriteria = {};
	if (req.body.score == null){
		err.msg = 'The score criteria is not provided!';
		err.code = 70;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if (req.body.condition == null){
		err.msg = 'The condition criteria is not provided!';
		err.code = 71;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else {
		if (req.body.condition == 'lt'){
			matchCriteria = {average : {$lt : parseFloat(req.body.score)}}
		}else{
			matchCriteria = {average : {$lte : parseFloat(req.body.score)}}
		}

		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			
			modelObj.aggregate(
				{$unwind : "$grades"},
				{$group : {_id : "$restaurant_id", average : {$avg : "$grades.score"}}},
				{$match : matchCriteria},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while saving the new record! Detail = ' + error;
						err.code = 72;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant found with no grading records!';
						err.code = 73;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						
						var waitList = [];
						for (i in results){
							waitList.push(results[i]._id);
						}
						var output = {
							'targetRemovedRestaurant' : waitList,
							'msg' : '',
							'code' : 0
						};
						modelObj.remove({restaurant_id : {$in : waitList}}, function(error2){
							if (error2 != null){
								output.msg = error2;
								output.code = 74;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
							}else{
								res.writeHead(200, {'Content-type' : 'application/JSON'});
							}
							res.end(JSON.stringify(output));
							db.close();
						});
						
					}
				}
			);
		});
	
	}
		
});

app.delete('/delResWithLowestAverageScore', urlencodedParser, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			//case for aggregate
			//{$group : {_id : [target], [operation counting : {$sum: 1}]}}, {$sort: {}}}
			
			modelObj.aggregate(
				{$unwind : "$grades"},
				{$group : {_id : "$restaurant_id", average : {$avg : "$grades.score"}}},
				{$sort : {average : 1}},
				{$limit : 1},
				function (error, results){
					if (error != null){
						err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
						err.code = 80;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant records are found!';
						err.code = 81;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						var max = results[0].average;
						modelObj.aggregate(
							{$unwind : "$grades"},
							{$group : {_id : {id : "$restaurant_id", name : "$name"}, average : {$avg : "$grades.score"}}},
							{$match : {average : max}},
							{$project : {_id : 1}},
							function (error, results){
								if (error != null){
									err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
									err.code = 82;
									res.writeHead(404, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(err));
									db.close();
								}else if (results.length == 0){
									err.msg = 'No restaurant records are found!';
									err.code = 83;
									res.writeHead(404, {'Content-type' : 'application/JSON'});
									res.end(JSON.stringify(err));
									db.close();
								}else{
									var waitID = [];
									var waitName = [];
										
										
									for (i in results){
										waitID[i] = results[i]._id.id;
										waitName[i] = results[i]._id.name;
									}	
									modelObj.remove({restaurant_id : {$in : waitID}}, function(error, results){
										if (error != null){
											err.msg = 'Error occour while deleting restaurant! Detail = ' + error;
											err.code = 84;
											res.writeHead(404, {'Content-type' : 'application/JSON'});
											res.end(JSON.stringify(err));
											db.close();
										}else{
											var resu = []
											for (i in waitID){
												resu.push({'Restaurant_ID' : waitID[i], 'Name' : waitName[i]});
											}
											res.writeHead(200, {'Content-type' : 'application/JSON'});
											res.end(JSON.stringify({'Lowest Average Score' : max, 'Removed Restaurant' : resu}));	
											db.close();
										}
									});
								}
							}
						);
					}
				}
			);		
				
		});
	
});
	
//Update
//UpdateRestaurantInfo

app.put('/updateResInfo', urlencodedParser, function(req,res) {
	
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	if ((req.body.restaurant_id == null) || (req.body.restaurant_id == '')){
		err.msg = 'Required Restaurant ID fields missing!';
		err.code = 90;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			//check if id exist first
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			modelObj.findOne(
				{restaurant_id : queryObj.restaurant_id}, 
				function (err, results){
					if (results != null){
						if (queryObj.building != null){results.address.building = queryObj.building};
						if (queryObj.coord1 != null){results.address.coord[0] = parseFloat(queryObj.coord1)};
						if (queryObj.coord2 != null){results.address.coord[1] = parseFloat(queryObj.coord2)};
						if (queryObj.street != null){results.address.street = queryObj.street};
						if (queryObj.zipcode != null){results.address.zipcode = queryObj.zipcode};
						if (queryObj.borough != null){results.borough = queryObj.borough};
						if (queryObj.cuisine != null){results.cuisine = queryObj.cuisine};
						if (queryObj.name != null){results.name = queryObj.name};
						
						results.save(function(error){
							if (error != null){
								err.msg = 'Error occour while saving the new record! Detail = ' + error;
								err.code = 91;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(err));
							}else{								
								var success = {
									'msg' : '',
									'code' : 0
								};
								success.msg = 'Success modifying restaurant infomation of ' + results.name;
								success.code = 0;
								res.writeHead(200, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(success));
							}
							db.close();
						});	
					}else{									
						err.msg = 'No restaurant fond!';
						err.code = 92;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(success));
						db.close();
					}
				}
			);
		});
	}
});

app.put('/updateResID', urlencodedParser, function(req,res) {
	
	var err = {
		'msg' : '',
		'code' : 0
	};
	
	
	 
	if ((req.body.old_id == null) || (req.body.old_id == '')){
		err.msg = 'Required Restaurant ID fields missing!';
		err.code = 100;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.body.new_id == null) || (req.body.new_id == '')){
		err.msg = 'Required Restaurant ID fields missing!';
		err.code = 101;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			//check if id exist first
			modelObj = mongoose.model("restaurant", restaurantSchema);
			var queryObj = req.body;
			modelObj.find(
				{restaurant_id : {$in : [req.body.old_id, req.body.new_id]}}, 
				function (error, results){
					if ((results.length == 0) || (results.length == null)){
						err.msg = 'No restaurant match!';
						err.code = 101;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 2){
						err.msg = 'The new restaurant id is already existed!';
						err.code = 102;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results[0].restaurant_id != req.body.old_id){
						err.msg = 'No restaurant match!';
						err.code = 103;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						results[0].restaurant_id = req.body.new_id;
						results[0].save(function(error2){
							if (error2 != null){
								err.msg = 'Error occour while saving the new record! Detail = ' + error2;
								err.code = 104;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(err));
								db.close();
							}else{								
								var success = {
									'msg' : '',
									'code' : 0
								};
								success.msg = 'Success modifying restaurant ID of ' + results[0].name + ' to ' + results[0].restaurant_id;
								success.code = 0;
								res.writeHead(200, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(success));
								db.close();
							}
						});
					}
					
				}
			);
		});
	}
});

//Display
//displayAll

app.get('/showAllResFullRecord', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	mongoose.connect(MONGODBURL);
	var db = mongoose.connection;
	db.on('error', function(){
		err.msg = 'Cannot connect to database server!';
		err.code = 1;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
		db.close();
	});
	db.once('open', function(callback){
		modelObj = mongoose.model("restaurant", restaurantSchema);
		modelObj.find(
			{},
			{_id : 0},
			function(error, results){
				if (error != null){
					err.msg = 'Error occour while showing all the record! Detail = ' + error;
					err.code = 110;
					res.writeHead(404, {'Content-type' : 'application/JSON'});
					res.end(JSON.stringify(err));
					db.close();
				}else if (results.length == 0){
					res.writeHead(200, {'Content-type' : 'application/JSON'});
					res.write('[]');
					res.end();
					db.close();
				}
				else{
					res.writeHead(200, {'Content-type' : 'application/JSON'});
					res.write(JSON.stringify(results));
					res.end();
					db.close();
				}
			}
		);
	});
});



app.get(/^\/search\/(.*)+/, function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	mongoose.connect(MONGODBURL);
	var db = mongoose.connection;
	db.on('error', function(){
		err.msg = 'Cannot connect to database server!';
		err.code = 1;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
		db.close();
	});
	db.once('open', function(callback){
		modelObj = mongoose.model("restaurant", restaurantSchema);
		var query = {};
		var projectOption = {_id : 0};
		if (req.params[0] != null){
			var paramStringArray = req.params[0].split('/');
			var i = 0;
			while (i < paramStringArray.length){
				if ((paramStringArray[i] == 'showGrade') && (paramStringArray[i+1] == 'false')){
					projectOption['grades'] = 0
				}else if (paramStringArray[i] == 'coord'){
					var temp = paramStringArray[i+1].split(',');
					query['address.coord'] = [parseFloat(temp[0]), parseFloat(temp[1])];
				}else if (paramStringArray[i] == 'building'){
					query['address.building'] = paramStringArray[i+1];
				}else if (paramStringArray[i] == 'street'){
					query['address.street'] = paramStringArray[i+1];
				}else if (paramStringArray[i] == 'zipcode'){
					query['address.zipcode'] = paramStringArray[i+1];
				}else{
					query[paramStringArray[i]] = paramStringArray[i+1];
				} 
				i += 2;
			}
		}
		modelObj.find(
			query,
			projectOption,
			function(error, results){
				if (error != null){
					err.msg = 'Error occour while showing all the record! Detail = ' + error;
					err.code = 120;
					res.writeHead(404, {'Content-type' : 'application/JSON'});
					res.end(JSON.stringify(err));
					db.close();
				}else if (results.length == 0){
					err.msg = 'No search result.';
					err.code = 121;
					res.writeHead(404, {'Content-type' : 'application/JSON'});
					res.end(JSON.stringify(err));
					db.close();
				}
				else{
					res.writeHead(200, {'Content-type' : 'application/JSON'});
					res.write(JSON.stringify(results));
					res.end();
					db.close();
				}
			}
		);
	});
});


app.get('/gradeInfo/:restaurant_id/:operation/:arg?', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	if ((req.params.restaurant_id == '') || (req.params.restaurant_id == null)){
		err.msg = 'The target restaurant is not specific mentioned!';
		err.code = 130;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.params.operation != 'showAllRecord') && (req.params.operation != 'showRecordCount') && (req.params.operation != 'specificGradeCount') && (req.params.operation != 'allGradeCount')){
		err.msg = 'The operation is not valid!';
		err.code = 131;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			//find if restaurant is existed or not
			modelObj.find(
				{restaurant_id : req.params.restaurant_id},
				function(error, results){
					if (error != null){
						err.msg = 'Error occour while showing all the record! Detail = ' + error;
						err.code = 132;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant match.';
						err.code = 133;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						
						//route operation
						if (req.params.operation == 'showAllRecord'){
							if (error != null){
								err.msg = 'Error occour while showing the grading record! Detail = ' + error;
								err.code = 134;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(err));
								db.close();
							}else if (results[0].grades.length == 0){
								res.writeHead(200, {'Content-type' : 'application/JSON'});
								res.write(JSON.stringify({'grades' : []}));
								res.end();
								db.close();
							}else{
								res.writeHead(200, {'Content-type' : 'application/JSON'});
								res.write(JSON.stringify(results[0].grades));
								res.end();
								db.close();
							}
								
						}else if (req.params.operation == 'showRecordCount'){
							modelObj.aggregate(
								{$unwind : "$grades"},
								{$group : {_id : "$restaurant_id", gradesRecordCount : {$sum : 1}}},
								{$match : {_id : req.params.restaurant_id}},
								{$project : {_id : 0, gradesRecordCount : 1}},
								function(error, results){
									if (error != null){
										err.msg = 'Error occour while showing the grading record! Detail = ' + error;
										err.code = 135;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else if (results.length == 0){
										err.msg = 'No grade records are found!';
										err.code = 136;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else{
										res.writeHead(200, {'Content-type' : 'application/JSON'});
										res.write(JSON.stringify(results[0]));
										res.end();
										db.close();
									}
								}
							);
						}else if ((req.params.operation == 'specificGradeCount') || (req.params.operation == 'allGradeCount')){
							if ((req.params.operation == 'specificGradeCount') && ((req.params.arg == '') || (req.params.arg == null))){
								err.msg = 'Target grade is not specificly mentioned!';
								err.code = 137;
								res.writeHead(404, {'Content-type' : 'application/JSON'});
								res.end(JSON.stringify(err));
								db.close();
							}else{
								var option = {};
								if (req.params.operation == 'specificGradeCount'){
									option = {"_id.restaurant_id" : req.params.restaurant_id, "_id.grade" : req.params.arg}
								}else if (req.params.operation == 'allGradeCount'){
									option = {"_id.restaurant_id" : req.params.restaurant_id}
								}
								modelObj.aggregate(
									{$unwind : "$grades"},
									{$group : {_id :
													{restaurant_id : "$restaurant_id", 
													grade : "$grades.grade"},
											   count: {$sum : 1}
											  }
									}, 
									{$sort : {"_id.grade" : 1}},
									{$match : option},
									function(error, results){
										if (error != null){
											err.msg = 'Error occour while showing the grading record! Detail = ' + error;
											err.code = 138;
											res.writeHead(404, {'Content-type' : 'application/JSON'});
											res.end(JSON.stringify(err));
											db.close();
										}else if (results.length == 0){
											res.writeHead(200, {'Content-type' : 'application/JSON'});
											res.end(JSON.stringify({"count" : 0}));
											db.close();
										}else{
											var resu = [];
											for (i in results){
												resu.push({"Grade" : results[i]._id.grade, "Count" : results[i].count});
											}
											res.writeHead(200, {'Content-type' : 'application/JSON'});
											res.end(JSON.stringify(resu));
											db.close();
										}
									}
								);
							}
						}
					}
				}
			
			);
		});
	}
});


app.get('/classStat/:restaurantClass/:operation/:sortOption?/:sortOption2?', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	if ((req.params.restaurantClass != 'borough') && (req.params.restaurantClass != 'cuisine') && (req.params.restaurantClass != 'borough+cuisine')){
		err.msg = 'The classification of restaruant is not specific mentioned!';
		err.code = 140;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else if ((req.params.operation != 'gradeRecordCounting') && (req.params.operation != 'averageScore') && (req.params.operation != 'gradeStatistics')){
		err.msg = 'The operation is not valid!';
		err.code = 141;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			//case for aggregate
			//{$group : {_id : [target], [operation counting : {$sum: 1}]}}, {$sort: {}}}
			var target = null;
			var operation = {};
			var sort = {};
			var match = {};
			
			if (req.params.operation == "gradeStatistics"){
				if (req.params.restaurantClass == 'borough'){
					target = {borough : "$borough", grade : "$grades.grade"};
				}else if (req.params.restaurantClass == 'cuisine'){
					target = {cuisine : "$cuisine", grade : "$grades.grade"};
				}else if (req.params.restaurantClass == 'borough+cuisine'){
					target = {borough : "$borough", cuisine : "$cuisine", grade : "$grades.grade"};
				}
				operation = {$sum : 1};
			}else{		
				if (req.params.restaurantClass == 'borough'){
					target = "$borough";
				}else if (req.params.restaurantClass == 'cuisine'){
					target = "$cuisine";
				}else if (req.params.restaurantClass == 'borough+cuisine'){
					target = {borough : "$borough", cuisine : "$cuisine"};
				}
				
				if (req.params.operation == 'gradeRecordCounting'){
					operation = {$sum : 1};
				}else if (req.params.operation == "averageScore"){
					operation = {$avg : "$grades.score"};
				}
			}
			
			if (req.params.sortOption2 != null){
				if (req.params.restaurantClass == 'borough+cuisine'){
					var a = req.params.sortOption2.toString().split("+");
					match = {'_id.borough' : a[0], '_id.cuisine' : a[1]};
				}else if (req.params.restaurantClass == 'borough'){
					match = {'_id.borough' : req.params.sortOption2};
				}else if (req.params.restaurantClass == 'cuisine'){
					match = {'_id.cuisine' : req.params.sortOption2};
				}
			}else{
				match = {_id : {$ne : ''}};
			}
			
			if ((req.params.sortOption != null) && ((req.params.sortOption == 'largest') || (req.params.sortOption == 'smallest'))){
				if (req.params.sortOption == 'largest'){
					sort = {$sort : {result : -1}};
				}else{
					sort = {$sort : {result : 1}};
				}
				modelObj.aggregate(
					{$unwind : "$grades"},
					{$group : {_id : target, result : operation}},
					sort,
					{$limit : 1},
					function (error, results){
						if (error != null){
							err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
							err.code = 142;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else if (results.length == 0){
							err.msg = 'No restaurant records are found!';
							err.code = 143;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else{
							var num = results[0].result;
							modelObj.aggregate(
								{$unwind : "$grades"},
								{$group : {_id : target, result : operation}},
								sort,
								{$match : {result : num}, match},
								{$project : {_id : 1}},
								function (error, results){
									if (error != null){
										err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
										err.code = 144;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else if (results.length == 0){
										err.msg = 'No restaurant records are found!';
										err.code = 145;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else{
										res.writeHead(200, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify({'Result' : num, 'Restaurant' : results}));
										db.close();
									}
								}
							);
						}
					}
				);
			}else{
				if ((req.params.sortOption != null) && (req.params.sortOption == 'desc')){
					sort = {$sort : {result : -1}};
				}else{
					sort = {$sort : {result : 1}};
				}
				modelObj.aggregate(
					{$unwind : "$grades"},
					{$group : {_id : target, result : operation}},
					{$match : match},
					sort,
					function (error, results){
						if (error != null){
							err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
							err.code = 146;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else if (results.length == 0){
							err.msg = 'No restaurant records are found!';
							err.code = 147;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else{
							res.writeHead(200, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(results));
							db.close();
						}
					}
				);
			}	
		
			
		});
	}
});

app.get('/allStat/:operation', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	if ((req.params.operation != 'gradeRecordCounting') && (req.params.operation != 'averageScore') && (req.params.operation != 'gradeStatistics')){
		err.msg = 'The operation is not valid!';
		err.code = 150;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			//case for aggregate
			//{$group : {_id : [target], [operation counting : {$sum: 1}]}}, {$sort: {}}}
			var target = {};
			var operation = {};
			var sort = {};
			
			if (req.params.operation == "gradeStatistics"){
				operation = {$sum : 1};
				target = {$group : {_id : {grade : "$grades.grade"}, result : operation}};
			}else if (req.params.operation == 'gradeRecordCounting'){
				operation = {$sum : 1};
				target = {$group : {_id : "No. of record", result : operation}};
			}else if (req.params.operation == "averageScore"){
				operation = {$avg : "$grades.score"};
				target = {$group : {_id : "Average Score", result : operation}};
			}
			
			if (req.params.operation == "gradeStatistics"){
				sort = {$sort : {"_id.grade" : 1}};
			}else{
				sort = {$sort : {result : 1}};
			}
			modelObj.aggregate(
				{$unwind : "$grades"},
				target,
				sort,
				function (error, results){
					if (error != null){
						err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
						err.code = 151;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else if (results.length == 0){
						err.msg = 'No restaurant records are found!';
						err.code = 152;
						res.writeHead(404, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(err));
						db.close();
					}else{
						res.writeHead(200, {'Content-type' : 'application/JSON'});
						res.end(JSON.stringify(results));
						db.close();
					}
				}
			);	
		});
	}
});


app.get('/specificRes/:operation', function(req,res) {
	var err = {
		'msg' : '',
		'code' : 0
	};
	if ((req.params.operation != 'highestAverageScore') && (req.params.operation != 'lowestAverageScore') && (req.params.operation != 'highestAGrade')){
		err.msg = 'The operation is not valid!';
		err.code = 160;
		res.writeHead(404, {'Content-type' : 'application/JSON'});
		res.end(JSON.stringify(err));
	}else{
		mongoose.connect(MONGODBURL);
		var db = mongoose.connection;
		db.on('error', function(){
			err.msg = 'Cannot connect to database server!';
			err.code = 1;
			res.writeHead(404, {'Content-type' : 'application/JSON'});
			res.end(JSON.stringify(err));
			db.close();
		});
		db.once('open', function(callback){
			modelObj = mongoose.model("restaurant", restaurantSchema);
			//case for aggregate
			//{$group : {_id : [target], [operation counting : {$sum: 1}]}}, {$sort: {}}}
			var target = {};
			var operation = {};
			var sort = 0;
			
			if ((req.params.operation == "highestAverageScore") || (req.params.operation == "lowestAverageScore")){
				if (req.params.operation == "lowestAverageScore"){
					sort = 1;
				}else{
					sort = -1;
				}
				modelObj.aggregate(
					{$unwind : "$grades"},
					{$group : {_id : "$restaurant_id", average : {$avg : "$grades.score"}}},
					{$sort : {average : sort}},
					{$limit : 1},
					function (error, results){
						if (error != null){
							err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
							err.code = 161;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else if (results.length == 0){
							err.msg = 'No restaurant records are found!';
							err.code = 162;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else{
							var max = results[0].average;
							modelObj.aggregate(
								{$unwind : "$grades"},
								{$group : {_id : {id : "$restaurant_id", name : "$name"}, average : {$avg : "$grades.score"}}},
								{$match : {average : max}},
								{$project : {_id : 1}},
								function (error, results){
									if (error != null){
										err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
										err.code = 163;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else if (results.length == 0){
										err.msg = 'No restaurant records are found!';
										err.code = 164;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else{
										res.writeHead(200, {'Content-type' : 'application/JSON'});
										if (req.params.operation == "lowestAverageScore"){
											res.end(JSON.stringify({"Lowest Average Score" : max, "Restaurant" : results}));
										}else{
											res.end(JSON.stringify({"Highest Average Score" : max, "Restaurant" : results}));
										}
										
										db.close();
									}
								}
							);
						}
					}
				);		
				
			}else{
				modelObj.aggregate(
					{$unwind : "$grades"},
					{$group : {_id : {id : "$restaurant_id", grade : "$grades.grade"}, sum : {$sum : 1}}},
					{$match : {"_id.grade" : "A"}},
					{$sort : {sum : -1}},
					{$limit : 1},
					function (error, results){
						if (error != null){
							err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
							err.code = 165;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else if (results.length == 0){
							err.msg = 'No restaurant records are found!';
							err.code = 166;
							res.writeHead(404, {'Content-type' : 'application/JSON'});
							res.end(JSON.stringify(err));
							db.close();
						}else{
							var max = results[0].sum;
							modelObj.aggregate(
								{$unwind : "$grades"},
								{$group : {_id : {id : "$restaurant_id", name : "$name", grade : "$grades.grade"}, sum : {$sum : 1}}},
								{$match : {"_id.grade" : "A", sum : max}},
								{$project: {"_id.id" : 1, "_id.name" : 1}},
								function (error, results){
									if (error != null){
										err.msg = 'Error occour while showing the grading statistics information! Detail = ' + error;
										err.code = 31;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else if (results.length == 0){
										err.msg = 'No restaurant records are found!';
										err.code = 167;
										res.writeHead(404, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify(err));
										db.close();
									}else{
										res.writeHead(200, {'Content-type' : 'application/JSON'});
										res.end(JSON.stringify({"Restaurant" : results, "No. of A Grade" : max}));
										db.close();
									}
								}
							);
						}
					}
				);
			}
		});
	}
});
	

app.listen(process.env.PORT || 8099);
