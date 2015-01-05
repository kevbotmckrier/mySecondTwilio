//import required modules
var qs = require('querystring');
var moment = require('moment');
var http = require('http');
var mysql = require('mysql');

//create mysql connection
var connection = mysql.createConnection({
	host: process.env.nbaSchedHost,
	user: process.env.nbaSchedUser,
	password: process.env.nbaSchedPassword
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
	
    }
    
    //when the request is done begin processing
    request.on('end', function () {
		
	//parse the POST data and put the body in a variable.
	//could just use post['Body'] again later instead
	var post = qs.parse(body);
	var bodyText = post['Body'];		
	
	//Add the ecoding and the beginning of the header to the response.
	response.writeHead(200, {"Content-Type": "text/xml"}); 
	response.write('<?xml version="1.0" encoding="UTF-8"?>');
	response.write('<Response><Message>');
	
	//Check to see if it's a valid date
	var gameDate = moment(new Date(bodyText));
	
	if(gameDate.isAfter('2015-04-15')||gameDate.isBefore('2015-01-01')||gameDate.format()=='Invalid date'){
	    response.write('Cannot process that date, sorry. :-/');
	    response.write('</Message></Response>');	
	    response.end();
	} else {

	    //Query the MySQL db for games on the selected day and
	    //then loop through them in the callback to add them to the message
	    connection.query("SELECT * FROM `buzzword_nbastandings`.`natTv` WHERE `gameDate` = '" + gameDate.format('YYYY-MM-DD') + "' AND `network` != 'NBALP';", function(err, rows, fields){
		if(rows.length > 0){
		    for(i=1; i<rows.length; i++){
			response.write(rows[i]['awayTeam'] + ' @ ' + rows[i]['homeTeam'] + ': ' + rows[i]['gameTime'] + ' ET on ' + rows[i]['network']);
			if(i+1!=rows.length){response.write(', ');}
		    }
		} else {
		    response.write('There are no nationally televised games that day.');
		}
	    
		response.write('</Message></Response>');	
		response.end();

	    });
	
	}  
	

    });

}).listen(12476);


