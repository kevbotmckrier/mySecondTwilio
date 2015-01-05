//Import modules
var request = require('request');
var cheerio = require('cheerio');
var mysql = require('mysql');

//Set URL to be scraped
var scheduleUrl = "http://www.nba.com/schedules/national_tv_schedule/";

//Establish connection to MySQL database
var connection = mysql.createConnection({
	host: process.env.nbaSchedHost,
	user: process.env.nbaSchedUser,
	password: process.env.nbaSchedPassword
});

request(scheduleUrl, function(err, resp, body) {
	
    var begin = body.indexOf('<table');
    var end = body.lastIndexOf('</table');
    
    var sched = body.slice(begin-1,end+8);

    $ = cheerio.load(sched);
    
    
    //Extract the dates column from the table
    var dates = [];

    $('table table tr td.dt').each(function(i, elem){

	dates[i] = $(this).html();

    });

    //Loop through dates to fill in blanks and changethe format
    var curDate = "";

    for(i = 0; i < dates.length; i++){
	if(dates[i].length < 3){
	    dates[i] = curDate;
	} else {
	    //first fix the format, then set the date
	    if(dates[i].slice(5,8) == 'Dec'){
		dates[i] = dates[i] + ' 2014';
	    } else {
		dates[i] = dates[i] + ' 2015';
	    }
	    curDate = dates[i];		
	}	
    }

    //Extract away teams and then the home teams from Teams column
    var awayTeams = [];
    
    $('table table tr td.gm a:nth-child(1)').each(function(i, elem){
	awayTeams[i] = $(this).html();
    });

    var homeTeams = [];

    $('table table tr td.gm a:nth-child(2)').each(function(i, elem){
	homeTeams[i] = $(this).html();
    });	
    
    
    //Extract times from time column
    var times = [];
    $('table table tr td.tm').each(function(i, elem){
	times[i] = $(this).html();
    });	
    


    //Extract the img src from the images of the networks
    var ntv = [];
    $('table table tr td.ntv img:nth-child(1)').each(function(i, elem){
	ntv[i] = $(this).attr('src');
    });	
    
	//Processes the img src to pull out the network
    for(i = 0; i < ntv.length; i++){
	ntv[i] = ntv[i].slice(ntv[i].indexOf("_")+1,ntv[i].length-4);
    }
	
	
    connection.connect();
	
	//Loop through previously built arrays to add each record to the db
	//There is a homeTeam/gameTime index established so any duplicates on that
	//will simply result in the network information being updated
    for(i = 0; i < dates.length; i++){
	
	connection.query("INSERT `buzzword_nbastandings`.`natTv` (`gameDate`,`awayTeam`,`homeTeam`,`gameTime`,`network`) VALUES ('" + new Date(dates[i]).toISOString() + "','" + awayTeams[i] + "','" + homeTeams[i] + "','" + times[i] + "','" + ntv[i] + "') ON DUPLICATE KEY UPDATE `network` = '" + ntv[i] + "';");

    }

    connection.end();

});

