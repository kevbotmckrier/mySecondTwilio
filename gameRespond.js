exports.respondGames = function(gameDate,fromNum,response,connection){

    //Setup SQL queries
    var gamesQuery = "SELECT * FROM `buzzword_nbastandings`.`natTvTest` WHERE `gameDate` = '" + gameDate.format('YYYY-MM-DD') + "' AND `network` != 'NBALP';";
    var userQuery = "SELECT * FROM `buzzword_nbastandings`.`schedUsers` WHERE `userNumber` = '" + fromNum + "';";

    if(gameDate.isAfter('2015-04-15')||gameDate.isBefore('2015-01-01')||gameDate.format()=='Invalid date'){

	//if date is out of range or in a format i can't process the request gets ended
	response.write('Cannot process that date, sorry. :-/');
	response.write('</Message></Response>)');
	response.end();

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
	    } else {

		response.write('To set a time zone preference, send a text beginning with TZ and containing your preferred time zone. (Continental US only)');
		response.write('</Message><Message>');

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
		
		response.write(gameResp);
		
	    } else {

		//If we don't have a result, let the user down easy.
		response.write('Unfortunately there are no nationally televised games that day.');

	    }
	    
	    response.write('</Message></Response>');
	    response.end();

	});

    }

}