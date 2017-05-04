define(function(require, exports, module) {
    //var $ = require("zepto123");   //依赖jquery
    exports.sayHello = function() {  //exports 对外提供接口,输出一个方法或者变量
        $('#box').click(function(){
            alert(1);
        });
    };

    module.exports={      //输入一个对象
        text:"hello world",
        do:function(){
            $("#box").html(212);
        }
    }

});

