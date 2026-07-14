/*
 * Copyright (c) 2021-2031, 河北计全科技有限公司 (https://www.openhubs.com & jeequan@126.com).
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
package com.openhubs.pay.pay.channel.plspay.payway;

import com.openhubs.pay.core.constants.CS;
import com.openhubs.pay.core.entity.PayOrder;
import com.openhubs.pay.core.model.params.plspay.PlspayConfig;
import com.openhubs.pay.exception.OpenHubsPayException;
import com.openhubs.pay.model.PayOrderCreateReqModel;
import com.openhubs.pay.pay.channel.plspay.PlspayKit;
import com.openhubs.pay.pay.channel.plspay.PlspayPaymentService;
import com.openhubs.pay.pay.model.MchAppConfigContext;
import com.openhubs.pay.pay.rqrs.AbstractRS;
import com.openhubs.pay.pay.rqrs.msg.ChannelRetMsg;
import com.openhubs.pay.pay.rqrs.payorder.UnifiedOrderRQ;
import com.openhubs.pay.pay.rqrs.payorder.payway.AliQrOrderRQ;
import com.openhubs.pay.pay.rqrs.payorder.payway.AliQrOrderRS;
import com.openhubs.pay.pay.util.ApiResBuilder;
import com.openhubs.pay.response.PayOrderCreateResponse;
import org.springframework.stereotype.Service;

/*
 * 计全付 支付宝 二维码支付
 *
 * @author yr
 * @site https://www.openhubs.com
 * @date 2022/8/15 09:46
 */
@Service("plspayPaymentByAliQrService") //Service Name需保持全局唯一性
public class AliQr extends PlspayPaymentService {

    @Override
    public String preCheck(UnifiedOrderRQ rq, PayOrder payOrder) {
        return null;
    }

    @Override
    public AbstractRS pay(UnifiedOrderRQ rq, PayOrder payOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        AliQrOrderRQ aliQrOrderRQ = (AliQrOrderRQ) rq;
        // 构造函数响应数据
        AliQrOrderRS res = ApiResBuilder.buildSuccess(AliQrOrderRS.class);
        ChannelRetMsg channelRetMsg = new ChannelRetMsg();
        res.setChannelRetMsg(channelRetMsg);
        try {
            // 构建请求数据
            PayOrderCreateReqModel model = new PayOrderCreateReqModel();
            // 支付方式
            model.setWayCode(PlspayConfig.ALI_QR);
            // 异步通知地址
            model.setNotifyUrl(getNotifyUrl());

            // 发起统一下单
            PayOrderCreateResponse response = PlspayKit.payRequest(payOrder, mchAppConfigContext, model);
            // 下单返回状态
            Boolean isSuccess = PlspayKit.checkPayResp(response, mchAppConfigContext);

            if (isSuccess) {
                // 下单成功
                // 二维码图片地址
                if (CS.PAY_DATA_TYPE.CODE_IMG_URL.equals(aliQrOrderRQ.getPayDataType())) {
                    res.setCodeImgUrl(sysConfigService.getDBApplicationConfig().genScanImgUrl(response.get().getPayData()));
                } else {
                    res.setCodeUrl(response.get().getPayData());
                }
                channelRetMsg.setChannelOrderId(response.get().getPayOrderId());
                channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.WAITING);
            } else {
                channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
                channelRetMsg.setChannelErrCode(response.getCode()+"");
                channelRetMsg.setChannelErrMsg(response.getMsg());
            }
        } catch (OpenHubsPayException e) {
            channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
        }
        return res;
    }
}