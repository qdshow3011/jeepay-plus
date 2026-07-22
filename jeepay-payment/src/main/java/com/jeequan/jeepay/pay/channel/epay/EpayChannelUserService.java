package com.jeequan.jeepay.pay.channel.epay;

import com.jeequan.jeepay.core.constants.CS;
import com.jeequan.jeepay.pay.channel.IChannelUserService;
import com.jeequan.jeepay.pay.model.MchAppConfigContext;
import com.alibaba.fastjson.JSONObject;
import org.springframework.stereotype.Service;

/*
 * 易支付 渠道用户服务
 * EPay 为H5聚合支付，不需要OAuth2获取用户ID
 *
 * @author jeequan
 * @site https://www.openhubs.pay
 */
@Service
public class EpayChannelUserService implements IChannelUserService {

    @Override
    public String getIfCode() {
        return CS.IF_CODE.EPAY;
    }

    @Override
    public String buildUserRedirectUrl(String callbackUrlEncode, MchAppConfigContext mchAppConfigContext) {
        // EPay H5 支付不需要 OAuth2 授权
        return callbackUrlEncode;
    }

    @Override
    public String getChannelUserId(JSONObject reqParams, MchAppConfigContext mchAppConfigContext) {
        // EPay H5 不需要获取渠道用户ID
        return "";
    }

}
