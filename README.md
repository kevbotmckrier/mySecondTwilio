mySecondTwilio
==============
Returns national tv schedule information for a date texted in via the Twilio API. Acceptable date formats include: 1/31/15, 1-31-15, Jan 31 15, January 31 15, Jan 31, 2015.

Time zone preference can be set by texting in TZ and then PT, Pacific, MT, Mountain, CT, Central, ET, or Eastern.

schedScraper.js pulls the NBA schedule website and parses it to determine the national TV schedule.
Network information is pulled from the src attribute of the images repressenting the networks.
Information is then uploaded to a MySQL db.

response.js parsese the incoming POST request from the Twilio API.

If a valid date is sent in it sends processes it with gameRespond.js which queries my db and generates the XML to respond to the Twilio request.

If a time zone setting message is sent it its processed by tzSet.js.
