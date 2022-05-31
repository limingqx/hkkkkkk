package cn.itcast.robot;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttps3.*;

public class RobotActivity extends AppCompatActivity {
    private ListView listView;
    private ChatAdapter adpter;
    private List<ChatBean> chatBeanList; //存放所有聊天数据的集合
    private EditText et_send_msg;
    private Button btn_send;
    //接口地址
    private static final String WEB_SITE = "http://www.tuling123.com/member/robot/index.jhtml";
    //唯一key，该key的值是从官网注册账号后获取的，注册地址：http://www.tuling123.com/
    private static final String KEY = "******";
    private String sendMsg;    //发送的信息
    private String welcome[];  //存储欢迎信息
    private MHandler mHandler;
    public static final int MSG_OK = 1;//获取数据

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_robot);
        chatBeanList = new ArrayList<ChatBean>();
        mHandler = new MHandler();
        //获取内置的欢迎信息
        welcome = getResources().getStringArray(R.array.welcome);
        initView(); //初始化界面控件
    }

    public void initView() {
        listView = (ListView) listView.findViewById();
        et_send_msg = (EditText) findViewById(R.id.et_send_msg);
        btn_send = (Button) findViewById(R.id.btn_send);
        adpter = new ChatAdapter(chatBeanList, this);
        listView.setAdapter(adpter);
        btn_send.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View arg0) {
                sendData();//点击发送按钮，发送信息
            }
        });
        et_send_msg.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View view, int keyCode, KeyEvent keyEvent) {
                if (keyCode == KeyEvent.KEYCODE_ENTER && keyEvent.getAction() ==
                        KeyEvent.ACTION_DOWN) {
                    sendData();//点击Enter键也可以发送信息
                }
                return false;
            }
        });
        int position = (int) (Math.random() * welcome.length - 1); //获取一个随机数
        showData(welcome[position]); //用随机数获取机器人的首次聊天信息
    }

    private void sendData() {
        sendMsg = et_send_msg.getText().toString(); //获取你输入的信息
        if (TextUtils.isEmpty(sendMsg)) {             //判断是否为空
            Toast.makeText(this, "您还未输任何信息哦", Toast.LENGTH_LONG).show();
            return;
        }
        et_send_msg.setText("");
        //替换空格和换行
        sendMsg = sendMsg.replaceAll(" ", "").replaceAll("\n", "").trim();
        ChatBean chatBean = new ChatBean();
        chatBean.setMessage(sendMsg);
        chatBean.setState(chatBean.SEND); //SEND表示自己发送的信息
        chatBeanList.add(chatBean);        //将发送的信息添加到chatBeanList集合中
        adpter.notifyDataSetChanged();    //更新ListView列表
        getDataFromServer();                //从服务器获取机器人发送的信息
    }

    private void getDataFromServer() {
        OkHttpClient okHttpClient = new OkHttpClient();
        Request request = new Request.Builder().url(WEB_SITE + "?key=" + KEY + "&info="
                + sendMsg).build();
        Call call = okHttpClient.newCall(request);
        // 开启异步线程访问网络
        call.enqueue(new Callback() {
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String res = response.body().string();
                Message msg = new Message();
                msg.what = MSG_OK;
                msg.obj = res;
                mHandler.sendMessage(msg);
            }

            @Override
            public void onFailure(Call call, IOException e) {
            }
        });
    }

    /**
     * 事件捕获
     */
    class MHandler extends Handler {
        @Override
        public void dispatchMessage(Message msg) {
            super.dispatchMessage(msg);
            switch (msg.what) {
                case MSG_OK:
                    if (msg.obj != null) {
                        String vlResult = (String) msg.obj;
                        paresData(vlResult);
                    }
                    break;
            }
        }
    }

    private void paresData(String JsonData) {       //Json解析
        try {
            JSONObject obj = new JSONObject(JsonData);
            String content = obj.getString("text"); //获取的机器人信息
            int code = obj.getInt("code");            //服务器状态码
            updateView(code, content);                 //更新界面
        } catch (JSONException e) {
            e.printStackTrace();
            showData("主人，你的网络不好哦");
        }
    }

    private void showData(String message) {
        ChatBean chatBean = new ChatBean();
        chatBean.setMessage(message);
        chatBean.setState(ChatBean.RECEIVE);//RECEIVE表示接收到机器人发送的信息
        chatBeanList.add(chatBean);  //将机器人发送的信息添加到chatBeanList集合中
        adpter.notifyDataSetChanged();
    }

    private void updateView(int code, String content) {
        //code有很多种状，在此只例举几种，如果想了解更多，请参考官网http://www.tuling123.com
        switch (code) {
            case 4004:
                showData("主人，今天我累了，我要休息了，明天再来找我耍吧");
                break;
            case 40005:
                showData("主人，你说的是外星语吗？");
                break;
            case 40006:
                showData("主人，我今天要去约会哦，暂不接客啦");
                break;
            case 40007:
                showData("主人，明天再和你耍啦，我生病了，呜呜......");
                break;
            default:
                showData(content);
                break;
        }
    }

    protected long exitTime;//记录第一次点击时的时间

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK
                && event.getAction() == KeyEvent.ACTION_DOWN) {
            if ((System.currentTimeMillis() - exitTime) > 2000) {
                Toast.makeText(RobotActivity.this, "再按一次退出智能聊天程序",
                        Toast.LENGTH_SHORT).show();
                exitTime = System.currentTimeMillis();
            } else {
                RobotActivity.this.finish();
                System.exit(0);
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
