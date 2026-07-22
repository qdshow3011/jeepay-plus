package com.jeequan.jeepay.pay.ctrl.epay;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jeequan.jeepay.core.constants.CS;
import com.jeequan.jeepay.core.entity.MchEpayConfig;
import com.jeequan.jeepay.core.entity.MchInfo;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.utils.EpayKit;
import com.jeequan.jeepay.core.utils.JeepayKit;
import com.jeequan.jeepay.core.utils.SeqKit;
import com.jeequan.jeepay.pay.ctrl.ApiController;
import com.jeequan.jeepay.pay.service.ConfigContextQueryService;
import com.jeequan.jeepay.service.impl.MchInfoService;
import com.jeequan.jeepay.service.impl.PayOrderService;
import com.jeequan.jeepay.service.impl.SysConfigService;
import com.jeequan.jeepay.service.mapper.MchEpayConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

/**
 * EPay（易支付）协议控制器
 * 提供符合易支付协议标准的支付接口，可直接被 New API 等系统作为支付网关对接
 */
@Slf4j
@RestController
@RequestMapping("/api/epay")
public class EpayController extends ApiController {

    @Autowired private MchEpayConfigMapper epayConfigMapper;
    @Autowired private ConfigContextQueryService configContextQueryService;
    @Autowired private PayOrderService payOrderService;
    @Autowired private MchInfoService mchInfoService;
    @Autowired private SysConfigService sysConfigService;

    // ========== 1. 统一下单接口 ==========

    /**
     * EPay 统一下单（兼容 submit.php 入口）
     * 请求方式：支持 GET 和 POST
     */
    @RequestMapping(value = {"/submit.php", "/order/create-transaction"}, method = {RequestMethod.GET, RequestMethod.POST})
    public String submitOrder(HttpServletRequest request) {
        try {
            Map<String, String> params = parseRequestParams(request);
            log.info("EPay submit params: {}", params);

            // 1. 签名校验
            String pid = params.get("pid");
            if (pid == null || pid.isEmpty()) {
                return buildErrorResponse("缺少商户PID");
            }

            MchEpayConfig epayConfig = lookupEpayConfig(pid);
            if (epayConfig == null) {
                return buildErrorResponse("商户PID不存在");
            }
            if (epayConfig.getState() != MchEpayConfig.STATE_ENABLED) {
                return buildErrorResponse("商户已停用");
            }

            if (!EpayKit.verifySign(params, epayConfig.getSecret())) {
                return buildErrorResponse("签名校验失败");
            }

            // 2. 参数校验
            String money = params.get("money");
            String outTradeNo = params.get("out_trade_no");
            String name = params.get("name");
            String type = params.get("type");
            String notifyUrl = params.get("notify_url");
            String returnUrl = params.get("return_url");
            String clientIp = params.get("clientip");

            if (money == null || money.isEmpty()) {
                return buildErrorResponse("缺少金额参数");
            }
            if (outTradeNo == null || outTradeNo.isEmpty()) {
                return buildErrorResponse("缺少商户订单号");
            }

            // 金额转换（元 → 分）
            long amountInFen;
            try {
                amountInFen = new java.math.BigDecimal(money).multiply(new java.math.BigDecimal("100")).longValue();
            } catch (Exception e) {
                return buildErrorResponse("金额格式错误");
            }
            if (amountInFen <= 0) {
                return buildErrorResponse("金额必须大于0");
            }

            // 3. 查询关联商户信息
            MchInfo mchInfo = mchInfoService.getById(epayConfig.getMchNo());
            if (mchInfo == null || mchInfo.getState() != CS.YES) {
                return buildErrorResponse("关联商户不存在或已停用");
            }

            // 4. 构建支付订单
            String payOrderId = SeqKit.genPayOrderId();

            PayOrder payOrder = new PayOrder();
            payOrder.setPayOrderId(payOrderId);
            payOrder.setMchNo(epayConfig.getMchNo());
            payOrder.setIsvNo(mchInfo.getIsvNo());
            payOrder.setAppId(epayConfig.getAppId());
            payOrder.setMchName(mchInfo.getMchShortName() != null ? mchInfo.getMchShortName() : mchInfo.getMchName());
            payOrder.setMchType(mchInfo.getType());
            payOrder.setMchOrderNo(outTradeNo);
            payOrder.setWayCode(CS.PAY_WAY_CODE.QR_CASHIER);
            payOrder.setAmount(amountInFen);
            payOrder.setMchFeeRate(java.math.BigDecimal.ZERO);
            payOrder.setMchFeeAmount(0L);
            payOrder.setCurrency("cny");
            payOrder.setState(PayOrder.STATE_INIT);
            payOrder.setNotifyState(CS.NO);
            payOrder.setSubject(name != null && !name.isEmpty() ? name : "充值");
            payOrder.setBody(name != null && !name.isEmpty() ? name : "充值订单");
            payOrder.setClientIp(clientIp != null ? clientIp : request.getRemoteAddr());

            // 存储 EPay 特有参数到 ext_param
            JSONObject extParam = new JSONObject();
            extParam.set("epay", true);
            extParam.set("epay_pid", pid);
            extParam.set("epay_original_notify_url", notifyUrl);
            extParam.set("epay_original_return_url", returnUrl);
            extParam.set("epay_type", type);
            payOrder.setExtParam(extParam.toString());

            // 设置同步跳转地址（通过 EPay return 处理器转回原始 return_url）
            String paySiteUrl = sysConfigService.getDBApplicationConfig().getPaySiteUrl();
            payOrder.setReturnUrl(paySiteUrl + "/api/epay/return");
            // 异步通知地址留空（由 EpayNotifyService 单独处理）
            payOrder.setNotifyUrl("");

            // 有效期2小时
            payOrder.setExpiredTime(new Date(System.currentTimeMillis() + 2 * 60 * 60 * 1000));
            payOrder.setCreatedAt(new Date());
            payOrder.setUpdatedAt(new Date());

            // 5. 保存订单
            payOrderService.save(payOrder);

            // 6. 构建支付页面 URL（收银台 - EPay 专用入口）
            // 使用 epay 路由跳过 UA 检测，直达 EPay 支付页面
            String cashierUrl = paySiteUrl + "/cashier/index.html#/epay/" + JeepayKit.aesEncode(payOrderId);

            // 7. 返回 EPay 格式响应
            JSONObject result = new JSONObject();
            result.set("code", 1);
            result.set("msg", "success");
            result.set("trade_no", payOrderId);
            result.set("payurl", cashierUrl);
            result.set("qrcode", "");
            result.set("url", "");

            log.info("EPay order created: payOrderId={}, mchNo={}, outTradeNo={}, amount={}, payurl={}",
                    payOrderId, epayConfig.getMchNo(), outTradeNo, amountInFen, cashierUrl);

            return result.toString();

        } catch (Exception e) {
            log.error("EPay submit error", e);
            return buildErrorResponse("系统异常: " + e.getMessage());
        }
    }

    // ========== 2. 订单查询接口 ==========

    /**
     * EPay 订单查询
     * 请求方式：GET，参数通过 URL query 传递
     */
    @GetMapping("/api.php")
    public String queryOrder(HttpServletRequest request) {
        try {
            Map<String, String> params = parseRequestParams(request);
            log.info("EPay query params: {}", params);

            String pid = params.get("pid");
            String tradeNo = params.get("trade_no");
            String outTradeNo = params.get("out_trade_no");

            if (pid == null || pid.isEmpty()) {
                return buildErrorResponse("缺少商户PID");
            }

            MchEpayConfig epayConfig = lookupEpayConfig(pid);
            if (epayConfig == null) {
                return buildErrorResponse("商户PID不存在");
            }

            if (!EpayKit.verifySign(params, epayConfig.getSecret())) {
                return buildErrorResponse("签名校验失败");
            }

            // 查询订单
            PayOrder payOrder = null;
            if (tradeNo != null && !tradeNo.isEmpty()) {
                payOrder = payOrderService.getById(tradeNo);
            } else if (outTradeNo != null && !outTradeNo.isEmpty()) {
                payOrder = payOrderService.getOne(
                        new LambdaQueryWrapper<PayOrder>()
                                .eq(PayOrder::getMchNo, epayConfig.getMchNo())
                                .eq(PayOrder::getMchOrderNo, outTradeNo)
                );
            }

            JSONObject result = new JSONObject();
            if (payOrder == null) {
                result.set("code", 0);
                result.set("msg", "订单不存在");
                result.set("trade_no", "");
                result.set("out_trade_no", outTradeNo);
                result.set("status", -1);
                result.set("money", "0.00");
                result.set("name", "");
                return result.toString();
            }

            // 状态映射
            int status;
            String statusText;
            if (payOrder.getState() == PayOrder.STATE_SUCCESS) {
                status = 1;
                statusText = "TRADE_SUCCESS";
            } else if (payOrder.getState() == PayOrder.STATE_ING) {
                status = 2;
                statusText = "WAIT_BUYER_PAY";
            } else {
                status = 0;
                statusText = "WAIT_BUYER_PAY";
            }

            // 金额转换（分 → 元）
            String moneyYuan = new java.math.BigDecimal(payOrder.getAmount())
                    .divide(new java.math.BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP).toString();

            result.set("code", 1);
            result.set("msg", "success");
            result.set("trade_no", payOrder.getPayOrderId());
            result.set("out_trade_no", payOrder.getMchOrderNo());
            result.set("status", status);
            result.set("money", moneyYuan);
            result.set("name", payOrder.getSubject());
            result.set("trade_status", statusText);

            return result.toString();

        } catch (Exception e) {
            log.error("EPay query error", e);
            return buildErrorResponse("查询异常");
        }
    }

    // ========== 3. 支付成功同步跳转 ==========

    @RequestMapping(value = "/return", method = {RequestMethod.GET, RequestMethod.POST})
    public void returnPage(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = parseRequestParams(request);
        log.info("EPay return params: {}", params);

        // 从 ext_param 恢复原始 return_url
        String payOrderId = params.get("payOrderId");
        String redirectUrl = "/";

        if (payOrderId != null && !payOrderId.isEmpty()) {
            PayOrder payOrder = payOrderService.getById(payOrderId);
            if (payOrder != null && payOrder.getExtParam() != null) {
                try {
                    JSONObject extParam = JSONUtil.parseObj(payOrder.getExtParam());
                    String originalReturnUrl = extParam.getStr("epay_original_return_url");
                    if (originalReturnUrl != null && !originalReturnUrl.isEmpty()) {
                        redirectUrl = originalReturnUrl;
                    }
                } catch (Exception ignored) {}
            }
        }

        response.sendRedirect(redirectUrl);
    }

    // ========== 辅助方法 ==========

    /**
     * 查询 EPay 配置
     */
    private MchEpayConfig lookupEpayConfig(String pid) {
        List<MchEpayConfig> configs = epayConfigMapper.selectList(
                new LambdaQueryWrapper<MchEpayConfig>()
                        .eq(MchEpayConfig::getPid, pid)
                        .eq(MchEpayConfig::getState, MchEpayConfig.STATE_ENABLED)
                        .last("LIMIT 1")
        );
        return configs.isEmpty() ? null : configs.get(0);
    }

    /**
     * 解析请求参数（支持 GET 和 POST）
     */
    private Map<String, String> parseRequestParams(HttpServletRequest request) {
        Map<String, String> params = new TreeMap<>();

        // POST body 参数
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String name = paramNames.nextElement();
            String value = request.getParameter(name);
            params.put(name, value);
        }

        return params;
    }

    /**
     * 构建 EPay 错误响应
     */
    private String buildErrorResponse(String msg) {
        JSONObject result = new JSONObject();
        result.set("code", 0);
        result.set("msg", msg);
        result.set("trade_no", "");
        return result.toString();
    }
}
