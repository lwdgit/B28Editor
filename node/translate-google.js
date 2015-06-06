var http = require('http');
module.exports = function translate(key, callback) {
    http.get("http://brisk.eu.org/api/translate.php?from=zh-CN&to=en&text=" + key, function(res) {
        res.setEncoding('utf8');
        var body = "";
        res.on('data', function(chunk) {
            body += chunk;
        }).on('end', function() {
          try {
            var res = JSON.parse(body);
            res = new Array(res.res);
          } catch (e) {
              res = new Array('网络异常！');
          } finally {
            callback(res);
          } 
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
};
