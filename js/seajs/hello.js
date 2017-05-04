define(function(require, exports, module) {
    //var $ = require("jquery");   //依赖jquery
/*    var box=document.getElementById("box");
     box.onclick=function(){
        alert(1);
     };*/
    exports.sayHello = function() {  //exports 对外提供接口,或者通过 module.exports 提供整个接口
        $('#box').click(function(){
         alert(1);
         });
        //console.log($('#box'));
    };
});

