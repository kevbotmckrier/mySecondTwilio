//import required modules
var qs = require('querystring');
var moment = require('moment');
var http = require('http');
var mysql = require('mysql');

var tzSet = require('./tzSet.js');
var responses = require('./gameRespond.js');

//create mysql connection
var pool  = mysql.createPool({
    connectionLimit: 10,
    host: process.env.nbaSchedHost,
    user: process.env.nbaSchedUser,
    password: process.env.nbaSchedPassword,
    multipleStatements: true
});

//create server with callback
http.createServer(function(request,response) {
    
    //check to see if it's POST method. I believe all incoming twilio texts should
    //POST method but it can't hurt
    if (request.method == 'POST') {
	var body = '';
        
	//kill the request if the post data is unreasonably long
	request.on('data', function (data) {
            body += data;

            if (body.length > 1e6) request.pool.destroy();
            
	});
	
    } else {
	
	//everything coming in from Twilio should be a POST request
	//so kill everything that isn't
	request.pool.destroy();

    }
    
    //when the request is done begin processing
    request.on('end', function () {
	
	//parse the POST data and put the body in a variable.
	//could just use post['Body'] again later instead
	var post = qs.parse(body);
	if(post['Body']){var bodyText = post['Body'];} else {bodyText='gibberish';}
	if(post['From']){var fromNum = '+' + post['From'].slice(1,post['From'].length);}
	
	//Add the encoding and the initial message open to the response
	response.writeHead(200, {"Content-Type": "text/xml"});
	response.write('<?xml version="1.0" encoding="UTF-8"?>');
	response.write("<Response><Message>");

	if((bodyText.slice(0,2).toUpperCase() == 'TZ') && fromNum){
	    
	    tzSet.setter(bodyText,fromNum,response,pool);

	} else {
	    
	    //Check to see if it's a valid date
	    var gameDate = moment(new Date(bodyText));
	    responses.respondGames(gameDate,fromNum,response,pool);	
	    
	}

    });

}).listen(12476);

