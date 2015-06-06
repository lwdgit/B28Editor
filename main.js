var gridObj, rowObj, savePath, statusText;
var gridData = {
    "success": true,
    "totalRows": 0,
    "curPage": 1,
    "data": []
};

var translate = require('./node/translate'),
    youdaoTranslate = require('./node/translate-you'),
    googleTranslate = require('./node/translate-google'),
    fs = require('fs'),
    path = require('path'),
    child_process = require("child_process");
//var jsdom = require('jsdom');




function firstStart() {
    if (window.document.cookie.indexOf('firstStart') > -1) {
        if (window.document.cookie.indexOf('hasNode') > -1) {
            $('#openDir').removeClass('none');
        }
        return;
    }
    exec('node -v', function() {
        if (arguments[1] != '') {
            $('#openDir').removeClass('none');
            window.document.cookie = 'hasNode=true;';
        }
    });
    window.document.cookie = 'firstStart=true;';
}

function exec(filename, callback) {
    child_process.exec(filename, function(err, stdout, stderr) {
        if (callback && typeof callback == 'function') {
            callback.apply(this, arguments);
        }
    });
}

function updateTable() {
    if (rowObj) {
        rowObj.find('td:eq(0)').text($('#msgid').val());
        rowObj.find('td:eq(1)').text($('#msgstr').val());
    }
    $('#undo').addClass('none');
}

function showStatusMsg(str, isTmp) {
    $('.statusbar').text(str);
    if (!isTmp) {
        statusText = str;
    } else {
        setTimeout(function() {
            showStatusMsg(statusText);
        }, 3000);
    }
}


 function loadData(arr) {
        gridData.data = arr;
        gridData.totalRows = gridData.data.length;
        gridObj.loadGridData('json', gridData);
    }

    function getTableData() {
        var data = {}, ele = $('#dataTable tbody tr');
        for (var i = 0, l = ele.length; i < l; i++) {
            data[ele[i].cells[1].innerText] = ele[i].cells[0].innerText;
        }
        return data;
    }


function loadLangFile(fileName, type) {
    if (fileName !== '') {
        showStatusMsg('文件加载中，请稍候！');
        var data = fs.readFileSync(fileName, 'utf-8'),
            arr = [];

        if (type == '.json') {
            try {
                data = $.parseJSON(data);
            } catch (e) {
                alert('JSON文件有误，请检查！');
                showStatusMsg('JSON文件有误: ' + e.message);
                return;
            }

            for (var d in data) {
                arr.push({
                    msgid: data[d],
                    msgstr: d
                });
            }
        } else {
            data = data.split('\n');
            for (var i = 0, l = data.length; i < l; i++) {
                if (data[i].trim() != '') {
                    arr.push({
                        msgid: data[i],
                        msgstr: ''
                    });
                }
            }
        }
        showStatusMsg('已打开文件：' + fileName);
        return arr;
    } else {
        showStatusMsg('文件名为空，请重新选择！');
        return [];
    }
}


function translateWord(msgid) {
    translate(msgid, function(result) {
        //console.log(result);
        var htmlStr = '';
        for (var i = 0; i < result.length; i++) {
            htmlStr += '<a class="optWord">' + result[i] + '</a>';
        }
        $('#baiduTranslate').html(htmlStr);
    });
    youdaoTranslate(msgid, function(result) {
        //console.log(result);
        var htmlStr = '';
        for (var i = 0; i < result.length; i++) {
            htmlStr += '<a class="optWord">' + result[i] + '</a>';
        }
        $('#youdaoTranslate').html(htmlStr);
    });
    googleTranslate(msgid, function(result) {
        //console.log(result);
        var htmlStr = '';
        for (var i = 0; i < result.length; i++) {
            htmlStr += '<a class="optWord">' + result[i] + '</a>';
        }
        $('#googleTranslate').html(htmlStr);
    });
}

function throttle(func) {
    clearTimeout(func.tId);
    var args = Array.prototype.slice.call(arguments, 1);
    func.tId = setTimeout(function() {
        func.apply(this, args);
    }, 500);
}

function initEvent() {
    $('#dataTable').on('click', 'tr', function(e) {
        var obj = gridObj.getSelectedRow(),
            msgid = obj.find('td:eq(0)').text(),
            msgstr = obj.find('td:eq(1)').text();

        updateTable(obj);
        if (obj && obj.length) {
            if (msgid == '') {
                $('#msgid').focus().val(msgid);
                $('#msgstr').val(msgstr);
            } else {
                $('#msgid').val(msgid);
                $('#msgstr').focus().val(msgstr);
            }

            if (!msgid || msgid.trim() === '') return;
            throttle(translateWord, msgid);

        }
        rowObj = obj;
    });

    $('textarea').on('keydown', function(e) {
        if (e.keyCode == '13') {
            if (!e.shiftKey) {
                e.preventDefault();
                updateTable();
                if (e.ctrlKey) {
                    var nextObj = rowObj.next();
                    if (!nextObj.length) {
                        nextObj = $('#dataTable')[0].insertRow($('#dataTable')[0].rows.length);
                        nextObj.innerHTML = '<td class="lineNoWrap"></td><td class="lineNoWrap"></td>';
                        nextObj = $(nextObj);
                    }
                    nextObj.click();
                    $('#dataTable').parent().scrollTop($('#dataTable').parent().scrollTop() + nextObj.height());
                    rowObj = nextObj;
                }
            }
        }
    });

    $('#openFile').on('change', 'input', function() {
        var data = loadLangFile(this.value, path.extname(this.value));
        localStorage.data = JSON.stringify(data);
        loadData(data);
        $('#saveFile').addClass('none');
        $('#saveAs').html($('#saveAs').html().replace(/另存为/, '保存'));
    });

    $('#openDir').on('change', 'input', function() {
        showStatusMsg('文件扫描中，请耐心等候！');
        exec('node node_b28/node_b28.js -src=' + encodeURIComponent(this.value) + ' -dest=' + encodeURIComponent(process.cwd() + '/tmp.txt') + ' -zh -encode', function() {
            gridData.data = loadLangFile(process.cwd() + '/tmp.txt');
            gridData.totalRows = gridData.data.length;
            gridObj.loadGridData('json', gridData);
            $('#saveFile').addClass('none');
            $('#saveAs').html($('#saveAs').html().replace(/另存为/, '保存'));
            $(this).val('');
        });
    });


    $('#saveAs').on('change', 'input', function() {
        updateTable();
        var that = this;


        if (this.value !== '') {
            savePath = this.value;
            fs.writeFile(savePath, JSON.stringify(getTableData(), null, 4), function(err) {
                if (err) {
                    alert('保存失败,请检查是否有权限!')
                } else {
                    $(that).parent().html($(that).parent().html().replace(/保存/, '另存为'));
                    $('#saveFile').removeClass('none');
                }
            });
        }
        showStatusMsg('文件保存在：' + savePath);
        showStatusMsg('保存成功！', true);
    });

    $('#saveFile').on('click', function() {
        updateTable();
        var data = {},
            ele = $('#dataTable tbody tr');
        for (var i = 0, l = ele.length; i < l; i++) {
            data[ele[i].cells[1].innerText] = ele[i].cells[0].innerText;
        }
        fs.writeFile(savePath, JSON.stringify(data, null, 4), function(err) {
            if (err) {
                alert('保存失败,请检查是否有权限!')
            }
        });
        showStatusMsg('文件保存在：' + savePath);
        showStatusMsg('保存成功！', true);
    });

    $('.helper-panel').on('click', 'a', function() {
        $('#msgstr').val(this.innerText).focus();
        $('#undo').removeClass('none');
    });

    $('#undo').click(function() {
        if (rowObj) {
            $('#msgstr').val(rowObj.find('td:eq(1)').text()).focus();
        }
        $('#undo').addClass('none');
    });
    window.onunload = window.onbeforeunload = function() {
        localStorage.data = JSON.stringify(getTableData());
    }
}

$(function() {
    firstStart();
    var arr = [];
    if (localStorage.data) {
        var data = JSON.parse(localStorage.data);
        for (var d in data) {
            arr.push({
                msgid: data[d],
                msgstr: d
            });
        }
        showStatusMsg('已成功从缓存中读取数据！');
    } else {
        arr = [{
            'msgid': '',
            'msgstr': ''
        }];
    }
    gridObj = $.fn.bsgrid.init('dataTable', {
        localData: arr,
        pageSize: 0
    });

    initEvent();
});
