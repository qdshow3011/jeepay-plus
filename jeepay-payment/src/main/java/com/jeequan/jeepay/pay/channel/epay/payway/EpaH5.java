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
package com.jeequan.jeepay.pay.channel.epay.payway;

import com.alibaba.fastjson.JSONObject;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.exception.BizException;
import com.jeequan.jeepay.core.model.params.epay.EpayNormalMchParams;
import com.jeequan.jeepay.pay.channel.epay.EpayPaymentService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.jeequan.jeepay.pay.rqrs.AbstractRS;
import com.jeequan.jeepay.pay.rqrs.msg.ChannelRetMsg;
import com.jeequan.jeepay.pay.rqrs.payorder.UnifiedOrderRQ;
import com.jeequan.jeepay.pay.rqrs.payorder.payway.EpaH5OrderRQ;
import com.jeequan.jeepay.pay.rqrs.payorder.payway.EpaH5OrderRS;
import com.jeequan.jeepay.pay.util.ApiResBuilder;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

/*
 * 易支付 H5支付
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service("epayPaymentByEpaH5Service")
public class EpaH5 extends EpayPaymentService {

    @Override
    public String preCheck(UnifiedOrderRQ rq, PayOrder payOrder) {
        EpaH5OrderRQ bizRQ = (EpaH5OrderRQ) rq;
        if (StringUtils.isEmpty(bizRQ.getEpayType())) {
            throw new BizException("[epayType]不可为空");
        }
        return null;
    }

    @Override
    public AbstractRS pay(UnifiedOrderRQ rq, PayOrder payOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        EpaH5OrderRQ bizRQ = (EpaH5OrderRQ) rq;

        EpayNormalMchParams params = (EpayNormalMchParams) configContextQueryService
                .queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), getIfCode());

        // 构造响应数据
        EpaH5OrderRS res = ApiResBuilder.buildSuccess(EpaH5OrderRS.class);
        ChannelRetMsg channelRetMsg = new ChannelRetMsg();
        res.setChannelRetMsg(channelRetMsg);

        // 发起支付
        JSONObject resObj = doPay(payOrder, params, bizRQ.getEpayType(), channelRetMsg);
        if (resObj == null) {
            return res;
        }

        // EPay 返回 payurl 字段（支付页面URL）
        String payUrl = resObj.getString("payurl");
        if (StringUtils.isNotEmpty(payUrl)) {
            res.setPayUrl(payUrl);
        }

        // 如果有二维码地址
        String qrcode = resObj.getString("qrcode");
        if (StringUtils.isNotEmpty(qrcode)) {
            res.setCodeUrl(qrcode);
        }

        return res;
    }

}
