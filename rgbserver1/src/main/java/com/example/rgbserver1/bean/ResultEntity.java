package com.example.rgbserver1.bean;


public class ResultEntity {
    private int code;
    private String message;
    private Object data;

    public ResultEntity(int code, String message, Object Data) {
        this.code = code;
        this.message = message;
        this.data = Data;
    }

    public ResultEntity(Object Data) {
        this.code = 200;
        this.message = "请求成功";
        this.data = Data;
    }

    public ResultEntity() {
        this.code = 200;
        this.message = "操作成功";
    }

    public ResultEntity(int code, String message) {
        this.code = code;
        this.message = message;
        this.data = null;
    }


    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMsg(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}