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

import com.jeequan.jeepay.core.constants.CS;
import com.jeequan.jeepay.core.entity.PayOrder;
import com.jeequan.jeepay.core.entity.RefundOrder;
import com.jeequan.jeepay.pay.channel.AbstractRefundService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.jeequan.jeepay.pay.rqrs.msg.ChannelRetMsg;
import com.jeequan.jeepay.pay.rqrs.refund.RefundOrderRQ;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/*
 * 退款接口： 易支付
 * 注意：大部分 EPay 聚合网关不支持协议退款，退款需在聚合平台手动操作
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service
@Slf4j
public class EpayRefundService extends AbstractRefundService {

    @Override
    public String getIfCode() {
        return CS.IF_CODE.EPAY;
    }

    @Override
    public String preCheck(RefundOrderRQ bizRQ, RefundOrder refundOrder, PayOrder payOrder) {
        return null;
    }

    @Override
    public ChannelRetMsg refund(RefundOrderRQ bizRQ, RefundOrder refundOrder, PayOrder payOrder,
                                 MchAppConfigContext mchAppConfigContext) throws Exception {
        // EPay 聚合网关通常不支持协议退款
        ChannelRetMsg channelRetMsg = new ChannelRetMsg();
        channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
        channelRetMsg.setChannelErrMsg("EPay聚合网关不支持协议退款，请前往聚合平台手动退款");
        return channelRetMsg;
    }

    @Override
    public ChannelRetMsg query(RefundOrder refundOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        ChannelRetMsg channelRetMsg = new ChannelRetMsg();
        channelRetMsg.setChannelState(ChannelRetMsg.ChannelState.CONFIRM_FAIL);
        channelRetMsg.setChannelErrMsg("EPay聚合网关不支持退款查询");
        return channelRetMsg;
    }

}
