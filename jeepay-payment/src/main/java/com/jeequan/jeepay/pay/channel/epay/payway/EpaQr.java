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
import com.jeequan.jeepay.pay.rqrs.payorder.payway.EpaQrOrderRQ;
import com.jeequan.jeepay.pay.rqrs.payorder.payway.EpaQrOrderRS;
import com.jeequan.jeepay.pay.util.ApiResBuilder;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

/*
 * 易支付 扫码支付
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service("epayPaymentByEpaQrService")
public class EpaQr extends EpayPaymentService {

    @Override
    public String preCheck(UnifiedOrderRQ rq, PayOrder payOrder) {
        EpaQrOrderRQ bizRQ = (EpaQrOrderRQ) rq;
        if (StringUtils.isEmpty(bizRQ.getEpayType())) {
            throw new BizException("[epayType]不可为空");
        }
        return null;
    }

    @Override
    public AbstractRS pay(UnifiedOrderRQ rq, PayOrder payOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        EpaQrOrderRQ bizRQ = (EpaQrOrderRQ) rq;

        EpayNormalMchParams params = (EpayNormalMchParams) configContextQueryService
                .queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), getIfCode());

        // 构造响应数据
        EpaQrOrderRS res = ApiResBuilder.buildSuccess(EpaQrOrderRS.class);
        ChannelRetMsg channelRetMsg = new ChannelRetMsg();
        res.setChannelRetMsg(channelRetMsg);

        // 发起支付
        JSONObject resObj = doPay(payOrder, params, bizRQ.getEpayType(), channelRetMsg);
        if (resObj == null) {
            return res;
        }

        // EPay 返回的 qrcode 字段为二维码内容
        String qrcode = resObj.getString("qrcode");
        if (StringUtils.isNotEmpty(qrcode)) {
            res.setCodeUrl(qrcode);
        }

        // 如果没有 qrcode，则使用 payurl 作为 codeUrl
        String payUrl = resObj.getString("payurl");
        if (StringUtils.isEmpty(qrcode) && StringUtils.isNotEmpty(payUrl)) {
            res.setCodeUrl(payUrl);
        }

        return res;
    }

}
