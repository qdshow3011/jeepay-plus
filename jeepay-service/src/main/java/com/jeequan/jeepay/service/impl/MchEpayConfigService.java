/*
 * EPay（易支付）商户配置服务
 */
package com.jeequan.jeepay.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jeequan.jeepay.core.entity.MchEpayConfig;
import com.jeequan.jeepay.service.mapper.MchEpayConfigMapper;
import org.springframework.stereotype.Service;

/**
 * EPay 商户配置 Service
 */
@Service
public class MchEpayConfigService extends ServiceImpl<MchEpayConfigMapper, MchEpayConfig> {
}
