package com.jeequan.jeepay.pay.service;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.jeequan.jeepay.core.entity.MchEpayConfig;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.utils.EpayKit;
import com.jeequan.jeepay.service.mapper.MchEpayConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * EPay（易支付）异步通知服务
 * 在支付订单成功后，按 EPay 协议格式通知 New API 的 notify_url
 */
@Slf4j
@Service
public class EpayNotifyService {

    @Autowired private MchEpayConfigMapper epayConfigMapper;

    /**
     * 处理 EPay 订单的异步通知
     * 从 PayOrder.ext_param 中读取 EPay 参数，按 EPay 协议格式发送通知
     */
    public void notifyEpayOrder(PayOrder payOrder) {
        try {
            // 检查是否为 EPay 订单
            if (payOrder.getExtParam() == null || payOrder.getExtParam().isEmpty()) {
                return;
            }

            JSONObject extParam;
            try {
                extParam = JSONUtil.parseObj(payOrder.getExtParam());
            } catch (Exception e) {
                return; // 不是有效的 JSON，忽略
            }

            Boolean isEpay = extParam.getBool("epay", false);
            if (!isEpay) {
                return; // 不是 EPay 订单
            }

            String pid = extParam.getStr("epay_pid");
            String originalNotifyUrl = extParam.getStr("epay_original_notify_url");
            String epayType = extParam.getStr("epay_type");

            if (pid == null || pid.isEmpty()) {
                log.warn("EPay order {} missing pid in ext_param", payOrder.getPayOrderId());
                return;
            }

            if (originalNotifyUrl == null || originalNotifyUrl.isEmpty()) {
                log.info("EPay order {} has no notify_url, skipping notification", payOrder.getPayOrderId());
                return;
            }

            // 查找 EPay 配置获取密钥
            List<MchEpayConfig> configs = epayConfigMapper.selectList(
                    new LambdaQueryWrapper<MchEpayConfig>()
                            .eq(MchEpayConfig::getPid, pid)
                            .eq(MchEpayConfig::getState, MchEpayConfig.STATE_ENABLED)
                            .last("LIMIT 1")
            );
            if (configs.isEmpty()) {
                log.warn("EPay config not found for pid={}", pid);
                return;
            }
            MchEpayConfig epayConfig = configs.get(0);

            // 状态映射
            String tradeStatus;
            if (payOrder.getState() == PayOrder.STATE_SUCCESS) {
                tradeStatus = "TRADE_SUCCESS";
            } else {
                tradeStatus = "TRADE_FAIL";
            }

            // 金额：分 → 元，保留2位小数
            String money = new BigDecimal(payOrder.getAmount())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP).toString();

            // 构建 EPay 通知参数
            Map<String, String> notifyParams = new HashMap<>();
            notifyParams.put("pid", pid);
            notifyParams.put("trade_no", payOrder.getPayOrderId());
            notifyParams.put("out_trade_no", payOrder.getMchOrderNo());
            notifyParams.put("type", epayType != null ? epayType : "alipay");
            notifyParams.put("name", payOrder.getSubject() != null ? payOrder.getSubject() : "充值");
            notifyParams.put("money", money);
            notifyParams.put("trade_status", tradeStatus);
            notifyParams.put("sign_type", "MD5");

            // 生成签名
            String sign = EpayKit.generateSign(notifyParams, epayConfig.getSecret());
            notifyParams.put("sign", sign);

            log.info("Sending EPay notify to {} for order {} (trade_status={})",
                    originalNotifyUrl, payOrder.getPayOrderId(), tradeStatus);
            log.debug("EPay notify params: {}", notifyParams);

            // 发送 HTTP POST 通知（最多重试3次）
            int maxRetries = 3;
            String response = null;
            for (int retry = 0; retry < maxRetries; retry++) {
                try {
                    // 转换为 Map<String, Object> 适配 Hutool HttpUtil.post
                    Map<String, Object> postParams = new HashMap<>(notifyParams);
                    response = HttpUtil.post(originalNotifyUrl, postParams, 20000);
                    log.info("EPay notify response (attempt {}): {}", retry + 1, response);
                    if ("success".equalsIgnoreCase(response) || "SUCCESS".equalsIgnoreCase(response)) {
                        log.info("EPay notify success for order {}", payOrder.getPayOrderId());
                        return;
                    }
                    // 如果不是 success，稍等再试
                    if (retry < maxRetries - 1) {
                        Thread.sleep(2000L * (retry + 1));
                    }
                } catch (Exception e) {
                    log.error("EPay notify attempt {} failed for order {}: {}", retry + 1, payOrder.getPayOrderId(), e.getMessage());
                    if (retry < maxRetries - 1) {
                        try {
                            Thread.sleep(2000L * (retry + 1));
                        } catch (InterruptedException ignored) {}
                    }
                }
            }

            log.warn("EPay notify failed after {} retries for order {}", maxRetries, payOrder.getPayOrderId());

        } catch (Exception e) {
            log.error("EPay notify error for order {}: {}", payOrder.getPayOrderId(), e.getMessage(), e);
        }
    }
}
