/***********************************************************************************
 * 文件：RemoteAppliances（电器远程控制系统）
 *
 * 作者：Chenyang         2016.10.17
 *
 * 说明：主js包括导航与按钮功能的实现和数据的连接，实现整个系统的功能
 *
 * 修改：Zhouly                 2016.11.23    1.优化代码格式，细化注释
 *                                                           2.将script.js文件与connect.js文件合并成script.js文件
 *
 *           Chenyang          2016.12.9      添加localStorage本地存储、分享生成二维码及安卓扫码功能
 *           Liyw                   2016.12.19     更新红外遥控键值操作
 * *********************************************************************************/

// 定义本地存储参数
var localData = {
    ID: "12345678",
    KEY: "12345678",
    server: "12345678",
    RGBMAC: "",
    infraredMAC: "",
    //1是开起，0是关闭

};
var isOpen = 1
var rgbName = "红灯"
var rgbType = 1
$(function () {

    // 初始化顶级导航和二级导航
    Nav.topNav($('.top-nav li'))
    $('.content:eq(0)').css('display', 'block');
    Nav.secondNav($('.side-nav:eq(0) li'), 0);
    $('.content:eq(0) .main:eq(0)').css('display', 'block');

    // 顶级导航按钮
    Button.topNavBtn();

    // 获取本地存储的id key server等
    get_localStorage();

    // id key 及标志位变量定义
    var connectFlag = 0, macFlag = 0;
    var rtc = 0;
    // 传感器参数定义
    var RGBData;
    var infraredData, infraredMode;
    // 操作标志位
    var RGBFlag = 1;
    var infraredFlag;
    var num = 0;


    // id key 输入确认按钮
    $("#idkeyInput").click(function () {
        localData.ID = $("#ID").val();
        localData.KEY = $("#KEY").val();
        localData.server = $("#server").val();
        console.log(localData.ID);
        console.log(localData.KEY);
        console.log(localData.server);

        // 本地存储id、key和server
        localStorage.remoteAppliances = JSON.stringify(localData);

        // 创建数据连接服务对象
        rtc = new WSNRTConnect(localData.ID, localData.KEY);
        rtc.setServerAddr(localData.server + ":28080");
        rtc.connect();

        // 连接成功回调函数
        rtc.onConnect = function () {
            $("#ConnectState").text("数据服务连接成功！");
            connectFlag = 1;
            message_show("数据服务连接成功！");
        };

        // 数据服务掉线回调函数
        rtc.onConnectLost = function () {
            $("#ConnectState").text("数据服务连接掉线！");
            connectFlag = 0;
            message_show("数据服务连接失败，检查网络或IDKEY");
        };

        // 消息处理回调函数
        rtc.onmessageArrive = function (mac, dat) {
            if (mac == localData.RGBMAC) {
                if (dat[0] == '{' && dat[dat.length - 1] == '}') {
                    dat = dat.substr(1, dat.length - 2);
                    var its = dat.split(',');
                    for (var x in its) {
                        var t = its[x].split('=');
                        if (t.length != 2) continue;
                        if (t[0] == "D1") {
                            RGBData = parseInt(t[1]);
                            if (RGBData) {
                                if (RGBFlag) {
                                    $("#RGBSwitch").text("关灯");
                                    $("#RGBStatus").attr("src", "img/RGB_white.jpg");
                                    RGBFlag = 0;
                                    message_show("RGB灯打开");
                                }
                            } else {
                                $("#RGBSwitch").text("开灯");
                                $("#RGBStatus").attr("src", "img/RGB_off.jpg");
                                RGBFlag = 1;
                                message_show("RGB灯关闭");
                            }
                        }
                    }
                }
            } else if (mac == localData.infraredMAC) {
                if (dat[0] == '{' && dat[dat.length - 1] == '}') {
                    dat = dat.substr(1, dat.length - 2);
                    var its = dat.split(',');
                    for (var x in its) {
                        var t = its[x].split('=');
                        if (t.length != 2) continue;
                        if (t[0] == "V0") {
                            infraredData = parseInt(t[1]) - 63;
                            console.log("infraredData=" + infraredData);
                            if (infraredData < 10) num = infraredData;
                            else if (infraredData == 10) num = 'A';
                            else if (infraredData == 11) num = 'B';
                            else if (infraredData == 12) num = 'C';
                            else if (infraredData == 13) num = 'D';
                            else if (infraredData == 14) num = 'E';
                            else if (infraredData == 15) num = 'F';
                            $("#Number").text(num);
                            if (infraredFlag) {
                                message_show("遥控信号：" + num);
                            } else message_show("学习信号：" + num);
                            if (!infraredFlag && !RGBFlag) {
                                statusFlag = 0;
                                $("#RGBStatus").attr("src", "img/RGB1.gif");
                                message_show("发送遥控信号");
                            }
                        }
                        if (t[0] == "D1") {
                            infraredMode = parseInt(t[1]);
                            if (infraredMode) {
                                infraredFlag = 0;
                                $("#infraredSwitch").text("遥控");
                                $("#ModeWork").text("学习模式");
                                message_show("学习模式开启");
                            } else {
                                infraredFlag = 1;
                                $("#infraredSwitch").text("学习");
                                $("#ModeWork").text("遥控模式");
                                message_show("遥控模式开启");
                            }
                        }
                    }
                }
            }
        }
    });

    // mac地址输入确认按钮
    $("#macInput").click(function () {
        localData.RGBMAC = $("#RGBMAC").val();
        localData.infraredMAC = $("#infraredMAC").val();
        // 本地存储mac地址
        localStorage.remoteAppliances = JSON.stringify(localData);
        console.log("flag" + connectFlag);
        if (connectFlag) {
            rtc.sendMessage(localData.RGBMAC, "{D1=?}");
            console.log(localData.RGBMAC);

            rtc.sendMessage(localData.infraredMAC, "{V0=?,D1=?}");
            console.log(localData.infraredMAC);

            macFlag = 1;
            message_show("MAC设置成功");
        } else {
            macFlag = 0;
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });

    // rgb灯开关
    $("#RGBSwitch").click(function () {
        //目前没有设备所以默认显示设备
        // if (connectFlag) {
        // 	if(RGBFlag) {
        // 		rtc.sendMessage(localData.RGBMAC, "{OD1=1,D1=?}"); ;
        // 		console.log("{OD1=1,D1=?}");
        // 	}else {
        // 		rtc.sendMessage(localData.RGBMAC, "{CD1=1,D1=?}");
        // 		console.log("{CD1=1,D1=?}");
        // 	}
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }

        if (isOpen == 1) {
            isOpen = 0
            $("#RGBSwitch").text("关灯")
            $("#currentTem").text("RGB灯开启")
            message_show(rgbName + "亮")
        } else {
            isOpen = 1
            $("#RGBSwitch").text("开灯")
            $("#currentTem").text("RGB灯关闭")
            message_show(rgbName + "熄灭")
        }
        setRgbStatus()
    });

    // 360遥控开关
    $("#infraredSwitch").click(function () {
        if (connectFlag) {
            if (infraredFlag) {
                rtc.sendMessage(localData.infraredMAC, "{OD1=1,D1=?}");
                console.log("{OD1=1,D1=?}");
            } else {
                rtc.sendMessage(localData.infraredMAC, "{CD1=1,D1=?}");
                console.log("{CD1=1,D1=?}");
            }
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });

    // 遥控界面，16个按钮，查询温度，开报警器
    $("#CH_0_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=0,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_1_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=1,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "红灯"
        rgbType = 1
        setRgbStatus()
        $("#Number").text(rgbName)
    });
    $("#CH_2_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=2,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "橙灯"
        rgbType = 2
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_3_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=3,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "黄灯"
        rgbType = 3
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_C_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=4,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "绿灯"
        rgbType = 4
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_4_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=5,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "青灯"
        rgbType = 5
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_5_Switch").click(function () {
        // if (connectFlag){
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=6,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "蓝灯"
        rgbType = 6
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_6_Switch").click(function () {
        // if (connectFlag) {
        // 	rtc.sendMessage(localData.infraredMAC, "{V0=7,V0=?}");
        // }else {
        // 	message_show("请正确输入IDKEY连接智云数据中心");
        // }
        rgbName = "紫灯"
        rgbType = 7
        $("#Number").text(rgbName)
        setRgbStatus()
    });
    $("#CH_8_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=8,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_9_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=9,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_A_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=10,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_B_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=11,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    // $("#CH_C_Switch").click(function(){
    // 	if (connectFlag) {
    // 		rtc.sendMessage(localData.infraredMAC, "{V0=12,V0=?}");
    // 	}else {
    // 		message_show("请正确输入IDKEY连接智云数据中心");
    // 	}
    // });
    $("#CH_D_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=13,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_E_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=14,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });
    $("#CH_F_Switch").click(function () {
        if (connectFlag) {
            rtc.sendMessage(localData.infraredMAC, "{V0=15,V0=?}");
        } else {
            message_show("请正确输入IDKEY连接智云数据中心");
        }
    });

    // 扫描按钮
    $(".scan").on("click", function () {
        if (window.droid) {
            window.droid.requestScanQR("scanQR");
        } else {
            message_show("扫描只在安卓系统下可用！");
        }
    })

    // 定义二维码生成div
    var qrcode = new QRCode(document.getElementById("qrDiv"), {
        width: 200,
        height: 200
    });

    // 分享按钮
    $(".share").on("click", function () {
        var txt = "", title, input;
        if (this.id == "idShare") {
            txt = "ID:" + $("#ID").val() + ",KEY:" + $("#KEY").val();
            title = "IDKey";
        } else {
            input = $(this).parents(".MAC").find("input");
            input.each(function () {
                txt += $(this).val() + ",";
            });
            if (txt.length > 0) {
                txt = txt.substr(0, txt.length - 1);
            }
            title = "MAC设置";
        }
        qrcode.makeCode(txt);
        $("#shareModalTitle").text(title)
    })

    // 升级按钮
    $("#setUp").click(function () {
        message_show("当前已是最新版本");
    });

    //  查看升级日志
    $("#showUpdateTxt").on("click", function () {
        if ($(this).text() == "查看升级日志")
            $(this).text("收起升级日志");
        else
            $(this).text("查看升级日志");
    })

});

// 获取本地localStorage缓存数据
function get_localStorage() {
    if (localStorage.remoteAppliances) {
        localData = JSON.parse(localStorage.remoteAppliances);
        console.log("localData=" + localData);
        for (var i in localData) {
            if (localData[i] != "") {
                eval("$('#" + i + "').val(localData." + i + ")");
                console.log("i=" + i + ";;  data1:" + localData[i]);
            }
        }
    }
}

// 扫描处理函数
function scanQR(scanData) {
    var data0 = scanData.split(',');
    if (scanData.indexOf("ID") > -1) {
        $("#ID").val(data0[0].split(":")[1]);
        $("#KEY").val(data0[1].split(":")[1]);
    } else {
        for (var i = 0; i < data0.length; i++) {
            $(".MAC").find("input:eq(" + i + ")").val(data0[i]);
        }
    }
}

// 导航
var Nav = {
    // 顶级导航
    topNav: function (object) {
        object.click(function () {
            Active.navActive($(this));
            var num = $(this).index();
            $('.content').css('display', 'none');
            $('.content:eq(' + num + ')').css('display', 'block');
            $('.side-nav').css('display', 'none');
            $('.side-nav:eq(' + num + ')').css('display', 'block');
            // 初始化二级导航
            Nav.secondNav($('.side-nav:eq(' + num + ') li'), num);
            $('.side-nav:eq(' + num + ') li').removeClass('active');
            $('.side-nav:eq(' + num + ') li:eq(0)').addClass('active');
            $('.content:eq(' + num + ') .main').css('display', 'none');
            $('.content:eq(' + num + ') .main:eq(0)').css('display', 'block');
        });
    },
    // 二级导航
    secondNav: function (object, topNum) {
        object.click(function () {
            Active.navActive($(this));
            var num = $(this).index();
            $('.content:eq(' + topNum + ') .main').css('display', 'none');
            $('.content:eq(' + topNum + ') .main:eq(' + num + ')').css('display', 'block');
        });
    }
}

// 高亮
var Active = {
    // 导航栏高亮
    navActive: function (object) {
        object.siblings().removeClass('active')
        if (object.attr('class') != 'active') {
            object.addClass('active')
        }
    }
}

// 按钮
var Button = {
    // 顶级导航按钮
    topNavBtn: function () {
        $('.top-nav-btn').click(function (event) {
            $('.top-nav').fadeToggle();
        });
    },
    // 模式设置按钮
    modelBtn: function (object) {
        var name = object.attr('name');
        $('button[name="' + name + '"]').removeClass('btn-primary').addClass('btn-default');
        object.addClass('btn-primary');
    }
}

//接口地址
var baseUrl = "http://127.0.0.1:8080/rgb/"

function setRgbStatus() {
    $.getJSON(baseUrl + "setRgbStatus", {"status": isOpen, "rgbName": rgbType}, function (json) {
        console.log(json)
    })
}
/*轮询查看等的转台*/
function getRgbStatus() {
    $(document).ready(function () {
        $.getJSON(baseUrl + "getRgbStatus", function (data) {
            if (data.data.status == 1) {
                isOpen = 1
                $("#RGBSwitch").text("开灯")
                $("#currentTem").text("RGB灯关闭")
            } else {
                isOpen = 0
                $("#RGBSwitch").text("关灯")
                $("#currentTem").text("RGB灯开启")
            }
            rgbType = data.data.rbgName
            switch (data.data.rbgName) {
                case "1":
                    $("#RGBStatus").css("background-color", "#FF0000")
                    $("#Number").text("红灯")
                    rgbName = "红灯"
                    break
                case "2":
                    $("#RGBStatus").css("background-color", "#FF7D00")
                    $("#Number").text("橙灯")
                    rgbName = "橙灯"
                    break
                case "3":
                    $("#RGBStatus").css("background-color", "#FFFF00")
                    $("#Number").text("黄灯")
                    rgbName = "黄灯"
                    break
                case "4":
                    $("#RGBStatus").css("background-color", "#00FF00")
                    $("#Number").text("绿灯")
                    rgbName = "绿灯"
                    break
                case "5":
                    $("#RGBStatus").css("background-color", "#00FFFF")
                    $("#Number").text("青灯")
                    rgbName = "青灯"
                    break
                case "6":
                    $("#RGBStatus").css("background-color", "#0000FF")
                    $("#Number").text("蓝灯")
                    rgbName = "蓝灯"
                    break
                case "7":
                    $("#RGBStatus").css("background-color", "#FF00FF")
                    $("#Number").text("紫灯")
                    rgbName = "紫灯"
                    break
            }

        })
    })

}

setInterval('getRgbStatus()', 500);//轮询执行，500ms一次


// 消息弹出框
var message_timer = null;

function message_show(t) {
    if (message_timer) {
        clearTimeout(message_timer);
    }
    message_timer = setTimeout(function () {
        $("#toast").hide();
    }, 3000);
    $("#toast_txt").text(t);
    $("#toast").show();
}

