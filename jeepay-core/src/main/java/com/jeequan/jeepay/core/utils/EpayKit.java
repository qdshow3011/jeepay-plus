/*
 * EPay（易支付）协议工具类
 * 实现参数排序、MD5 签名生成和验签功能
 * 兼容 New API（https://github.com/QuantumNous/new-api）的支付网关协议
 */
package com.jeequan.jeepay.core.utils;

import lombok.extern.slf4j.Slf4j;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Slf4j
public class EpayKit {

    private static final String ENCODING = "UTF-8";

    /**
     * 生成 EPay 签名
     * 算法：参数按 key 字典排序 → 拼接 k=v 格式 → 排除 sign/sign_type 和空值 → 末尾追加商户密钥 → MD5 小写
     *
     * @param params 请求参数（不含 sign 和 sign_type）
     * @param secret 商户密钥
     * @return MD5 签名字符串（小写）
     */
    public static String generateSign(Map<String, String> params, String secret) {
        // 1. 过滤空值和 sign/sign_type
        TreeMap<String, String> sortedParams = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value != null && !value.isEmpty()
                    && !"sign".equalsIgnoreCase(key)
                    && !"sign_type".equalsIgnoreCase(key)) {
                sortedParams.put(key, value);
            }
        }

        // 2. 拼接 k=v&k=v&...
        StringBuilder sb = new StringBuilder();
        int i = 0;
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (i > 0) {
                sb.append("&");
            }
            sb.append(entry.getKey()).append("=").append(entry.getValue());
            i++;
        }

        // 3. 追加密钥
        sb.append(secret);

        // 4. MD5
        String signStr = sb.toString();
        log.debug("Epay sign string: {}", signStr);
        String sign = md5(signStr, ENCODING);
        log.debug("Epay sign result: {}", sign);
        return sign;
    }

    /**
     * 验证 EPay 签名
     *
     * @param params 包含 sign 的完整请求参数
     * @param secret 商户密钥
     * @return true=验签通过
     */
    public static boolean verifySign(Map<String, String> params, String secret) {
        String expectedSign = params.get("sign");
        if (expectedSign == null || expectedSign.isEmpty()) {
            return false;
        }
        String calculatedSign = generateSign(params, secret);
        return expectedSign.equals(calculatedSign);
    }

    /**
     * 将参数 map 转换为 URL 参数字符串（用于重定向或 POST）
     */
    public static String toQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (i > 0) {
                sb.append("&");
            }
            try {
                sb.append(entry.getKey())
                  .append("=")
                  .append(URLEncoder.encode(entry.getValue(), ENCODING));
            } catch (UnsupportedEncodingException e) {
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }
            i++;
        }
        return sb.toString();
    }

    /**
     * MD5 签名（返回小写十六进制）
     */
    public static String md5(String value, String charset) {
        try {
            byte[] data = value.getBytes(charset);
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digestData = md.digest(data);
            return toHexLower(digestData);
        } catch (NoSuchAlgorithmException e) {
            log.error("MD5 digest unavailable", e);
            return null;
        } catch (UnsupportedEncodingException e) {
            log.error("Unsupported charset: {}", charset, e);
            return null;
        }
    }

    private static String toHexLower(byte[] input) {
        if (input == null) {
            return null;
        }
        StringBuilder output = new StringBuilder(input.length * 2);
        for (byte b : input) {
            int current = b & 0xff;
            if (current < 16) {
                output.append("0");
            }
            output.append(Integer.toString(current, 16));
        }
        return output.toString();
    }
}
