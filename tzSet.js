exports.setter = function(bodyText,fromNum,response,connection){

    var timeZone = '';
    var timeOffset = 0;

    bodyText = bodyText.toUpperCase();

    if(Math.max(bodyText.search('ET'),bodyText.search('EAST'))>-1){
	timeZone = 'ET';
	timeOffset = 0;
    } else if(Math.max(bodyText.search('CT'),bodyText.search('CENTRAL'))>-1){
	timeZone = 'CT';
	timeOffset = 1;
    } else if(Math.max(bodyText.search('MT'),bodyText.search('MOUNTAIN'))>-1){
	timeZone = 'MT';
	timeOffset = 2;
    } else if(Math.max(bodyText.search('PT'),bodyText.search('PACIFIC'))>-1){
	timeZone = 'PT';
	timeOffset = 3;
    } else {
	response.write("Couldn't parse your time zone. Please try again");
    }

    if(timeZone.length>0){
	
	var sqlInsert = "INSERT INTO `buzzword_nbastandings`.`schedUsers` (`userNumber`,`timeZone`,`timeOffset`) VALUES ('" + fromNum + "','" + timeZone + "','" + timeOffset + "') ON DUPLICATE KEY UPDATE `timeZone` = '" + timeZone + "', `timeOffset` = '" + timeOffset + "';";

	connection.query(sqlInsert,function(err,rows){});

	response.write('Time Zone preference saved.');
	response.write('</Message></Response>');
	
    }

    response.end();

}