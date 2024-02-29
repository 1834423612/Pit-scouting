<template>
  <el-tabs
    v-model="editableTabsValue"
    type="card"
    editable
    class="demo-tabs"
    @edit="handleTabsEdit"
    @tab-click="handleClick"
  >
    <el-tab-pane
      v-for="item in editableTabs"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
    <form-view v-if="editableTabsValue == item.name" :tabIndex = "item.name" @update-tab-title="updateTabTitle" />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { ref } from 'vue'
import formView from '../components/form.vue';
let tabIndex = 1
const editableTabsValue = ref('1')
const editableTabs = ref([
  {
    title: 'Tab 1',
    name: '1',
    content: 'Tab 1 content',
    formValue: null
  },
  {
    title: 'Tab 2',
    name: '2',
    content: 'Tab 2 content',
    formValue: null
  },
]);


// 判断本地存储标签是否有值，无值则赋值操作
const handlerLocalstorage = () => {
  let arr = window.localStorage.getItem('TabsArray')
  if (!arr) {
    window.localStorage.setItem('TabsArray', JSON.stringify(editableTabs.value))
    window.localStorage.setItem('tabsItemClick', '1')
  }
}
handlerLocalstorage()

// 获取本地存储中标签数组的值
const getTabsArray = () => {
  let arr = window.localStorage.getItem('TabsArray')
  let arr2 = window.localStorage.getItem('tabsItemClick')
  if (arr) {
    let TabsArray = JSON.parse(arr)
    editableTabs.value = TabsArray
    editableTabsValue.value = arr2
  }
}
getTabsArray()

// 选择器监听单击事件
const handleClick = (TabsPaneContext,Event) => {
  window.localStorage.setItem('tabsItemClick', TabsPaneContext.props.name)
}

const handleTabsEdit = (
  targetName,
  action
) => {
  let arr = window.localStorage.getItem('TabsArray')
  editableTabs.value = JSON.parse(arr)
  if (action === 'add') {
    const newTabName = (editableTabs.value.length + 1).toString()
    editableTabs.value.push({
      title: 'Tab' + ' ' + JSON.stringify(editableTabs.value.length + 1),
      name: newTabName,
      content: 'Tab' + ' ' + JSON.stringify(editableTabs.value.length +1 ) + ' ' + 'content',
      formValue: null
    })
    editableTabsValue.value = newTabName
  } else if (action === 'remove') {
    const tabs = editableTabs.value
    let activeName = editableTabsValue.value
    if (activeName === targetName) {
      tabs.forEach((tab, index) => {
        if (tab.name === targetName) {
          const nextTab = tabs[index + 1] || tabs[index - 1]
          if (nextTab) {
            activeName = nextTab.name
          }
        }
      })
    }

    editableTabsValue.value = activeName
    editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
  }
  window.localStorage.setItem('TabsArray',JSON.stringify(editableTabs.value))
  window.localStorage.setItem('tabsItemClick', editableTabsValue.value)
}

// 更新标签标题并保存到本地存储
function updateTabTitle({ tabIndex, teamNumber }) {
  const tab = editableTabs.value.find(tab => tab.name === tabIndex);
  if (tab) {
    tab.title = teamNumber ? `Team - ${teamNumber}` : `Tab ${tabIndex}`;
    // 保存更新后的标签数组到本地存储
    window.localStorage.setItem('TabsArray', JSON.stringify(editableTabs.value));
  }
}

</script>

<style lang="scss" scoped></style>