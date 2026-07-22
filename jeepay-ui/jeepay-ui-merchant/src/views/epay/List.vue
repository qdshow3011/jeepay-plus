<template>
  <page-header-wrapper>
    <a-card>
      <div v-if="$access('ENT_MCH_EPAY_CONFIG_LIST')" class="table-page-search-wrapper">
        <a-form layout="inline" class="table-head-ground">
          <div class="table-layer">
            <jeepay-text-up :placeholder="'EPay商户PID'" v-model:value="vdata.searchData.pid" />
            <jeepay-text-up :placeholder="'关联应用ID'" v-model:value="vdata.searchData.appId" />
            <a-form-item label="状态:" class="table-head-layout">
              <a-select v-model:value="vdata.searchData.state" placeholder="全部" allow-clear style="width: 120px">
                <a-select-option :value="1">启用</a-select-option>
                <a-select-option :value="0">停用</a-select-option>
              </a-select>
            </a-form-item>
            <span class="table-page-search-submitButtons">
              <a-button type="primary" @click="searchFunc(true)" :loading="vdata.btnLoading">查询</a-button>
              <a-button style="margin-left: 8px" @click="() => (vdata.searchData = {})">重置</a-button>
            </span>
          </div>
        </a-form>
      </div>

      <JeepayTable
        @btnLoadClose="vdata.btnLoading = false"
        ref="infoTable"
        :initData="true"
        :reqTableDataFunc="reqTableDataFunc"
        :tableColumns="vdata.tableColumns"
        :searchData="vdata.searchData"
        rowKey="id"
      >
        <template #opRow>
          <a-button v-if="$access('ENT_MCH_EPAY_CONFIG_ADD')" type="primary" @click="addFunc" class="mg-b-30">新建</a-button>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pid'">
            <b>{{ record.pid }}</b>
          </template>
          <template v-if="column.key === 'state'">
            <JeepayTableColState
              :state="record.state"
              :showSwitchType="$access('ENT_MCH_EPAY_CONFIG_EDIT')"
              @onChange="(newState) => changeState(record, newState)"
            />
          </template>
          <template v-if="column.key === 'op'">
            <JeepayTableColumns>
              <a-button type="link" v-if="$access('ENT_MCH_EPAY_CONFIG_EDIT')" @click="editFunc(record.id)">修改</a-button>
              <a-button type="link" danger v-if="$access('ENT_MCH_EPAY_CONFIG_DEL')" @click="delFunc(record.id)">删除</a-button>
            </JeepayTableColumns>
          </template>
        </template>
      </JeepayTable>
    </a-card>

    <InfoAddOrEdit ref="infoAddOrEdit" :callbackFunc="searchFunc" />
  </page-header-wrapper>
</template>

<script setup lang="ts">
import { API_URL_MCH_EPAY_CONFIG_LIST, req } from '@/api/manage'
import InfoAddOrEdit from './AddOrEdit.vue'
import { reactive, ref, getCurrentInstance } from 'vue'

const { $infoBox, $access } = getCurrentInstance()!.appContext.config.globalProperties

const tableColumns = [
  { key: 'pid', fixed: 'left', title: 'EPay商户PID', width: '160px', scopedSlots: { customRender: 'pidSlot' } },
  { key: 'appId', title: '关联应用ID', dataIndex: 'appId', width: '160px' },
  { key: 'state', title: '状态', dataIndex: 'state', width: '80px', align: 'center', scopedSlots: { customRender: 'stateSlot' } },
  { key: 'remark', title: '备注', dataIndex: 'remark', ellipsis: true },
  { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt', width: '170px' },
  { key: 'op', title: '操作', width: '160px', fixed: 'right', align: 'center', scopedSlots: { customRender: 'opSlot' } },
]

const vdata: any = reactive({
  tableColumns: tableColumns,
  searchData: {},
  btnLoading: false,
})

const infoTable = ref()
const infoAddOrEdit = ref()

function reqTableDataFunc(params) {
  return req.list(API_URL_MCH_EPAY_CONFIG_LIST, params)
}

function searchFunc(isToFirst = false) {
  vdata.btnLoading = true
  infoTable.value.refTable(isToFirst)
}

function addFunc() {
  infoAddOrEdit.value.show()
}

function editFunc(id) {
  infoAddOrEdit.value.show(id)
}

function delFunc(id) {
  $infoBox.confirmDanger('确认删除？', '删除后不可恢复，请谨慎操作。', () => {
    req.delById(API_URL_MCH_EPAY_CONFIG_LIST, id).then((res) => {
      $infoBox.message.success('删除成功！')
      infoTable.value.refTable(false)
    })
  })
}

function changeState(record, newState) {
  req.updateById(API_URL_MCH_EPAY_CONFIG_LIST, record.id, { id: record.id, state: newState }).then((res) => {
    $infoBox.message.success('状态更新成功！')
    infoTable.value.refTable(false)
  })
}
</script>
