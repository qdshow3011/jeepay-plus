/*
 * Copyright (c) 2021-2031, 开算智能科技（青岛）有限公司 (https://www.openhubs.pay & contact@openhubs.pay).
 * <p>
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE 3.0;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.gnu.org/licenses/lgpl.html
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.jeequan.jeepay.pay.channel.epay;

import cn.hutool.http.HttpUtil;
import com.alibaba.fastjson.JSONObject;
import com.jeequan.jeepay.core.constants.CS;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.model.params.epay.EpayNormalMchParams;
import com.jeequan.jeepay.core.utils.JeepayKit;
import com.jeequan.jeepay.pay.channel.AbstractPaymentService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.jeequan.jeepay.pay.rqrs.AbstractRS;
import com.jeequan.jeepay.pay.rqrs.msg.ChannelRetMsg;
import com.jeequan.jeepay.pay.rqrs.payorder.UnifiedOrderRQ;
import com.jeequan.jeepay.pay.util.PaywayUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/*
 * 支付接口： 易支付
 * 支付方式： 自适应（根据 type 参数路由到不同聚合通道）
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service
@Slf4j
public class EpayPaymentService extends AbstractPaymentService {

    @Override
    public String getIfCode() {
        return CS.IF_CODE.EPAY;
    }

    @Override
    public boolean isSupport(String wayCode) {
        return true;
    }

    @Override
    public String preCheck(UnifiedOrderRQ rq, PayOrder payOrder) {
        return PaywayUtil.getRealPaywayService(this, payOrder.getWayCode()).preCheck(rq, payOrder);
    }

    @Override
    public AbstractRS pay(UnifiedOrderRQ rq, PayOrder payOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        return PaywayUtil.getRealPaywayService(this, payOrder.getWayCode()).pay(rq, payOrder, mchAppConfigContext);
    }

    /**
     * 统一调用 EPay 聚合网关下单
     *
     * @param payOrder      支付订单
     * @param params        EPay 商户参数
     * @param epayType      支付类型（alipay / wxpay / qqpay）
     * @param channelRetMsg 通道返回消息
     * @return 响应 JSON
     */
    protected JSONObject doPay(PayOrder payOrder, EpayNormalMchParams params, String epayType, ChannelRetMsg channelRetMsg) {
        // 构造 EPay 请求参数（用 Object 值以兼容 JeepayKit.genUrlParams）
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("pid", params.getPid());
        paramMap.put("type", epayType);
        paramMap.put("out_trade_no", payOrder.getPayOrderId());
        paramMap.put("notify_url", getNotifyUrl(payOrder.getPayOrderId()));
        paramMap.put("return_url", getReturnUrl(payOrder.getPayOrderId()));
        paramMap.put("name", payOrder.getSubject());
        paramMap.put("money", new java.math.BigDecimal(payOrder.getAmount())
                .divide(new java.math.BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP).toString());
        paramMap.put("clientip", payOrder.getClientIp());

        // 生成签名（Object → String 转换）
        Map<String, String> signMap = new HashMap<>();
        for (Map.Entry<String, Object> e : paramMap.entrySet()) {
            signMap.put(e.getKey(), e.getValue() != null ? e.getValue().toString() : "");
        }
        String sign = EpayChannelKit.getSign(signMap, params.getKey());
        paramMap.put("sign", sign);
        paramMap.put("sign_type", "MD5");

        // 构建下单 URL
        String submitUrl = EpayChannelKit.getSubmitUrl(params.getPayUrl());
        String queryString = JeepayKit.genUrlParams(paramMap);
        String fullUrl = submitUrl + "?" + queryString;

        String resStr = "";
        try {
            log.info("发起 EPay 支付[{}]参数：{}", getIfCode(), fullUrl);
            resStr = HttpUtil.createPost(fullUrl).timeout(60 * 1000).execute().body();
            log.info("发起 EPay 支付[{}]结果：{}", getIfCode(), resStr);
        } catch (Exception e) {
            log.error("EPay http error", e);
        }

        if (StringUtils.isEmpty(resStr)) {
            channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
            channelRetMsg.setChannelErrCode("");
            channelRetMsg.setChannelErrMsg("请求" + getIfCode() + "接口异常");
            return null;
        }

        JSONObject resObj = JSONObject.parseObject(resStr);
        if (resObj.getInteger("code") == null || resObj.getInteger("code") != 1) {
            String retMsg = resObj.getString("msg");
            channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
            channelRetMsg.setChannelErrCode("");
            channelRetMsg.setChannelErrMsg(retMsg != null ? retMsg : "未知错误");
            return null;
        }

        // 支付中状态（等待异步通知确认）
        channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.WAITING);
        return resObj;
    }

}
