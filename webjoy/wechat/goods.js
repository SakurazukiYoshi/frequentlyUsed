//购物车
// 操作购物车
function setCart(goods_id, num) {
    $.post('/Home/WxGoods/sendToCart', {goods_id:goods_id, num:num}, function (resp) { });
}
var isPrices;
var ShoppingCart = {
    addEvent: function (a, b, c) {   //监听事件的兼容性写法
        a.attachEvent ? a.attachEvent('on' + b, function () { c.call(a) }) : a.addEventListener(b, c, false);
    },
    //正常浏览器         element.addEventListener(event, function, useCapture)  事件  函数    true - 事件句柄在捕获阶段执行，false- false- 默认。事件句柄在冒泡阶段执行
    //早期ie             element.attachEvent(Etype,function)  a.attachEvent("onclick",function(){});
    removeEvent: function (o, a, b) {   //删除监听事件的兼容性写法
        o.detachEvent ? o.detachEvent('on' + a, b) : o.removeEventListener(a, b, false);
    },
    eq_index: function(current, obj){   //返回现在current内容的index
        for (var i = 0, length = obj.length; i<length; i++) {
            if (obj[i] == current) {
                return i;
            }
        }
    },
    init: function () {
        if (!document.getElementsByClassName) {    //className的兼容性写法
            document.getElementsByClassName = function (cls) {
                var ret = [];
                var els = document.getElementsByTagName('*');
                for (var i = 0, len = els.length; i < len; i++) {
                    if (els[i].className.indexOf(cls + ' ') >=0 || els[i].className.indexOf(' ' + cls + ' ') >=0 || els[i].className.indexOf(' ' + cls) >=0) {
                        ret.push(els[i]);
                    }
                }
                return ret;
            }
        }
        var table = document.getElementById('cartTable'); // 购物车dom，ul
        var tr = table.children; //每一项买的物品 li
        var priceTotal = document.getElementById('priceTotal'); //总计的价格
        var _ival = new Array();
        for (var i = 0; i < tr.length; i++) {   //对每一个货物进行 遍历,这里的事件针对于购物车里的内容
            //将点击事件绑定到tr元素
            var trObj = tr[i];   //每一项货物
            _ival[i] = parseInt(tr[i].getElementsByTagName('input')[0].value);     //货物的个数
            tr[i].onclick = function (e) {
                var e = e || window.event;
                var el = e.target || e.srcElement; //通过事件对象的target属性获取触发元素，加减号
                var cls = el.dataset.op; //触发元素的data-op，用于判断是点击的是加还是键，
                var countInout = this.getElementsByTagName('input')[0]; // 数目input
                var value = parseInt(countInout.value); //数目
                var check = this.dataset.pay;  //货物的data-pay属性
                var gid = this.getAttribute("data-id");   //货物的id
                var _this = this;      //货物的li
                var _stock = parseInt(this.dataset.stock);   //货物的库存
                _stock = _stock == 0 ? 99999 : _stock;    //货物为0显示9999
                //通过判断触发元素确定用户点击了哪个元素
                switch (cls) {
                    case 'add': //点击了加号
                        var cSatus = el.dataset.show || "true";   //加号的data-show属性
                        if(check == "false" || cSatus == "false") return;    //如果货物的data-pay属性为false  或者加号的show为false
                        if (_stock<value+1){   //如果商品数目+1>货存
                            el.setAttribute("data-show","false");  //那么加号的data-show为false
                            return false
                        }
                        el.setAttribute("data-show","false");   //点击完了以后都是false
                        $.post('/Home/WxGoods/sendToCart', {goods_id:gid, num:1}, function (resp) {
                            if (resp.status==1) {
                                el.setAttribute("data-show","true");   //ajax成功了以后data-show
                                if (value < 99) {   //当货物小于99的时候
                                    if( _stock <= value+1 ){
                                        el.setAttribute("data-show","false");
                                    }
                                    countInout.value = value + 1;
                                    ShoppingCart.syncTr(_this,countInout.value);    //货物的li 和数目，购物车控制页面的货物页面
                                    ShoppingCart.getSubtotal(_this); //计算每一个货物钱
                                    ShoppingCart.getTotal(tr);   //计算总计的钱
                                }
                            }
                        });
                        break;
                    case 'reduce': //点击了减号
                        var cSatus = el.dataset.show || "true";
                        if(check == "false" || cSatus == "false") return;
                        el.setAttribute("data-show","false");
                        $.post('/Home/WxGoods/sendToCart', {goods_id:gid, num:-1}, function (resp) {
                            if (resp.status==1) {
                                el.setAttribute("data-show","true");
                                if (value > 1) {   //数目大于1的时候，减号显示
                                    _this.getElementsByClassName('iconGoods-rounded-add-button')[0].setAttribute("data-show","true");

                                }else{  //不然直接删除这个元素
                                    _this.parentNode.removeChild(_this);
                                }
                                if ($("#cartTable li").length >= 1) {
                                    $(".total").addClass("pl");
                                }else{
                                    $(".total").removeClass("pl");
                                }
                                countInout.value = value - 1;
                                ShoppingCart.syncTr(_this,countInout.value);
                                ShoppingCart.getSubtotal(_this);
                                ShoppingCart.getTotal(tr);
                            }
                        });
                        break;
                }

            }
            // 给数目输入框绑定keyup事件
            tr[i].getElementsByTagName('input')[0].onkeyup = function () {
                var val = parseInt(this.value);
                var _this = this;
                var _index = ShoppingCart.eq_index(_this.parentNode.parentNode,_this.parentNode.parentNode.parentNode.children);
                if (isNaN(val)) val = 1;
                if (val > 99) val = 99;
                _this.value = val;
            }
        }
    },
    syncTr:function(obj,num){   //货物的li+数目
        var listObj = document.getElementsByClassName('goodsList'),   //页面的货物列表  lis
            gid = obj.getAttribute("data-id");   //货物车货物的id
        for (var i = 0; i < listObj.length; i++) {
            var _obj = listObj[i];   //页面的货物列表干个元素
            if( gid == $(_obj).find(".op").data("id") ){    //当页面货物和购物车id相同的时候
                var $count = $(_obj).find('input[name="count"]'),       //页面货物的数量
                    g_stock = parseInt($(this).find(".op").data("stock"));  //页面货物的库存
                g_stock = g_stock == 0 ? 99999 : g_stock;
                $count.val(num);  //页面订单的数量改为购物车的数量
                if( parseInt(g_stock) <= parseInt(num) ){  //当数量大于库存的时候
                    $(_obj).find(".iconGoods-rounded-add-button").attr("data-show","false");   //加号不显示
                }else{
                    $(_obj).find(".iconGoods-rounded-add-button").attr("data-show","true");   //不然像是
                }
                if(num <= 0) $(_obj).find('.iconGoods-round-delete-button').addClass('none');  //当数量小于等于0时，减号消失
                return false;
            }
        }
    },
    // 计算单行价格
    getSubtotal: function (tr) {
        var cells = tr.children;
        var price = tr.getElementsByClassName('hidden_price')[0]; //单价
        var subtotal = cells[1]; //小计td
        var countInput = tr.getElementsByTagName('input')[0]; //数目input
        subtotal.innerHTML ="¥"+(parseInt(countInput.value) * parseFloat(price.value)).toFixed(1);
    },
    // 更新总价格
    getTotal: function (tr) {
        var seleted = 0;
        var price = 0;
        var HTMLstr = '', $og = $("#orderGoods");
        for (var i = 0, len = tr.length; i < len; i++) {
            if(tr[i].dataset.pay == "true"){
                seleted += parseInt(tr[i].getElementsByTagName('input')[0].value);
                price += parseFloat((tr[i].children[1].innerHTML).substring(1));
            }
        }
        isPrices = price;
        if(price == 0){
            $("#orderGoods").addClass("gray_btn");
            $(".fixedGoods .fg_box").removeClass('hasGoods');
            $("#cartTable,.weui_mask").addClass('none');
            $og.attr("disabled","disabled");
        }else{
            $("#orderGoods").removeClass("gray_btn");
            $(".fixedGoods .fg_box").addClass('hasGoods');
            $og.removeAttr("disabled");
        }
        priceTotal.innerHTML ="¥"+price.toFixed(1);
        document.getElementById('totalNum').innerHTML = seleted;
        if($og.data("num") != "" || $og.data("from") != "") $og.removeAttr("disabled");
        // priceTotal.innerHTML = "¥" + price.toFixed(1);
    }
    //为每行元素添加事件
}
ShoppingCart.init();
$(document).on('click', '.goodsList .btn_op', function(){    //页面的加减号
// $(".goodsList .btn_op").on("click",function(){
    var _this = $(this),     //加减号
        $this = _this.parent(),   //卖品数量的dd
        _stock = parseInt($this.data("stock")),  //库存
        sorts = _this.data("op"),   //加号和减号的区别
        sname = $this.data("name"),  //卖品的名字
        sid = $this.data("id"),     //卖品的id
        sprice = $this.data("price"),  //卖品的价格
        boolUpdate = true,boolHttp = false,  //布尔更新    布尔请求
        _sinput = $this.find('.countInput');   //页面卖品数量
    _stock = _stock == 0 ? 99999 : _stock;   //没有的时候显示99999
    switch (sorts) {
        case 'add':  //点了加号
            var cSatus = _this.attr("data-show") || "true";   //加号显示的判断状态码
            if(cSatus == "false") return;    //false的时候没操作
            if(_stock < parseInt(_sinput.val())+1){   //当数量大于库存的时候
                _this.attr("data-show","false");  //不显示
                return false;
            };
            $("#orderGoods").removeClass("gray_btn");   //立即下单，变灰并且不可以点击
            _this.attr("data-show","false");//这个时候加号不可以点击
            $.post('/Home/WxGoods/sendToCart', {goods_id:sid, num:1}, function (resp) {   //点了就传送
                if (resp.status==1) {
                    _this.attr("data-show","true");   //返回成功就显示加号
                    if(resp.status != 0){
                        $this.find('.iconGoods-round-delete-button').removeClass('none'); //减号显示
                        _sinput.val(parseInt(_sinput.val())+1>99 ? "99+" : parseInt(_sinput.val())+1); //大于99时显示99
                    }

                    if (_stock > parseInt(_sinput.val())+1) {  //当库存大于数量
                        $("#cartTable li").each(function(){   //购物车对应的商品加号显示
                            var ids=$(this).attr("data-id");
                            if (ids==sid) {
                                $(this).find(".iconGoods-rounded-add-button").attr("data-show","true");
                            }
                        })
                    }
                }
            });
            break;
        case 'reduce':
            var cSatus = _this.attr("data-show") || "true";
            if(cSatus == "false") return;
            var _num = parseInt(_sinput.val())-1;
            $this.find('.iconGoods-rounded-add-button').attr("data-show","true");
            _this.attr("data-show","false");
            $.post('/Home/WxGoods/sendToCart', {goods_id:sid, num:-1}, function (resp) {
                if (resp.status==1) {
                    _this.attr("data-show","true");
                    if(_num <= 0){
                        $this.find('.iconGoods-round-delete-button').addClass('none');
                    }
                    if(_num <= 0&&isPrices==0){
                        $("#orderGoods").addClass("gray_btn");
                    }
                    if(resp.status != 0){
                        _sinput.val(_num);
                    }
                }
            });
            break;
    }
    $("#cartTable li").each(function(index){
        if( sid == $(this).data("id") ){
            var $count = $(this).find('input[name="count"]');
            var cl_stock = parseInt($(this).data("stock"));
            cl_stock = cl_stock == 0 ? 99999 : _stock;
            if(parseInt($count.val()) >= 99) boolHttp = true;
            if(sorts == "reduce"){
                if(parseInt($count.val())-1 <= 0) $(this).remove();
                $count.val(parseInt($count.val())-1);
            }else{
                $count.val(parseInt($count.val())+1);
            }
            if(cl_stock <= parseInt($count.val())){
                $(this).find(".iconGoods-rounded-add-button").attr("data-show","false");
            }else{
                $(this).find(".iconGoods-rounded-add-button").attr("data-show","true");
            }
            ShoppingCart.getSubtotal($(this)[0]);
            ShoppingCart.getTotal(document.getElementById('cartTable').children);
            boolUpdate = false;
            return false;
        }
    });
    if(boolHttp) return false;
    if(boolUpdate){
        var resHtml = '<li class="clearfix" data-id="'+sid+'" data-pay="true" data-stock="'+_stock+'">'+
            '<span class="c fl" title="'+sname+'">'+sname+'</span>'+
            '<span class="p fl prize">¥'+sprice+'</span>'+
            '<div class="o fr"><i class="iconGoods-round-delete-button" data-op="reduce" data-show="true"></i><input name="count" class="countInput" type="text" value="1" readonly="readonly" /><i class="iconGoods-rounded-add-button" data-op="add" data-show="true"></i></div>'+
            '<input type="hidden" name="hidden_price" class="hidden_price" value="'+sprice+'" />'+
            '</li>';
        $(".fixedGoods .fg_box").addClass('hasGoods');
        $(resHtml).appendTo("#cartTable");
        ShoppingCart.init();
        ShoppingCart.getTotal(document.getElementById('cartTable').children);
    }
});

$("#shoppingCart,.weui_mask").on("click",function(){   //购物车的图标和蒙层被点击
    var _obj = $(".weui_mask");   //蒙层被点击
    if($("#cartTable li").length<=0) return false;       //购物车里面没东西的时候没反应
    if(_obj.hasClass('none')){      //蒙层没有张开的时候，none    display：none
        _obj.removeClass('none');   //蒙层张开
        $(".shoppingInfo").removeClass('none');   //物品栏展开
        $(".total").addClass("pl");   //总价增加p1，p1  增加了padding，让总价的位置移动了
        // $(this).parent().addClass('hasGoods');
    }else{      //蒙层张开的情况
        _obj.addClass('none');     //蒙层消失
        $(".shoppingInfo").addClass('none');  //物品栏消失
        $(".total").removeClass("pl");   //总价回到原来的位置
        // $(this).parent().removeClass('hasGoods');
    }
});
/*点击立即下单*/
function order(){
    if($("#cartTable li").length<=0) {   //当购物车里没有物品的时候，点击立即下单弹窗
        layer.open({
            content: '亲，你还未添加卖品哦'
            ,skin: 'msg'
            ,time: 2 //2秒后自动关闭
        });
    }else{
        window.location.href="/Home/WxGoods/order";
    }
}
$(function(){   //当购物车里没有物品的时候，立即下单为灰色
    if($("#cartTable li").length<=0) {
        $("#orderGoods").addClass("gray_btn");
    }else{

    }
})/**
 * Created by admin on 2017/5/18.
 */
