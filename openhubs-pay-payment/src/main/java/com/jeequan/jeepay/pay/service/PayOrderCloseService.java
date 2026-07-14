package com.openhubs.pay.pay.service;

import com.openhubs.pay.core.entity.PayOrder;
import com.openhubs.pay.pay.channel.IPayOrderCloseService;
import com.openhubs.pay.pay.model.MchAppConfigContext;
import com.openhubs.pay.pay.rqrs.msg.ChannelRetMsg;
import com.openhubs.pay.service.impl.PayOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Safely coordinates channel close and the local conditional state transition. */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayOrderCloseService {
    public enum CloseResult { CLOSED, REJECTED, UNSUPPORTED, UNKNOWN }

    private final ApplicationContext applicationContext;
    private final ConfigContextQueryService configContextQueryService;
    private final PayOrderService payOrderService;

    @Transactional
    public CloseResult close(PayOrder payOrder) {
        IPayOrderCloseService channelService;
        try {
            channelService = applicationContext.getBean(
                    payOrder.getIfCode() + "PayOrderCloseService", IPayOrderCloseService.class);
        } catch (NoSuchBeanDefinitionException ex) {
            return CloseResult.UNSUPPORTED;
        }
        try {
            MchAppConfigContext context = configContextQueryService.queryMchInfoAndAppInfo(
                    payOrder.getMchNo(), payOrder.getAppId());
            ChannelRetMsg result = channelService.close(payOrder, context);
            if (result == null || result.getChannelState() == null
                    || result.getChannelState() == ChannelRetMsg.ChannelState.UNKNOWN
                    || result.getChannelState() == ChannelRetMsg.ChannelState.WAITING) {
                return CloseResult.UNKNOWN;
            }
            if (result.getChannelState() != ChannelRetMsg.ChannelState.CONFIRM_SUCCESS) {
                return CloseResult.REJECTED;
            }
            return payOrderService.updateIng2Close(payOrder.getPayOrderId())
                    ? CloseResult.CLOSED : CloseResult.UNKNOWN;
        } catch (Exception ex) {
            log.error("Channel order close failed, payOrderId={}, ifCode={}",
                    payOrder.getPayOrderId(), payOrder.getIfCode(), ex);
            return CloseResult.UNKNOWN;
        }
    }
}
