/*
 * EPay（易支付）商户配置管理
 * 运营平台管理 EPay 商户 PID、密钥等配置
 */
package com.jeequan.jeepay.mgr.ctrl.epay;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jeequan.jeepay.core.aop.MethodLog;
import com.jeequan.jeepay.core.constants.ApiCodeEnum;
import com.jeequan.jeepay.core.entity.MchEpayConfig;
import com.jeequan.jeepay.core.model.ApiPageRes;
import com.jeequan.jeepay.core.model.ApiRes;
import com.jeequan.jeepay.mgr.ctrl.CommonCtrl;
import com.jeequan.jeepay.service.impl.MchEpayConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

/**
 * EPay 商户配置管理
 */
@Api(tags = "EPay商户配置管理")
@RestController
@RequestMapping("/api/epayConfig")
public class EpayConfigController extends CommonCtrl {

    @Autowired private MchEpayConfigService epayConfigService;

    /**
     * 查询 EPay 配置列表
     */
    @ApiOperation("EPay配置列表")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "pageNumber", value = "分页页码", dataType = "int", defaultValue = "1"),
            @ApiImplicitParam(name = "pageSize", value = "分页条数", dataType = "int", defaultValue = "20"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID"),
            @ApiImplicitParam(name = "mchNo", value = "关联商户号"),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte")
    })
    @PreAuthorize("hasAuthority('ENT_EPAY_CONFIG_LIST')")
    @RequestMapping(value = "", method = RequestMethod.GET)
    public ApiPageRes<MchEpayConfig> list() {
        MchEpayConfig query = getObject(MchEpayConfig.class);
        LambdaQueryWrapper<MchEpayConfig> wrapper = MchEpayConfig.gw();
        if (StringUtils.isNotEmpty(query.getPid())) {
            wrapper.eq(MchEpayConfig::getPid, query.getPid());
        }
        if (StringUtils.isNotEmpty(query.getMchNo())) {
            wrapper.eq(MchEpayConfig::getMchNo, query.getMchNo());
        }
        if (query.getState() != null) {
            wrapper.eq(MchEpayConfig::getState, query.getState());
        }
        wrapper.orderByDesc(MchEpayConfig::getCreatedAt);
        IPage<MchEpayConfig> pages = epayConfigService.page(getIPage(true), wrapper);
        return ApiPageRes.pages(pages);
    }

    /**
     * 新增 EPay 配置
     */
    @ApiOperation("新增EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID", required = true),
            @ApiImplicitParam(name = "mchNo", value = "关联商户号", required = true),
            @ApiImplicitParam(name = "appId", value = "关联应用ID", required = true),
            @ApiImplicitParam(name = "secret", value = "EPay商户密钥", required = true),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte"),
            @ApiImplicitParam(name = "remark", value = "备注")
    })
    @PreAuthorize("hasAuthority('ENT_EPAY_CONFIG_ADD')")
    @MethodLog(remark = "新增EPay配置")
    @RequestMapping(value = "", method = RequestMethod.POST)
    public ApiRes add() {
        MchEpayConfig config = getObject(MchEpayConfig.class);
        config.setCreatedAt(new Date());
        config.setUpdatedAt(new Date());
        if (config.getState() == null) {
            config.setState(MchEpayConfig.STATE_ENABLED);
        }
        boolean result = epayConfigService.save(config);
        if (!result) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_CREATE);
        }
        return ApiRes.ok();
    }

    /**
     * 更新 EPay 配置
     */
    @ApiOperation("更新EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID"),
            @ApiImplicitParam(name = "mchNo", value = "关联商户号"),
            @ApiImplicitParam(name = "appId", value = "关联应用ID"),
            @ApiImplicitParam(name = "secret", value = "EPay商户密钥"),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte"),
            @ApiImplicitParam(name = "remark", value = "备注")
    })
    @PreAuthorize("hasAuthority('ENT_EPAY_CONFIG_EDIT')")
    @MethodLog(remark = "更新EPay配置")
    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ApiRes update(@PathVariable("id") Long id) {
        MchEpayConfig config = getObject(MchEpayConfig.class);
        config.setId(id);
        config.setUpdatedAt(new Date());
        boolean result = epayConfigService.updateById(config);
        if (!result) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_UPDATE);
        }
        return ApiRes.ok();
    }

    /**
     * 删除 EPay 配置
     */
    @ApiOperation("删除EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long")
    })
    @PreAuthorize("hasAuthority('ENT_EPAY_CONFIG_DEL')")
    @MethodLog(remark = "删除EPay配置")
    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public ApiRes delete(@PathVariable("id") Long id) {
        boolean result = epayConfigService.removeById(id);
        if (!result) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_DELETE);
        }
        return ApiRes.ok();
    }

    /**
     * 查看 EPay 配置详情
     */
    @ApiOperation("查看EPay配置详情")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long")
    })
    @PreAuthorize("hasAnyAuthority('ENT_EPAY_CONFIG_VIEW', 'ENT_EPAY_CONFIG_EDIT')")
    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ApiRes detail(@PathVariable("id") Long id) {
        MchEpayConfig config = epayConfigService.getById(id);
        if (config == null) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_SELETE);
        }
        return ApiRes.ok(config);
    }
}
