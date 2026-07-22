/*
 * EPay（易支付）商户配置表
 */
package com.jeequan.jeepay.core.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jeequan.jeepay.core.model.BaseModel;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@ApiModel(value = "EPay商户配置表")
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_epay_config")
public class MchEpayConfig extends BaseModel implements Serializable {

    public static final LambdaQueryWrapper<MchEpayConfig> gw() {
        return new LambdaQueryWrapper<>();
    }

    private static final long serialVersionUID = 1L;

    public static final byte STATE_DISABLED = 0;
    public static final byte STATE_ENABLED = 1;

    @ApiModelProperty(value = "自增ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @ApiModelProperty(value = "EPay商户PID（对外暴露的商户标识）")
    private String pid;

    @ApiModelProperty(value = "关联商户号")
    private String mchNo;

    @ApiModelProperty(value = "关联应用ID")
    private String appId;

    @ApiModelProperty(value = "EPay商户密钥")
    private String secret;

    @ApiModelProperty(value = "状态: 0-停用, 1-启用")
    private Byte state;

    @ApiModelProperty(value = "备注")
    private String remark;

    @ApiModelProperty(value = "创建时间")
    private Date createdAt;

    @ApiModelProperty(value = "更新时间")
    private Date updatedAt;
}
