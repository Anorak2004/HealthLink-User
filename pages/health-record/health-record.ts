// health-record.ts
import { apiService } from "../../utils/api"
import { Page, wx } from "../../utils/miniprogram-api"

interface HealthRecordData {
  selectedType: string
  inputValue: string
  recordDate: string
  recordTime: string
  note: string
  dataTypes: Array<{
    value: string
    label: string
    icon: string
    inputType: string
    placeholder: string
    unit: string
    showNote: boolean
  }>
  currentTypeInfo: {
    label: string
    inputType: string
    placeholder: string
    unit: string
    showNote: boolean
  }
  recentRecords: Array<{
    id: string
    typeLabel: string
    value: string
    unit: string
    date: string
    time: string
  }>
}

Page<HealthRecordData, {}>({
  data: {
    selectedType: "blood_pressure",
    inputValue: "",
    recordDate: "",
    recordTime: "",
    note: "",
    dataTypes: [
      {
        value: "blood_pressure",
        label: "血压",
        icon: "/images/record.png",
        inputType: "text",
        placeholder: "如：120/80",
        unit: "mmHg",
        showNote: true,
      },
      {
        value: "blood_sugar",
        label: "血糖",
        icon: "/images/record.png",
        inputType: "digit",
        placeholder: "如：5.6",
        unit: "mmol/L",
        showNote: true,
      },
      {
        value: "temperature",
        label: "体温",
        icon: "/images/record.png",
        inputType: "digit",
        placeholder: "如：36.5",
        unit: "°C",
        showNote: false,
      },
      {
        value: "weight",
        label: "体重",
        icon: "/images/record.png",
        inputType: "digit",
        placeholder: "如：65.5",
        unit: "kg",
        showNote: false,
      },
    ],
    currentTypeInfo: {
      label: "血压",
      inputType: "text",
      placeholder: "如：120/80",
      unit: "mmHg",
      showNote: true,
    },
    recentRecords: [],
  },

  onLoad() {
    const now = new Date()
    this.setData({
      recordDate: now.toISOString().split("T")[0],
      recordTime: now.toTimeString().split(" ")[0].substring(0, 5),
    })

    this.loadRecentRecords()
  },

  async loadRecentRecords() {
    try {
      const records = await apiService.getHealthData()
      const formattedRecords = records.slice(0, 5).map((record) => {
        const typeInfo = this.data.dataTypes.find((t) => t.value === record.type)
        return {
          id: record.id || "",
          typeLabel: typeInfo?.label || "",
          value: record.value,
          unit: typeInfo?.unit || "",
          date: record.date,
          time: record.time,
        }
      })

      this.setData({
        recentRecords: formattedRecords,
      })
    } catch (error) {
      console.error("加载最近记录失败", error)
    }
  },

  selectDataType(e: any) {
    const type = e.currentTarget.dataset.type
    const typeInfo = this.data.dataTypes.find((t) => t.value === type)

    this.setData({
      selectedType: type,
      currentTypeInfo: typeInfo || this.data.currentTypeInfo,
      inputValue: "",
      note: "",
    })
  },

  onInputChange(e: any) {
    this.setData({
      inputValue: e.detail.value,
    })
  },

  onDateChange(e: any) {
    this.setData({
      recordDate: e.detail.value,
    })
  },

  onTimeChange(e: any) {
    this.setData({
      recordTime: e.detail.value,
    })
  },

  onNoteChange(e: any) {
    this.setData({
      note: e.detail.value,
    })
  },

  async submitData() {
    if (!this.data.inputValue.trim()) {
      wx.showToast({
        title: "请输入数据值",
        icon: "none",
      })
      return
    }

    try {
      wx.showLoading({ title: "提交中..." })

      const success = await apiService.submitHealthData({
        type: this.data.selectedType as any,
        value: this.data.inputValue,
        date: this.data.recordDate,
        time: this.data.recordTime,
      })

      wx.hideLoading()

      if (success) {
        wx.showToast({
          title: "记录成功",
          icon: "success",
        })

        // 清空表单
        this.setData({
          inputValue: "",
          note: "",
        })

        // 重新加载最近记录
        this.loadRecentRecords()
      } else {
        wx.showToast({
          title: "记录失败，请重试",
          icon: "none",
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: "记录失败，请重试",
        icon: "none",
      })
      console.error("提交数据失败", error)
    }
  },
})
