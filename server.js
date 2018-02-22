var csv = require('csv-parser');
var fs = require('fs');
var limit = require("simple-rate-limiter");

//Throttling api calls at 5 requests/second
var request = limit(require("request")).to(5).per(1000);


/* Configuration */

var onesignal_csv_file = "pushwooshdb.csv"; // Replace it with your filename

// APP ID of the app in which you want to import users
var onesignal_app_id = 'ONE_SIGNAL_APP_ID';

var column_names = ['appid','hwid','token','platformid','timezone','tags','badges','androidpackage']; // Column names

/* Configuration Ends */


var i =0;

fs.createReadStream(onesignal_csv_file)
	.pipe(csv(column_names)) 
	.on('data', function(data) {

		var tags = JSON.parse(data.tags);
		
		var device_type = 0; // Defaults to iOS - 0=iOS, 1=Android
		if (data.platformid == 1){ // PushWoosh type 1 = iOS
			device_type = 0; // iOS
		} else if (data.platformid == 3){ // PushWoosh type 3 = Android
			device_type = 1; // Android
		}
		
		var created_at_timestamp = Math.round(new Date(tags["First Install"]).getTime()/1000);
		var last_active_timestamp = Math.round(new Date(tags["Last Application Open"]).getTime()/1000);
		
		var request_obj = {
			app_id: onesignal_app_id,
			device_type:device_type,
			identifier: data.token,
			language: tags["Language"],
			timezone: data.timezone,
			game_version: tags["Application Version"],
			device_model: tags["Device Model"],
			device_os: tags["OS Version"],
			ad_id: data.hwid,
			sdk:"",
			session_count: 1,
			tags: {},
			amount_spent: 0,
			created_at: created_at_timestamp,
			playtime: 0,
			badge_count: 0,
			last_active: last_active_timestamp,
			country: tags.Country
		};
		//console.log(request_obj);
		

		var options = {
			method: 'POST',
			url: 'https://onesignal.com/api/v1/players',
			headers: {
				'cache-control': 'no-cache',
				'content-type': 'application/json'
			},
			body: request_obj,
			json: true
		};

		request(options, function(error, response, body) {
			if (error) {
				console.log("Error proccessing item: " + i + error);
			}
			console.log(body);
		});
		i++;

	})