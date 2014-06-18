文件目录结构说明
======================

+ style
+ images
+ other

style与images目录用来反之简单的jquery插件
对于简单的jquery插件，将插件的样式表改为less文件，并替换其中的包含ur的值，使用less的变量进行代入

+ 如jquery.chosen插件，将less地址变量命名未@chosen_image_path,并替换less文件对应url即可
    +其中的js文件，请在项目根目录的manifest.js文件中进行引入
+ 对于复杂的插件，如百度文本编辑器，因为其中依赖文件夹结构，所以保留整个插件，项目需要使用时，手动引入相应的脚本与样式文件即可
