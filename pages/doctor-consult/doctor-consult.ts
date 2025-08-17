import { Page, wx } from "../../utils/miniprogram-api"

Page({
  data: {
    isSimulationMode: true,
    doctors: [],
    consultHistory: [],
  },

  onLoad() {
    this.loadDoctors()
    this.loadConsultHistory()
  },

  onModeChange(e: any) {
    this.setData({
      isSimulationMode: e.detail.value,
    })
    wx.showToast({
      title: e.detail.value ? "已切换到模拟模式" : "已切换到API模式",
      icon: "success",
    })
    this.loadDoctors()
  },

  selectDoctor(e: any) {
    const doctor = e.currentTarget.dataset.doctor
    if (!doctor.online) {
      wx.showToast({
        title: "医生当前不在线",
        icon: "none",
      })
      return
    }

    wx.showModal({
      title: "咨询确认",
      content: `确定要咨询${doctor.name}医生吗？`,
      success: (res) => {
        if (res.confirm) {
          this.startConsultation(doctor)
        }
      },
    })
  },

  startConsultation(doctor: any) {
    wx.showToast({
      title: `正在连接${doctor.name}医生`,
      icon: "loading",
      duration: 2000,
    })

    setTimeout(() => {
      wx.showToast({
        title: "连接成功，开始咨询",
        icon: "success",
      })
    }, 2000)
  },

  loadDoctors() {
    if (this.data.isSimulationMode) {
      const mockDoctors = [
        {
          id: 1,
          name: "张医生",
          title: "主任医师",
          hospital: "北京协和医院",
          avatar: "/placeholder-vye6j.png",
          online: true,
        },
        {
          id: 2,
          name: "李医生",
          title: "副主任医师",
          hospital: "上海华山医院",
          avatar: "/female-doctor.png",
          online: false,
        },
        {
          id: 3,
          name: "王医生",
          title: "主治医师",
          hospital: "广州中山医院",
          avatar: "/young-doctor.png",
          online: true,
        },
      ]
      this.setData({ doctors: mockDoctors })
    } else {
      wx.request({
        url: "https://api.healthlink.com/doctors",
        method: "GET",
        success: (res) => {
          this.setData({ doctors: res.data })
        },
      })
    }
  },

  loadConsultHistory() {
    if (this.data.isSimulationMode) {
      const mockHistory = [
        {
          id: 1,
          doctorName: "张医生",
          date: "2024-01-15",
          summary: "血压偏高，建议调整饮食和增加运动",
        },
        {
          id: 2,
          doctorName: "李医生",
          date: "2024-01-10",
          summary: "血糖控制良好，继续保持现有治疗方案",
        },
      ]
      this.setData({ consultHistory: mockHistory })
    } else {
      wx.request({
        url: "https://api.healthlink.com/consultations",
        method: "GET",
        success: (res) => {
          this.setData({ consultHistory: res.data })
        },
      })
    }
  },
})
