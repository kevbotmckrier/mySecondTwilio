//import required modules
var qs = require('querystring');
var moment = require('moment');
var http = require('http');
var mysql = require('mysql');
var twilio = require('twilio');
var tzSet = require('./tzSet.js');

//create mysql connection
var connection = mysql.createConnection({
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

            if (body.length > 1e6) request.connection.destroy();
            
	});
	
    } else {
	
	//everything coming in from Twilio should be a POST request
	//so kill everything that isn't
	request.connection.destroy();

    }
    
    //when the request is done begin processing
    request.on('end', function () {
	
	//setup twiml response
	var resp = new twilio.TwimlResponse();
	
	//parse the POST data and put the body in a variable.
	//could just use post['Body'] again later instead
	var post = qs.parse(body);
	var bodyText = post['Body'];
	var fromNum = '+' + post['From'].slice(1,post['From'].length);
					       
	//Add the encoding to the response
	response.writeHead(200, {"Content-Type": "text/xml"}); 

	//Check to see if it's a valid date
	var gameDate = moment(new Date(bodyText));

	//Setup SQL queries
	var gamesQuery = "SELECT * FROM `buzzword_nbastandings`.`natTvTest` WHERE `gameDate` = '" + gameDate.format('YYYY-MM-DD') + "' AND `network` != 'NBALP';";
	var userQuery = "SELECT * FROM `buzzword_nbastandings`.`schedUsers` WHERE `userNumber` = '" + fromNum + "';";
	
	if(gameDate.isAfter('2015-04-15')||gameDate.isBefore('2015-01-01')||gameDate.format()=='Invalid date'){

	    //if date is out of range or in a format i can't process the request gets ended
	    resp.message('Cannot process that date, sorry. :-/');
	    response.end(resp.toString());

	} else {

	    //Query the MySQL db for games on the selected day and information on the user
	    //then loop through them in the callback to add them to the message
	    //
	    //Really got add some santiation of inputs now that I'm allowing multiple queries
	    //Alternatively I could start using promises and chain the queries, but that sounds more out of my element
	    connection.query(gamesQuery + userQuery, function(err, results){
		
		//set defaults, then adjust if we have a viable user
		var timeOffset = 0;
		var timeZone = 'ET';

		if(results[1].length == 1){
		    timeOffset = results[1][0]['timeOffset'];
		    timeZone = results[1][0]['timeZone'];
		}
		
		//If we have a result, sort it, then build the response and send it
		if(results[0].length > 0){
		    
		    results[0].sort(function(a,b){
			return (a['gameTime'].split(':')[0] + a['gameTime'].split(':')[1].slice(0,2)) - (b['gameTime'].split(':')[0] + b['gameTime'].split(':')[1].slice(0,2));
		    });

		    //Adjust gametimes, and reformat them
		    for(i = 0; i < results[0].length; i++){
			
			results[0][i]['gameTime'] = (results[0][i]['gameTime'].slice(0,2) - timeOffset) + results[0][i]['gameTime'].slice(-3);
			
			if(results[0][i]['gameTime'].slice(0,2) + results[0][i]['gameTime'].slice(-2) > 1200){
			    results[0][i]['gameTime'] = results[0][i]['gameTime'].slice(0,2) - 12 + results[0][i]['gameTime'].slice(2,5) + ' pm';
			} else {
			    results[0][i]['gameTime'] = results[0][i]['gameTime'] + ' am'
			}

		    }
		    
		    //Declare var for message, loop through game results query, send it
		    var gameResp = '';

		    for(i=0; i<results[0].length; i++){
			gameResp += results[0][i]['awayTeam'] + ' @ ' + results[0][i]['homeTeam'] + ': ' + results[0][i]['gameTime'] + ' ' + timeZone + ' on ' + results[0][i]['network'];
		if(i+1!=results[0].length){gameResp += ', ';}
				     
			    }
			
		    resp.message(gameResp);
		    
		} else {

		    //If we don't have a result, let the user down easy.
		    resp.message('Unfortunately there are no nationally televised games that day.');

		}
	
	response.end(resp.toString());

    });
    
}  
		  

		 });

}).listen(12476);

connection.on('close', function(err){
    
    //connection closed unexpectedly, reconnect
    connection.log('auto reconnected');
    connection = mysql.createConnection(connection.config);

});


