<template>
  <div>
    <header class="header">
      <div class="header-text">付款给 {{ payOrderInfo.mchName }}</div>
    </header>
    <div class="plus-input">
      <div class="S"><img src="../../assets/icon/S.svg" alt="" /></div>
      <div class="input-c" style="width: 100%">
        <div v-if="payOrderInfo.amount" class="input-c-div-1">{{ (payOrderInfo.amount/100).toFixed(2) }}</div>
        <input type="number" style="height: 120px;" v-else v-model="amount" placeholder="请输入金额">
      </div>
    </div>
    <ul class="plus-ul">
      <li v-for="item in payTypes" :key="item.value"
          :style="{ borderRadius: '10px', border: selectedType === item.value ? '2px solid #1678ff' : '1px solid #eee' }"
          @click="selectedType = item.value">
        <div class="img-div">
          <div class="div-text">{{ item.label }}</div>
          <div v-if="selectedType === item.value" style="color:#1678ff;font-size:20px;">&#10003;</div>
        </div>
      </li>
    </ul>
    <div class="bnt-pay">
      <div class="bnt-pay-text" style="background-color:#1678ff" @click="pay">付款</div>
    </div>
  </div>
</template>

<script>
import { getEpayPackage, getPayOrderInfo } from '@/api/api'
import config from '@/config'

export default {
  name: 'EpayPay',

  data() {
    return {
      amount: null,
      payOrderInfo: {},
      selectedType: 'alipay',
      payTypes: [
        { label: '支付宝', value: 'alipay' },
        { label: '微信支付', value: 'wxpay' },
      ],
    }
  },

  mounted() {
    this.setPayOrderInfo()
  },

  methods: {
    setPayOrderInfo() {
      const that = this
      getPayOrderInfo().then(res => {
        that.payOrderInfo = res
        if (res.amount) {
          that.amount = res.amount / 100
        }
      }).catch(res => {
        that.$router.push({ name: config.errorPageRouteName, params: { errInfo: res.msg } })
      })
    },

    pay() {
      if (isNaN(this.amount) || this.amount <= 0) {
        return alert('请输入金额')
      }

      const that = this

      getEpayPackage(that.selectedType, (that.amount * 100).toFixed(0)).then(res => {
        if (!res || !res.data) {
          return alert('获取支付地址失败')
        }

        const payData = res.data

        // 判断支付数据类型
        if (payData.payUrl) {
          // H5 跳转支付
          window.location.href = payData.payUrl
        } else if (payData.codeUrl) {
          // 二维码支付
          window.location.href = payData.codeUrl
        } else if (payData.formContent) {
          // 表单提交
          document.write(payData.formContent)
        } else {
          alert('未知支付参数')
        }
      }).catch(res => {
        that.$router.push({ name: config.errorPageRouteName, params: { errInfo: res.msg || '支付请求失败' } })
      })
    },
  },
}
</script>
<style lang="css" scoped>
@import './pay.css';
</style>
