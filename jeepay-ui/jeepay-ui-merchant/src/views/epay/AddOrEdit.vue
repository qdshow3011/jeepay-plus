<template>
  <a-drawer
    v-model:open="vdata.isShow"
    :title="vdata.isAdd ? '新增EPay配置' : '修改EPay配置'"
    width="40%"
    :closable="true"
    :maskClosable="false"
    @close="vdata.isShow = false"
  >
    <a-form
      ref="infoFormModel"
      :model="vdata.saveObject"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      :rules="vdata.rules"
    >
      <a-form-item label="EPay商户PID：" name="pid">
        <a-input
          v-model:value="vdata.saveObject.pid"
          :disabled="!vdata.isAdd"
          placeholder="请输入EPay商户PID"
        />
      </a-form-item>

      <a-form-item label="关联应用ID：" name="appId">
        <a-input
          v-model:value="vdata.saveObject.appId"
          placeholder="请输入关联应用ID"
        />
      </a-form-item>

      <a-form-item label="EPay商户密钥：" name="secret">
        <a-input-password
          v-model:value="vdata.saveObject.secret"
          :placeholder="vdata.isAdd ? '请输入EPay商户密钥' : '留空则不修改'"
          autocomplete="new-password"
        />
      </a-form-item>

      <a-form-item label="状态：" name="state">
        <a-radio-group v-model:value="vdata.stateRadio">
          <a-radio :value="1">启用</a-radio>
          <a-radio :value="0">停用</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="备注：">
        <a-textarea
          v-model:value="vdata.saveObject.remark"
          placeholder="选填"
          :rows="3"
        />
      </a-form-item>
    </a-form>

    <div class="drawer-btn-center">
      <a-button @click="vdata.isShow = false">取消</a-button>
      <a-button type="primary" :loading="vdata.confirmLoading" @click="handleOkFunc">保存</a-button>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { API_URL_MCH_EPAY_CONFIG_LIST, req } from '@/api/manage'
import { reactive, ref, getCurrentInstance } from 'vue'

const { $infoBox } = getCurrentInstance()!.appContext.config.globalProperties

const props = defineProps({
  callbackFunc: { type: Function, default: () => ({}) },
})

const vdata: any = reactive({
  isAdd: true,
  isShow: false,
  confirmLoading: false,
  saveObject: {},
  stateRadio: 1,
  editId: null,
  rules: {
    pid: [
      { required: true, message: '请输入EPay商户PID', trigger: 'blur' },
      { pattern: /^\d+$/, message: 'PID必须为纯数字', trigger: 'blur' },
    ],
    appId: [{ required: true, message: '请输入关联应用ID', trigger: 'blur' }],
    secret: [
      {
        trigger: 'blur',
        validator: (rule, value) => {
          if (vdata.isAdd && !value) {
            return Promise.reject('请输入EPay商户密钥')
          }
          return Promise.resolve()
        },
      },
    ],
  },
})

const infoFormModel = ref()

function show(id) {
  vdata.isAdd = !id
  vdata.saveObject = {}
  vdata.stateRadio = 1
  vdata.confirmLoading = false
  if (infoFormModel.value) {
    infoFormModel.value.resetFields()
  }
  if (!vdata.isAdd) {
    vdata.editId = id
    req.getById(API_URL_MCH_EPAY_CONFIG_LIST, id).then((res) => {
      vdata.saveObject = res
      vdata.stateRadio = res.state
      // 脱敏处理：保存原值到 _ph，清空表单字段
      vdata.saveObject.secret_ph = res.secret
      vdata.saveObject.secret = ''
    })
  }
  vdata.isShow = true
}

function handleOkFunc() {
  infoFormModel.value.validate().then((valid) => {
    if (valid) {
      vdata.confirmLoading = true
      vdata.saveObject.state = vdata.stateRadio
      // 编辑时如果密钥为空（未修改），删除该字段避免覆盖原值
      if (!vdata.isAdd && !vdata.saveObject.secret) {
        delete vdata.saveObject.secret
      }
      // 清理脱敏占位字段
      delete vdata.saveObject.secret_ph

      if (vdata.isAdd) {
        req.add(API_URL_MCH_EPAY_CONFIG_LIST, vdata.saveObject).then((res) => {
          $infoBox.message.success('新增成功')
          vdata.isShow = false
          props.callbackFunc()
        }).catch(() => { vdata.confirmLoading = false })
      } else {
        req.updateById(API_URL_MCH_EPAY_CONFIG_LIST, vdata.editId, vdata.saveObject).then((res) => {
          $infoBox.message.success('修改成功')
          vdata.isShow = false
          props.callbackFunc()
        }).catch(() => { vdata.confirmLoading = false })
      }
    }
  })
}

defineExpose({ show })
</script>
