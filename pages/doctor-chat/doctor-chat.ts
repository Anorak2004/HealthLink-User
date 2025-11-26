import { Page, wx } from "../../utils/miniprogram-api"
import { apiService } from "../../utils/api"
import type { DoctorMessage } from "../../utils/service-interfaces"

interface DoctorChatPageData {
  doctorId: string
  doctorName: string
  messages: DoctorMessage[]
  inputValue: string
  scrollTop: number
}

Page<DoctorChatPageData, any>({
  data: {
    doctorId: "",
    doctorName: "",
    messages: [],
    inputValue: "",
    scrollTop: 0,
  },

  async onLoad(options: any) {
    const { doctorId = "", doctorName = "" } = options || {}
    this.setData({
      doctorId,
      doctorName: doctorName ? decodeURIComponent(doctorName) : "",
    })
    await this.loadMessages()
  },

  async loadMessages() {
    try {
      const messages = await apiService.getDoctorMessages()
      this.setData({
        messages,
        scrollTop: messages.length * 100,
      })
    } catch (error) {
      console.error("加载医生消息失败", error)
      wx.showToast({
        title: "消息加载失败",
        icon: "none",
      })
    }
  },

  onInputChange(e: any) {
    this.setData({
      inputValue: e.detail.value,
    })
  },

  async onSend() {
    const content = this.data.inputValue.trim()
    if (!content) {
      return
    }

    try {
      const ok = await apiService.sendMessageToDoctor(content)
      if (ok) {
        this.setData({ inputValue: "" })
        await this.loadMessages()
      } else {
        wx.showToast({
          title: "发送失败，请重试",
          icon: "none",
        })
      }
    } catch (error) {
      console.error("发送消息失败", error)
      wx.showToast({
        title: "发送失败，请检查网络",
        icon: "none",
      })
    }
  },
})

