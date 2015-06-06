var http = require('http');

module.exports = function translation(key, callback) {

    if (key.trim() === '') return;
    key = encodeURIComponent(key);
    var options = {
        host: 'fanyi.youdao.com',
        port: 80,
        path: '/openapi.do?keyfrom=xujiangtao&key=1490852988&type=data&doctype=json&version=1.1&q=' + key,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    var req = http.request(options, function(res) {
        var result = '';

        //res.setEncoding('utf8');
        res.on('data', function(data) {
            result += data;
        });
        res.on('end', function() {
            var obj,
                res = [];
            try {
              obj = JSON.parse(result);
              if (obj.translation) {
                  res = obj.translation;
              }
              if (obj.web) {
                  res = res.concat(obj.web[0].value);
              }
            } catch (e) {
              res = new Array('Õ¯¬Á“Ï≥£');
            } finally {
              callback(res);
            } 

        });
    });

    req.on('error', function(err) {
        console.log(err);

        setTimeout(function() {
            translation(key, callback);
        }, 1000);
    });

    req.write('');
    req.end();
};
