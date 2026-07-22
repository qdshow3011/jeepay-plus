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
import com.jeequan.jeepay.pay.channel.IPayOrderQueryService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.jeequan.jeepay.pay.rqrs.msg.ChannelRetMsg;
import com.jeequan.jeepay.pay.service.ConfigContextQueryService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/*
 * 易支付 查单接口实现类
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service
@Slf4j
public class EpayPayOrderQueryService implements IPayOrderQueryService {

    @Autowired private ConfigContextQueryService configContextQueryService;

    @Override
    public String getIfCode() {
        return CS.IF_CODE.EPAY;
    }

    @Override
    public ChannelRetMsg query(PayOrder payOrder, MchAppConfigContext mchAppConfigContext) {
        EpayNormalMchParams params = (EpayNormalMchParams) configContextQueryService
                .queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), getIfCode());

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("act", "order");
        paramMap.put("pid", params.getPid());
        paramMap.put("out_trade_no", payOrder.getPayOrderId());

        // 签名
        Map<String, String> signMap = new HashMap<>();
        for (Map.Entry<String, Object> e : paramMap.entrySet()) {
            signMap.put(e.getKey(), e.getValue() != null ? e.getValue().toString() : "");
        }
        String sign = EpayChannelKit.getSign(signMap, params.getKey());
        paramMap.put("sign", sign);
        paramMap.put("sign_type", "MD5");

        String queryUrl = EpayChannelKit.getQueryOrderUrl(params.getPayUrl()) + "?" + JeepayKit.genUrlParams(paramMap);
        String resStr = "";
        try {
            log.info("EPay 支付查询[{}]参数：{}", getIfCode(), queryUrl);
            resStr = HttpUtil.createPost(queryUrl).timeout(60 * 1000).execute().body();
            log.info("EPay 支付查询[{}]结果：{}", getIfCode(), resStr);
        } catch (Exception e) {
            log.error("EPay query http error", e);
        }
        if (StringUtils.isEmpty(resStr)) {
            return ChannelRetMsg.waiting();
        }
        JSONObject resObj = JSONObject.parseObject(resStr);
        if (resObj.getInteger("code") == null || resObj.getInteger("code") != 1) {
            return ChannelRetMsg.waiting();
        }
        // EPay 返回 status: 1=支付成功
        Integer status = resObj.getInteger("status");
        if (status != null && status == 1) {
            return ChannelRetMsg.confirmSuccess(resObj.getString("trade_no"));
        }
        return ChannelRetMsg.waiting();
    }

}
