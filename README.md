mySecondTwilio
==============
Returns national tv schedule information when a date is texted in via the Twilio API.

schedScraper.js pulls the NBA schedule website and parses it to determine the national TV schedule.
Network information is pulled from the src attribute of the images repressenting the networks.
Information is then uploaded to a MySQL db.

response.js parsese the incoming POST request from the Twilio API.
If a valid date is sent in it queries my db and generates the XML to respond to the Twilio request.

Currently response.js breaks when the MySQL db connection is timed out. I need to add code to re-establish the connection if it isn't active when a request comes in. Alternatively I could establish a new connection every time a request comes in. However, the db I'm using has very few connections so I'm not worried about running out of bandwidth and I chose to leave the connection open for better speed and ease of use.
