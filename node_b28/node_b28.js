var jsdom = require('jsdom'),
    fs = require('fs'),
    path = require('path'),
    B = require('./b28lib').b28lib,
    excludeList = ['.svn', 'goform', 'css', 'images', 'lang', 'public', 'lib', 'libs'];

var fileList = [],
    langFetchArr = [],
    excludeList = excludeList.join(""),
    CONFIG = {
        src: null,
        dest: null,
        help: null,
        onlyZH: false,
        dict: null //翻译模式时需要指定
    },
    jsonDict = {};


var easyUTF8 = function(gbk) {
    if (!gbk) {
        return '';
    }
    var utf8 = [];
    for (var i = 0; i < gbk.length; i++) {
        var s_str = gbk.charAt(i);
        if (!(/^%u/i.test(escape(s_str)))) {
            utf8.push(s_str);
            continue;
        }
        var s_char = gbk.charCodeAt(i);
        var b_char = s_char.toString(2).split('');
        var c_char = (b_char.length == 15) ? [0].concat(b_char) : b_char;
        var a_b = [];
        a_b[0] = '1110' + c_char.splice(0, 4).join('');
        a_b[1] = '10' + c_char.splice(0, 6).join('');
        a_b[2] = '10' + c_char.splice(0, 6).join('');
        for (var n = 0; n < a_b.length; n++) {
            utf8.push('%' + parseInt(a_b[n], 2).toString(16).toUpperCase());
        }
    }
    return utf8.join('');
};

function getOptions(optionsArr) {
    var optionsObj = {};
    if (optionsArr.length > 0) {
        for (var l = optionsArr.length - 1; l >= 0; l--) {
            if (optionsArr[l].indexOf('=') > 1) {
                optionsObj[optionsArr[l].split('=')[0].replace(/-+/, '')] = optionsArr[l].split('=')[1];
            } else {
                optionsObj[optionsArr[l].split('=')[0].replace(/-+/, '')] = true;
            }
        }
        return optionsObj;
    }
    return {
        h: true
    };
}

function unique(inputs) {
    var res = [];
    var json = {};
    if (!inputs) {
        return [];
    }
    for (var i = 0; i < inputs.length; i++) {
        if (!json[inputs[i]]) {
            res.push(inputs[i]);
            json[inputs[i]] = 1;
        }
    }
    return res;
}

function readDict(filename) {
    jsonDict.content = fs.readFileSync(filename, 'utf-8');
}

function writeFile(filename, content) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' success saved!');
}

function writeFiles(saveTo) {
    writeFile(saveTo, unique(langFetchArr).join("\r\n"));
}

function correctPath(_path) {
    if (!_path) return '';
    if (!path.extname(_path)) { // if is a directory
        _path = _path.replace(/([^\\/]$)/g, "$1\\");
    }

    if (_path.indexOf(' ') > -1) {
        _path = '"' + _path + '"';
    }
    return _path;
}

function getFileList(parentDirectory, destDirectory) {
    parentDirectory = correctPath(parentDirectory);
    if (destDirectory) destDirectory = correctPath(destDirectory);
    var files = fs.readdirSync(parentDirectory);
    files.forEach(function(val) {
        if (excludeList.indexOf(val) == -1) {
            var stat = fs.statSync(parentDirectory + val);
            if (stat.isDirectory()) {
                if (destDirectory) {
                    fs.mkdir(destDirectory + val);

                    console.log(destDirectory + val + ' create success!');
                    getFileList(parentDirectory + val, destDirectory + val);
                } else {
                    getFileList(parentDirectory + val);
                }
            } else {
                fileList.push({
                    fileName: parentDirectory + val,
                    fileType: path.extname(val)
                });
            }
        }
    });
}

function _getPageLangData(page, saveTo, callback) {
    var content = fs.readFileSync(page, 'utf-8');
    var document = jsdom.jsdom(content);
    var arr = new B.getPageData(document.documentElement, CONFIG.onlyZH);
    if (saveTo && saveTo !== "" && typeof saveTo == "string") {
        writeFile(saveTo, arr.join("\r\n"));
    } else {
        if (typeof saveTo == "function") {
            callback = saveTo;
        }
    }

    if (callback) {
        callback.call(null, arr);
    }
    return arr;
}

function _getResLangData(file, saveTo, callback) {
    var content = fs.readFileSync(file, 'utf-8');
    var arr = new B.getResData(content, CONFIG.onlyZH);

    if (saveTo && saveTo !== "" && typeof saveTo == "string") {
        writeFile(saveTo, arr.join("\r\n"));
    } else {
        if (typeof saveTo == "function") {
            callback = saveTo;
        }
    }
    if (callback) {
        callback.call(null, arr);
    }
}


function doGetLangData(file, savepath) {
    var path = savepath || function(data) {
        langFetchArr = langFetchArr.concat('\r\n/*-  ' + file.fileName + '  -*/', data);
    };

    if (file.fileType == ".js") {
        _getResLangData(file.fileName, path);
    } else if (file.fileType == ".htm" || file.fileType == ".html" || file.fileType == ".asp") {
        _getPageLangData(file.fileName, path);
    }
}


function getLangData(srcdir, saveTo) {
    if (srcdir && typeof srcdir == 'string' && fs.lstatSync(srcdir).isDirectory()) {
        getFileList(srcdir);
        fileList.forEach(function(val) {
            doGetLangData(val);
        });
        writeFiles(saveTo);
    } else {
        doGetLangData({
            fileName: srcdir,
            fileType: path.extname(srcdir)
        }, saveTo);
    }
}

function _translatePage(page, saveTo) {
    var content = fs.readFileSync(page, 'utf-8');
    var document = jsdom.jsdom(content);
    B.transTitle(document);
    B.translatePage(document);
    writeFile(saveTo, "<!DOCTYPE html>\r\n" + document.documentElement.outerHTML);
}

function _translateRes(file, saveTo) {
    fs.readFile(file, 'utf-8', function(err, content) {
        if (err) {
            throw ('read file: ' + file + ' error!');
        } else {
            writeFile(saveTo, B.translateRes(content));
        }
    });
}

function doTranslate(file, savepath) {
    if (file.fileType == ".js") {
        _translateRes(file.fileName, savepath);
    } else if (file.fileType == ".htm" || file.fileType == ".html" || file.fileType == ".asp") {
        _translatePage(file.fileName, savepath);
    }
}

function translatePage(srcdir, saveTo) {
    if (srcdir && typeof srcdir == 'string' && fs.statSync(srcdir).isDirectory()) {
        getFileList(srcdir, saveTo);
        fileList.forEach(function(val) {
            doTranslate(val, val.fileName.replace(srcdir, saveTo));
        });
    } else {
        doTranslate({
            fileType: path.extname(srcdir),
            fileName: srcdir
        }, saveTo);
    }
}


CONFIG.help = 'usage:\r\n\tnode node_b28.js -src=srcdir -dest=destdir -zh\r\nor translate mode:\r\n\tnode node_b28.js -src=srcdir -dest=destdir -lang=langfile -t';

//console.log("hello, node b28!\r\nCoreVersion: " + B.coreVersion + '\r\nNode b28 Version: V1.2\r\n');



var args = new getOptions(process.argv.splice(2));

if (!args.h) {
    if (args.encode) { //url encode for support gbk
        CONFIG.src = correctPath(decodeURIComponent(args.src));
        CONFIG.dest = correctPath(decodeURIComponent(args.dest));
        CONFIG.lang = correctPath(decodeURIComponent(args.lang));
    } else {
        CONFIG.src = correctPath(args.src);
        CONFIG.dest = correctPath(args.dest);
        CONFIG.lang = correctPath(args.lang);
    }
    if (args.src && args.dest) {
        if (args.t) {
            console.log('Translate Mode');
            if (CONFIG.lang) {
                console.log('start load lang');
                readDict(CONFIG.lang);
                B.loadJSON(jsonDict.content);
                console.log('start Translate');
                translatePage(CONFIG.src, CONFIG.dest);
            } else {
                console.log('please specify this langfile first!');
            }
        } else {
            console.log('Fetch Mode');
            //console.log(CONFIG);
            if (args.zh) {
                CONFIG.onlyZH = true;
            }
            getLangData(CONFIG.src, CONFIG.dest);
        }
    } else {
        console.log('Please specify the src,dest first!');
    }
} else {
    console.log(CONFIG.help);
}
