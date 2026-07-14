package com.openhubs.pay.pay.channel.plspay;

import com.openhubs.pay.Jeepay;
import com.openhubs.pay.OpenHubsPayClient;
import com.openhubs.pay.core.constants.CS;
import com.openhubs.pay.core.entity.PayOrder;
import com.openhubs.pay.core.model.params.plspay.PlspayConfig;
import com.openhubs.pay.core.model.params.plspay.PlspayNormalMchParams;
import com.openhubs.pay.core.utils.SpringBeansUtil;
import com.openhubs.pay.exception.OpenHubsPayException;
import com.openhubs.pay.model.PayOrderCreateReqModel;
import com.openhubs.pay.pay.model.MchAppConfigContext;
import com.openhubs.pay.pay.service.ConfigContextQueryService;
import com.openhubs.pay.request.PayOrderCreateRequest;
import com.openhubs.pay.response.OpenHubsPayResponse;
import com.openhubs.pay.response.PayOrderCreateResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

/*
 * 工具类
 *
 * @author xiaoyu
 * @site https://www.openhubs.com
 * @date 2022/8/23 16:29
 */
@Slf4j
public class PlspayKit {


	public static PayOrderCreateResponse payRequest(PayOrder payOrder, MchAppConfigContext mchAppConfigContext, PayOrderCreateReqModel model) throws OpenHubsPayException {

		// 发起统一下单
		PayOrderCreateResponse response = new PayOrderCreateResponse();
		ConfigContextQueryService configContextQueryService = SpringBeansUtil.getBean(ConfigContextQueryService.class);
		PlspayNormalMchParams normalMchParams = (PlspayNormalMchParams) configContextQueryService.queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), CS.IF_CODE.PLSPAY);
		// 构建请求数据
		PayOrderCreateRequest request = new PayOrderCreateRequest();
		model.setMchNo(normalMchParams.getMerchantNo());        // 商户号
		model.setAppId(normalMchParams.getAppId());             // 应用ID
		model.setMchOrderNo(payOrder.getPayOrderId());          // 商户订单号
		model.setAmount(payOrder.getAmount());                  // 金额，单位分
		model.setCurrency(payOrder.getCurrency());              // 币种，目前只支持cny
		model.setClientIp(payOrder.getClientIp());              // 发起支付请求客户端的IP地址
		model.setSubject(payOrder.getSubject());                // 商品标题
		model.setBody(payOrder.getBody());                      // 商品描述
		request.setBizModel(model);

		if (normalMchParams.getSignType().equals(PlspayConfig.DEFAULT_SIGN_TYPE) || StringUtils.isEmpty(normalMchParams.getSignType())) {
			OpenHubsPayClient openHubsPayClient = OpenHubsPayClient.getInstance(normalMchParams.getAppId(), normalMchParams.getAppSecret(), Jeepay.getApiBase());
			response = openHubsPayClient.execute(request);

		} else if (normalMchParams.getSignType().equals(PlspayConfig.SIGN_TYPE_RSA2)) {
			OpenHubsPayClient openHubsPayClient = OpenHubsPayClient.getInstance(normalMchParams.getAppId(), normalMchParams.getRsa2AppPrivateKey(), Jeepay.getApiBase());
			response = openHubsPayClient.executeByRSA2(request);
		}
		return response;
	}

	public static Boolean checkPayResp(OpenHubsPayResponse response , MchAppConfigContext mchAppConfigContext) {
		ConfigContextQueryService configContextQueryService = SpringBeansUtil.getBean(ConfigContextQueryService.class);
		PlspayNormalMchParams normalMchParams = (PlspayNormalMchParams) configContextQueryService.queryNormalMchParams(mchAppConfigContext.getMchNo(), mchAppConfigContext.getAppId(), CS.IF_CODE.PLSPAY);

		boolean isSuccess = false;
		if (normalMchParams.getSignType().equals(PlspayConfig.DEFAULT_SIGN_TYPE) || StringUtils.isEmpty(normalMchParams.getSignType())) {
			isSuccess = response.isSuccess(normalMchParams.getAppSecret());

		} else if (normalMchParams.getSignType().equals(PlspayConfig.SIGN_TYPE_RSA2)) {
			isSuccess = response.isSuccessByRsa2(normalMchParams.getRsa2PayPublicKey());
		}

		return isSuccess;
	}

}
