# Editor for b28translate

##Install

You should have the ```nw``` runtime and the ```node runtime``` both

###Linux

    $git clone https://github.com/lwdgit/B28Editor.git B28Editor
    $cd B28Editor
    $sudo npm install
    $cd ..
    $nw B28Editor

###Windows X64
    You should have the VC2010 Development Runtime to build the ```jsdom```!

###Windows X86
    If you can`t install the jsdom, you can do like this:

    cd B28Editor/node_b28/node_modules/
    mv jsdom_Win32 jsdom


###Usage

点击“打开”，选择test.json或test.txt等待翻译词语，然后逐一翻译，功能类似于PoEditor。
点击“扫描”，可以自动提取待翻译工程目录下的中文字符。

