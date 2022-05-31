package com.example.rgbserver1.controller;

import com.example.rgbserver1.bean.ResultEntity;
import com.example.rgbserver1.bean.RgbEntity;
import com.google.gson.Gson;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@CrossOrigin
@RequestMapping("/rgb")
public class rgbController {
    /**
     * 输出log和当前状态
     */
    @GetMapping(value = "setRgbStatus", produces = "application/json;charset=utf-8")
    public Object setRgbStatus(String status, String rgbName) {
        RgbEntity rgbEntity = new RgbEntity();
        rgbEntity.setStatus(status);
        rgbEntity.setRbgName(rgbName);
        rgbEntity.setTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MMdd HH:mm:ss")));
        //生成json
        String writerString = new Gson().toJson(rgbEntity);
        /*输出rgb等的信息*/
        try {
            File file = new File("D:/java/rgb.txt");
            if (!file.exists()) {
                file.createNewFile();
            }
            BufferedWriter fileOut = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file)));
            fileOut.write(writerString + "\n");
            fileOut.flush();
            fileOut.close();
            /*输出log的信息*/
            File fileLog = new File("D:/java/rgbLog.txt");
            BufferedWriter logOut = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(fileLog, true)));
            logOut.write(writerString + "\n");
            logOut.flush();
            logOut.close();

        } catch (IOException e) {
            e.printStackTrace();
            return new ResultEntity(100, "写入失败");
        }
        return new ResultEntity();
    }

    /**
     * 读取rgb文本
     *
     * @return rgbEntity
     */
    @GetMapping(value = "getRgbStatus", produces = "application/json;charset=utf-8")
    public Object getRgbStatus() {
        try {
            File file = new File("D:/java/rgb.txt");
            StringBuffer result = new StringBuffer();
            BufferedReader br = new BufferedReader(new FileReader((file)));
            while (br.ready()) {
                result.append(br.readLine());
            }
            br.close();
            //先解析出来，避免出现转义符
            RgbEntity rgbEntity = new Gson().fromJson(result.toString(), RgbEntity.class);
            return new ResultEntity(rgbEntity);
        } catch (IOException e) {
            return new ResultEntity(100, e.getMessage());
        }
    }

}
