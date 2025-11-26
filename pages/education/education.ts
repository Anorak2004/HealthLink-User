import { Page, wx } from "../../utils/miniprogram-api"
import { healthEducationService, HEALTH_EDU_CATEGORIES } from "../../utils/health-education-service"
import type { HealthArticle, HealthCategory } from "../../types/health-monitoring"

interface EducationPageData {
  searchQuery: string
  activeCategoryId: string
  categories: HealthCategory[]
  articles: HealthArticle[]
}

Page<EducationPageData, any>({
  data: {
    searchQuery: "",
    activeCategoryId: "",
    categories: HEALTH_EDU_CATEGORIES,
    articles: [],
  },

  async onLoad() {
    await this.loadPopularArticles()
  },

  async onPullDownRefresh() {
    await this.loadPopularArticles()
    wx.stopPullDownRefresh()
  },

  async loadPopularArticles() {
    try {
      const articles = await healthEducationService.getPopularArticles(20)
      this.setData({ articles })
    } catch (error) {
      console.error("加载科普文章失败", error)
      wx.showToast({
        title: "加载失败，请稍后重试",
        icon: "none",
      })
    }
  },

  onSearchChange(e: any) {
    this.setData({
      searchQuery: e.detail.value,
    })
  },

  async onSearchConfirm() {
    await this.performSearch()
  },

  async onCategoryTap(e: any) {
    const categoryId = e.currentTarget.dataset.id || ""
    this.setData({
      activeCategoryId: categoryId,
    })
    await this.performSearch()
  },

  async performSearch() {
    try {
      const { searchQuery, activeCategoryId } = this.data
      const filters: { category?: string } = {}
      if (activeCategoryId) {
        filters.category = activeCategoryId
      }

      const articles = await healthEducationService.searchArticles(searchQuery, filters)
      this.setData({ articles })
    } catch (error) {
      console.error("搜索科普文章失败", error)
      wx.showToast({
        title: "搜索失败，请稍后重试",
        icon: "none",
      })
    }
  },

  async goToArticle(e: any) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return

    wx.navigateTo({
      url: `/pages/education-detail/education-detail?id=${id}`,
    })
  },
})

