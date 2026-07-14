package com.openhubs.pay.pay.channel.pppay;

import com.openhubs.pay.core.constants.CS;
import com.openhubs.pay.core.entity.PayOrder;
import com.openhubs.pay.pay.channel.IPayOrderQueryService;
import com.openhubs.pay.pay.model.MchAppConfigContext;
import com.openhubs.pay.pay.rqrs.msg.ChannelRetMsg;
import com.openhubs.pay.pay.service.ConfigContextQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * none.
 *
 * @author 陈泉
 * @package com.openhubs.pay.pay.channel.pppay
 * @create 2021/11/15 21:02
 */
@Service
public class PppayPayOrderQueryService implements IPayOrderQueryService {

    @Override
    public String getIfCode() {
        return CS.IF_CODE.PPPAY;
    }

    @Autowired
    private ConfigContextQueryService configContextQueryService;

    @Override
    public ChannelRetMsg query(PayOrder payOrder, MchAppConfigContext mchAppConfigContext) throws Exception {
        return configContextQueryService.getPaypalWrapper(mchAppConfigContext).processOrder(null, payOrder);
    }
}
