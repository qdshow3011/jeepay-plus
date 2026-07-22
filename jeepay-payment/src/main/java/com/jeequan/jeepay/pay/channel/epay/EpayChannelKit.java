package com.jeequan.jeepay.pay.channel.epay;

import com.jeequan.jeepay.core.utils.EpayKit;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.Map;

/*
 * 易支付 通道工具类
 * 封装对 EPay 聚合支付网关的 API 调用
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Slf4j
public class EpayChannelKit {

    /**
     * 生成 EPay 签名（委托给 core 中的 EpayKit）
     */
    public static String getSign(Map<String, String> paramMap, String key) {
        return EpayKit.generateSign(paramMap, key);
    }

    /**
     * 验证 EPay 签名
     */
    public static boolean verifySign(Map<String, String> paramMap, String key) {
        return EpayKit.verifySign(paramMap, key);
    }

    /**
     * 获取支付下单地址
     */
    public static String getSubmitUrl(String payUrl) {
        return getBaseUrl(payUrl) + "submit.php";
    }

    /**
     * 获取订单查询地址
     */
    public static String getQueryOrderUrl(String payUrl) {
        return getBaseUrl(payUrl) + "api.php?act=order";
    }

    /**
     * 补齐基础URL
     */
    protected static String getBaseUrl(String payUrl) {
        if (StringUtils.isEmpty(payUrl)) {
            return payUrl;
        }
        if (!payUrl.endsWith("/")) {
            payUrl += "/";
        }
        return payUrl;
    }

}
