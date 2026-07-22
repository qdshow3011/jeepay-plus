/*
 * EPay（易支付）商户配置管理 — 商户端
 * 商户只能管理自己名下的 EPay 配置
 */
package com.jeequan.jeepay.mch.ctrl.epay;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jeequan.jeepay.core.aop.MethodLog;
import com.jeequan.jeepay.core.constants.ApiCodeEnum;
import com.jeequan.jeepay.core.entity.MchEpayConfig;
import com.jeequan.jeepay.core.exception.BizException;
import com.jeequan.jeepay.core.model.ApiPageRes;
import com.jeequan.jeepay.core.model.ApiRes;
import com.jeequan.jeepay.mch.ctrl.CommonCtrl;
import com.jeequan.jeepay.service.impl.MchEpayConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

/**
 * EPay 商户配置管理（商户端）
 */
@Api(tags = "EPay配置管理（商户端）")
@RestController
@RequestMapping("/api/mch/epayConfig")
public class EpayConfigController extends CommonCtrl {

    @Autowired private MchEpayConfigService epayConfigService;

    /**
     * 查询当前商户的 EPay 配置列表
     */
    @ApiOperation("EPay配置列表")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "pageNumber", value = "分页页码", dataType = "int", defaultValue = "1"),
            @ApiImplicitParam(name = "pageSize", value = "分页条数", dataType = "int", defaultValue = "20"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID"),
            @ApiImplicitParam(name = "appId", value = "关联应用ID"),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte")
    })
    @PreAuthorize("hasAuthority('ENT_MCH_EPAY_CONFIG_LIST')")
    @GetMapping
    public ApiPageRes<MchEpayConfig> list() {
        MchEpayConfig query = getObject(MchEpayConfig.class);
        // 强制绑定当前登录商户号
        query.setMchNo(getCurrentMchNo());

        LambdaQueryWrapper<MchEpayConfig> wrapper = MchEpayConfig.gw();
        wrapper.eq(MchEpayConfig::getMchNo, getCurrentMchNo());
        if (StringUtils.isNotEmpty(query.getPid())) {
            wrapper.eq(MchEpayConfig::getPid, query.getPid());
        }
        if (StringUtils.isNotEmpty(query.getAppId())) {
            wrapper.eq(MchEpayConfig::getAppId, query.getAppId());
        }
        if (query.getState() != null) {
            wrapper.eq(MchEpayConfig::getState, query.getState());
        }
        wrapper.orderByDesc(MchEpayConfig::getCreatedAt);
        IPage<MchEpayConfig> pages = epayConfigService.page(getIPage(true), wrapper);
        return ApiPageRes.pages(pages);
    }

    /**
     * 新增 EPay 配置（自动绑定当前商户号）
     */
    @ApiOperation("新增EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID", required = true),
            @ApiImplicitParam(name = "appId", value = "关联应用ID", required = true),
            @ApiImplicitParam(name = "secret", value = "EPay商户密钥", required = true),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte"),
            @ApiImplicitParam(name = "remark", value = "备注")
    })
    @PreAuthorize("hasAuthority('ENT_MCH_EPAY_CONFIG_ADD')")
    @MethodLog(remark = "新增EPay配置")
    @PostMapping
    public ApiRes add() {
        MchEpayConfig config = getObject(MchEpayConfig.class);
        config.setMchNo(getCurrentMchNo());
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
     * 更新 EPay 配置（仅允许操作本商户数据）
     */
    @ApiOperation("更新EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long"),
            @ApiImplicitParam(name = "pid", value = "EPay商户PID"),
            @ApiImplicitParam(name = "appId", value = "关联应用ID"),
            @ApiImplicitParam(name = "secret", value = "EPay商户密钥"),
            @ApiImplicitParam(name = "state", value = "状态: 0-停用, 1-启用", dataType = "Byte"),
            @ApiImplicitParam(name = "remark", value = "备注")
    })
    @PreAuthorize("hasAuthority('ENT_MCH_EPAY_CONFIG_EDIT')")
    @MethodLog(remark = "更新EPay配置")
    @PutMapping("/{id}")
    public ApiRes update(@PathVariable("id") Long id) {
        MchEpayConfig dbRecord = epayConfigService.getById(id);
        if (dbRecord == null || !dbRecord.getMchNo().equals(getCurrentMchNo())) {
            throw new BizException("无权操作！");
        }
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
     * 删除 EPay 配置（仅允许操作本商户数据）
     */
    @ApiOperation("删除EPay配置")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long")
    })
    @PreAuthorize("hasAuthority('ENT_MCH_EPAY_CONFIG_DEL')")
    @MethodLog(remark = "删除EPay配置")
    @DeleteMapping("/{id}")
    public ApiRes delete(@PathVariable("id") Long id) {
        MchEpayConfig dbRecord = epayConfigService.getById(id);
        if (dbRecord == null || !dbRecord.getMchNo().equals(getCurrentMchNo())) {
            throw new BizException("无权操作！");
        }
        boolean result = epayConfigService.removeById(id);
        if (!result) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_DELETE);
        }
        return ApiRes.ok();
    }

    /**
     * 查看 EPay 配置详情（仅允许操作本商户数据）
     */
    @ApiOperation("查看EPay配置详情")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "iToken", value = "用户身份凭证", required = true, paramType = "header"),
            @ApiImplicitParam(name = "id", value = "配置ID", required = true, dataType = "Long")
    })
    @PreAuthorize("hasAnyAuthority('ENT_MCH_EPAY_CONFIG_VIEW', 'ENT_MCH_EPAY_CONFIG_EDIT')")
    @GetMapping("/{id}")
    public ApiRes detail(@PathVariable("id") Long id) {
        MchEpayConfig config = epayConfigService.getById(id);
        if (config == null || !config.getMchNo().equals(getCurrentMchNo())) {
            return ApiRes.fail(ApiCodeEnum.SYS_OPERATION_FAIL_SELETE);
        }
        return ApiRes.ok(config);
    }
}
