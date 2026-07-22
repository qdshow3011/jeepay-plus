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

import com.alibaba.fastjson.JSONObject;
import com.jeequan.jeepay.core.constants.CS;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.exception.ResponseException;
import com.jeequan.jeepay.core.model.params.epay.EpayNormalMchParams;
import com.jeequan.jeepay.pay.channel.AbstractChannelNoticeService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.jeequan.jeepay.pay.rqrs.msg.ChannelRetMsg;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.MutablePair;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/*
 * 易支付 支付回调接口实现类
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service
@Slf4j
public class EpayChannelNoticeService extends AbstractChannelNoticeService {

    @Override
    public String getIfCode() {
        return CS.IF_CODE.EPAY;
    }

    @Override
    public MutablePair<String, Object> parseParams(HttpServletRequest request, String urlOrderId, NoticeTypeEnum noticeTypeEnum) {
        try {
            JSONObject params = getReqParamJSON();
            String payOrderId = params.getString("out_trade_no");
            return MutablePair.of(payOrderId, params);
        } catch (Exception e) {
            log.error("EPay notice parse error", e);
            throw ResponseException.buildText("ERROR");
        }
    }

    @Override
    public ChannelRetMsg doNotice(HttpServletRequest request, Object params, PayOrder payOrder,
                                   MchAppConfigContext mchAppConfigContext, NoticeTypeEnum noticeTypeEnum) {
        try {
            EpayNormalMchParams epayParams = (EpayNormalMchParams) configContextQueryService
                    .queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), getIfCode());

            // 获取请求参数
            JSONObject jsonParams = (JSONObject) params;

            // 验证签名
            Map<String, String> signMap = new HashMap<>();
            for (String key : jsonParams.keySet()) {
                if (!"sign".equals(key) && !"sign_type".equals(key)) {
                    signMap.put(key, jsonParams.getString(key));
                }
            }
            String checkSign = jsonParams.getString("sign");
            if (!checkSign.equals(EpayChannelKit.getSign(signMap, epayParams.getKey()))) {
                throw ResponseException.buildText("ERROR");
            }

            // 验签成功后判断上游订单状态
            ResponseEntity okResponse = textResp("success");

            // EPay 通知状态：TRADE_SUCCESS 表示支付成功
            String tradeStatus = jsonParams.getString("trade_status");

            ChannelRetMsg result = new ChannelRetMsg();
            result.setChannelOrderId(jsonParams.getString("trade_no")); // 渠道订单号
            result.setResponseEntity(okResponse); // 响应数据

            result.setChannelState(ChannelRetMsg.ChannelState.WAITING); // 默认支付中

            if ("TRADE_SUCCESS".equals(tradeStatus)) {
                result.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_SUCCESS);
            }

            return result;
        } catch (Exception e) {
            log.error("EPay notice error", e);
            throw ResponseException.buildText("ERROR");
        }
    }

}
