var http = require('http'),
	querystring = require('querystring');

module.exports = function translation(params, callback) {
	
	if (typeof params === 'string') {
		params = {
			query: params
		};
	}
	
	params = {
		from: params.from || 'zh',
		to: params.to || 'en',
		query: params.query || ''
	};
	
	var data = querystring.stringify(params);
		options = {
			host: 'fanyi.baidu.com',
			port: 80,
			path: '/v2transapi',
			method: 'POST',
			headers: {
				'Content-Type':'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		};
		
	var req = http.request(options, function(res) {
		var result = '';
		
		res.setEncoding('utf8');
		res.on('data', function(data) {
			result += data;
		});
		res.on('end', function() {
		var obj,str;
      try {
			  obj = JSON.parse(result),
				str = new Array(obj.trans_result.data[0].dst);
			} catch (e) {
        str = new Array('Õ¯¬Á“Ï≥£');
			} finally {
        callback(str);
			}    
		});
	});
	
	req.on('error', function(err) {
		console.log(err);

		setTimeout(function() {
			translation(params, callback);
		}, 1000);
	});
	
	req.write(data);
	req.end();
};