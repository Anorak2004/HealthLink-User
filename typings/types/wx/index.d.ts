declare var wx: any // Declare the wx variable to fix the undeclared variable error

interface IAppOption {
  globalData: {
    userInfo?: wx.UserInfo
    isSimulationMode: boolean
    apiBaseUrl: string
  }
  checkLoginStatus(): void
}

// 扩展Page类型
declare namespace WechatMiniprogram {
  interface Page {
    route: string
  }
}

// 健康数据类型
interface HealthRecord {
  id: string
  type: "blood_pressure" | "blood_sugar" | "temperature" | "weight" | "heart_rate"
  value: string
  unit: string
  timestamp: number
  note?: string
}

// 医生信息类型
interface Doctor {
  id: string
  name: string
  title: string
  department: string
  avatar: string
  rating: number
  experience: string
  isOnline: boolean
}

// 咨询消息类型
interface ConsultationMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: "text" | "image" | "voice"
  timestamp: number
  isRead: boolean
}
