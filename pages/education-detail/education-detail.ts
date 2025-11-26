import { Page, wx, getApp } from "../../utils/miniprogram-api"
import { healthEducationService } from "../../utils/health-education-service"
import type { HealthArticle } from "../../types/health-monitoring"

interface EducationDetailPageData {
  article: HealthArticle | null
  contentLines: string[]
  difficultyText: string
}

Page<EducationDetailPageData, any>({
  data: {
    article: null,
    contentLines: [],
    difficultyText: "",
  },

  async onLoad(options: any) {
    const id = options?.id as string
    if (!id) {
      wx.showToast({
        title: "文章不存在",
        icon: "none",
      })
      return
    }

    try {
      const article = await healthEducationService.getArticleById(id)
      const difficultyText =
        article.difficulty === "basic"
          ? "基础"
          : article.difficulty === "intermediate"
            ? "进阶"
            : "专业"

      const contentLines = article.content.split(/\n{2,}/)

      this.setData({
        article,
        difficultyText,
        contentLines,
      })

      // 记录阅读历史（使用简单的 userId，占位）
      const app = getApp()
      const userId = (app.globalData && (app.globalData as any).userId) || "anonymous"
      await healthEducationService.recordReadHistory(userId, article.id)
    } catch (error) {
      console.error("加载科普详情失败", error)
      wx.showToast({
        title: "加载失败，请稍后重试",
        icon: "none",
      })
    }
  },
})

