import { Page, wx } from "../../utils/miniprogram-api"
import type { Doctor } from "../../types/health-monitoring"

interface DoctorConsultPageData {
  isSimulationMode: boolean
  doctors: Array<Doctor & { online: boolean }>
  consultHistory: Array<{
    id: number | string
    doctorName: string
    date: string
    summary: string
  }>
}

Page<DoctorConsultPageData, any>({
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
      content: `确定要咨询${doctor.name}医生（${doctor.title}，${doctor.department}）吗？`,
      success: (res) => {
        if (res.confirm) {
          this.startConsultation(doctor)
        }
      },
    })
  },

  startConsultation(doctor: Doctor & { online: boolean }) {
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

      // 连接成功后跳转到问诊聊天页面
      wx.navigateTo({
        url: `/pages/doctor-chat/doctor-chat?doctorId=${doctor.id}&doctorName=${encodeURIComponent(
          doctor.name
        )}`,
      })
    }, 2000)
  },

  loadDoctors() {
    if (this.data.isSimulationMode) {
      const mockDoctors: Array<Doctor & { online: boolean }> = [
        {
          id: "1",
          name: "张伟",
          title: "主任医师",
          department: "心内科",
          hospital: "北京协和医院",
          specialties: ["高血压", "冠心病", "心力衰竭"],
          experience: 20,
          rating: 4.9,
          reviewCount: 236,
          consultationFee: 199,
          introduction: "擅长老年高血压、冠心病等心血管疾病的长期随访与综合管理。",
          avatar: "/placeholder-vye6j.png",
          isOnline: true,
          online: true,
        },
        {
          id: "2",
          name: "李静",
          title: "副主任医师",
          department: "内分泌科",
          hospital: "上海华山医院",
          specialties: ["2 型糖尿病", "甲状腺疾病"],
          experience: 15,
          rating: 4.8,
          reviewCount: 180,
          consultationFee: 149,
          introduction: "长期从事糖尿病和甲状腺疾病诊治，注重个体化血糖管理和生活方式干预。",
          avatar: "/female-doctor.png",
          isOnline: false,
          online: false,
        },
        {
          id: "3",
          name: "王磊",
          title: "主治医师",
          department: "全科医学",
          hospital: "广州中山医院",
          specialties: ["常见慢性病管理", "健康体检解读"],
          experience: 10,
          rating: 4.7,
          reviewCount: 95,
          consultationFee: 99,
          introduction: "社区全科医生，擅长常见慢性病的综合管理及健康咨询。",
          avatar: "/young-doctor.png",
          isOnline: true,
          online: true,
        },
      ]
      this.setData({ doctors: mockDoctors })
    } else {
      wx.request({
        url: "https://api.healthlink.com/doctors",
        method: "GET",
        success: (res: any) => {
          const list = (res.data || []) as Array<Partial<Doctor>>
          const doctors: Array<Doctor & { online: boolean }> = list.map((d, index) => ({
            id: d.id || String(index + 1),
            name: d.name || "医生",
            avatar: d.avatar || "/placeholder-vye6j.png",
            title: d.title || "主治医师",
            department: d.department || "全科",
            specialties: d.specialties || [],
            experience: d.experience || 5,
            rating: d.rating || 4.5,
            reviewCount: d.reviewCount || 0,
            isOnline: d.isOnline ?? true,
            consultationFee: d.consultationFee || 99,
            introduction: d.introduction || "在线问诊医生。",
            online: d.isOnline ?? true,
          }))
          this.setData({ doctors })
        },
        fail: () => {
          wx.showToast({
            title: "加载医生列表失败",
            icon: "none",
          })
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
