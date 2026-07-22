<template>
  <a-modal
    v-model:open="vdata.isShow"
    :title="vdata.isReadonly ? 'EPay配置详情' : (vdata.isAdd ? '新增EPay配置' : '修改EPay配置')"
    :width="vdata.isReadonly ? 560 : 620"
    :footer="vdata.isReadonly ? null : undefined"
    @ok="handleOkFunc"
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
          :disabled="vdata.isReadonly || !vdata.isAdd"
          placeholder="请输入EPay商户PID"
        />
      </a-form-item>

      <a-form-item label="关联商户号：" name="mchNo">
        <a-input
          v-model:value="vdata.saveObject.mchNo"
          :disabled="vdata.isReadonly"
          placeholder="请输入关联商户号"
        />
      </a-form-item>

      <a-form-item label="关联应用ID：" name="appId">
        <a-input
          v-model:value="vdata.saveObject.appId"
          :disabled="vdata.isReadonly"
          placeholder="请输入关联应用ID"
        />
      </a-form-item>

      <a-form-item label="EPay商户密钥：" name="secret" v-if="!vdata.isReadonly">
        <a-input-password
          v-model:value="vdata.saveObject.secret"
          :placeholder="vdata.isAdd ? '请输入EPay商户密钥' : '留空则不修改'"
          autocomplete="new-password"
        />
      </a-form-item>

      <a-form-item label="EPay商户密钥：" v-if="vdata.isReadonly">
        <a-input :value="vdata.saveObject.secret ? '******' : ''" disabled />
      </a-form-item>

      <a-form-item label="状态：" name="state" v-if="!vdata.isReadonly">
        <a-switch
          v-model:checked="vdata.stateBool"
          checked-children="启用"
          un-checked-children="停用"
        />
      </a-form-item>

      <a-form-item label="状态：" v-if="vdata.isReadonly">
        <a-tag :color="vdata.saveObject.state === 1 ? 'green' : 'red'">
          {{ vdata.saveObject.state === 1 ? '启用' : '停用' }}
        </a-tag>
      </a-form-item>

      <a-form-item label="备注：">
        <a-textarea
          v-model:value="vdata.saveObject.remark"
          :disabled="vdata.isReadonly"
          placeholder="选填"
          :rows="3"
        />
      </a-form-item>

      <template v-if="vdata.isReadonly">
        <a-divider>时间信息</a-divider>
        <a-form-item label="创建时间：">
          <span>{{ vdata.saveObject.createdAt || '-' }}</span>
        </a-form-item>
        <a-form-item label="更新时间：">
          <span>{{ vdata.saveObject.updatedAt || '-' }}</span>
        </a-form-item>
      </template>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { API_URL_EPAY_CONFIG_LIST, req } from '@/api/manage'
import { reactive, ref, getCurrentInstance } from 'vue'

const { $infoBox } = getCurrentInstance()!.appContext.config.globalProperties

const props = defineProps({
  callbackFunc: { type: Function, default: () => () => ({}) },
})

const vdata: any = reactive({
  isAdd: true,
  isReadonly: false,
  isShow: false,
  saveObject: {},
  editId: null,
  stateBool: true,
  rules: {
    pid: [
      { required: true, message: '请输入EPay商户PID', trigger: 'blur' },
      { pattern: /^\d+$/, message: 'PID必须为纯数字', trigger: 'blur' },
    ],
    mchNo: [{ required: true, message: '请输入关联商户号', trigger: 'blur' }],
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

function show(id, isReadonly = false) {
  vdata.isAdd = !id
  vdata.isReadonly = isReadonly
  vdata.saveObject = {}
  vdata.stateBool = true
  if (infoFormModel.value) {
    infoFormModel.value.resetFields()
  }
  if (!vdata.isAdd) {
    vdata.editId = id
    req.getById(API_URL_EPAY_CONFIG_LIST, id).then((res) => {
      vdata.saveObject = res
      vdata.stateBool = res.state === 1
      // 脱敏处理：保存原值到 _ph，清空表单字段
      vdata.saveObject.secret_ph = res.secret
      vdata.saveObject.secret = ''
    })
  }
  vdata.isShow = true
}

function handleOkFunc() {
  if (vdata.isReadonly) {
    vdata.isShow = false
    return
  }
  infoFormModel.value.validate().then((valid) => {
    if (valid) {
      vdata.saveObject.state = vdata.stateBool ? 1 : 0
      // 编辑时如果密钥为空（未修改），删除该字段避免覆盖原值
      if (!vdata.isAdd && !vdata.saveObject.secret) {
        delete vdata.saveObject.secret
      }
      // 清理脱敏占位字段
      delete vdata.saveObject.secret_ph

      if (vdata.isAdd) {
        req.add(API_URL_EPAY_CONFIG_LIST, vdata.saveObject).then((res) => {
          $infoBox.message.success('新增成功')
          vdata.isShow = false
          props.callbackFunc()
        })
      } else {
        req.updateById(API_URL_EPAY_CONFIG_LIST, vdata.editId, vdata.saveObject).then((res) => {
          $infoBox.message.success('修改成功')
          vdata.isShow = false
          props.callbackFunc()
        })
      }
    }
  })
}

defineExpose({ show })
</script>
