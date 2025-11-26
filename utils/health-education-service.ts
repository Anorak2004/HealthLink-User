// 健康科普服务实现（小程序端本地模拟版）
// 使用 types/health-monitoring.ts 中定义的科普相关类型

import type {
  HealthArticle,
  HealthCategory,
  IHealthEducationService,
  SearchFilters,
} from "../types/health-monitoring"

const categories: HealthCategory[] = [
  {
    id: "cardio",
    name: "心血管健康",
    icon: "/images/assessment.png",
    description: "高血压、冠心病等心血管相关科普",
  },
  {
    id: "chronic",
    name: "慢病管理",
    icon: "/images/record.png",
    description: "糖尿病、血脂异常等长期随访管理",
  },
  {
    id: "emergency",
    name: "紧急自救",
    icon: "/images/doctor.png",
    description: "胸痛、中风等突发情况识别与处理",
  },
]

// 方便小程序页面直接使用的分类常量
export const HEALTH_EDU_CATEGORIES = categories

const mockArticles: HealthArticle[] = [
  {
    id: "bp-home-measurement",
    title: "家庭血压监测全指南",
    summary: "教你在家里正确测量和记录血压，帮助医生判断病情。",
    content:
      "1. 建议在安静环境下坐位休息 5 分钟后再测量血压。\n\n" +
      "2. 测量前 30 分钟内避免剧烈运动、喝浓茶或咖啡、吸烟等。\n\n" +
      "3. 袖带下缘应与心脏大致同一水平，袖带松紧以能放入一指为宜。\n\n" +
      "4. 每次至少测量 2-3 次，间隔 1 分钟，取平均值记录。\n\n" +
      "5. 建议记录在健康记录中，便于长期趋势分析。",
    category: categories[0],
    tags: ["高血压", "家庭监测", "血压计"],
    images: [
      {
        url: "/images/assessment.png",
        caption: "家庭血压监测示意图",
        alt: "血压评估图标",
      },
    ],
    author: "健康科普团队",
    publishDate: new Date("2024-01-10T08:00:00"),
    readCount: 320,
    difficulty: "basic",
  },
  {
    id: "diabetes-diet",
    title: "糖尿病饮食控制的 5 个关键点",
    summary: "从主食、油脂、饮料等方面，帮你搭建合理饮食结构。",
    content:
      "1. 控制总热量，关注主食的量和种类，优先选择粗粮和杂粮。\n\n" +
      "2. 减少含糖饮料和甜点，多喝白开水或无糖茶。\n\n" +
      "3. 烹饪方式以蒸、煮、炖为主，减少油炸和煎炒。\n\n" +
      "4. 每天搭配足量蔬菜和适量蛋白质（鱼、瘦肉、豆类）。\n\n" +
      "5. 就诊时携带最近一周的血糖记录，方便医生调整方案。",
    category: categories[1],
    tags: ["糖尿病", "饮食", "慢病管理"],
    images: [
      {
        url: "/images/record.png",
        caption: "饮食记录与血糖管理",
        alt: "记录图标",
      },
    ],
    author: "健康科普团队",
    publishDate: new Date("2024-02-05T09:30:00"),
    readCount: 260,
    difficulty: "basic",
  },
  {
    id: "chest-pain-warning",
    title: "出现胸痛时，哪些情况需要立刻拨打 120？",
    summary: "识别高危胸痛信号，避免延误心肌梗死等紧急情况。",
    content:
      "1. 胸痛持续超过 10 分钟，呈压榨感或窒息感，伴有大汗、恶心、呕吐。\n\n" +
      "2. 胸痛向左肩、左臂、下颌或背部放射，休息后也难以缓解。\n\n" +
      "3. 既往有冠心病、高血压、糖尿病、吸烟等危险因素的中老年人。\n\n" +
      "4. 如伴有明显气促、面色苍白、意识模糊等症状，应立即拨打 120。\n\n" +
      "5. 等待急救时保持安静平卧，不要自行驾车就医。",
    category: categories[2],
    tags: ["胸痛", "急救", "120"],
    images: [
      {
        url: "/images/doctor.png",
        caption: "紧急就诊提示",
        alt: "医生图标",
      },
    ],
    author: "急诊医学中心",
    publishDate: new Date("2024-03-20T14:15:00"),
    readCount: 410,
    difficulty: "basic",
  },
]

class HealthEducationService implements IHealthEducationService {
  async searchArticles(query: string, filters?: SearchFilters): Promise<HealthArticle[]> {
    const q = query.trim().toLowerCase()

    let list = mockArticles.filter((article) => {
      if (!q) return true
      return (
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })

    if (filters?.category) {
      list = list.filter((a) => a.category.id === filters.category)
    }

    if (filters?.difficulty) {
      list = list.filter((a) => a.difficulty === filters.difficulty)
    }

    if (filters?.dateRange) {
      const { start, end } = filters.dateRange
      list = list.filter((a) => a.publishDate >= start && a.publishDate <= end)
    }

    return list
  }

  async getArticlesByCategory(categoryId: string): Promise<HealthArticle[]> {
    return mockArticles.filter((a) => a.category.id === categoryId)
  }

  async getArticleById(id: string): Promise<HealthArticle> {
    const article = mockArticles.find((a) => a.id === id)
    if (!article) {
      throw new Error(`Article not found: ${id}`)
    }
    return article
  }

  async getPopularArticles(limit: number = 10): Promise<HealthArticle[]> {
    return mockArticles
      .slice()
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, limit)
  }

  async recordReadHistory(userId: string, articleId: string): Promise<void> {
    // 模拟环境下仅在控制台记录，实际可上报到后端
    console.log(`User ${userId} read article ${articleId}`)
  }

  async getRecommendations(userId: string): Promise<HealthArticle[]> {
    // 简单实现：返回热门文章作为推荐
    return this.getPopularArticles(3)
  }
}

export const healthEducationService: IHealthEducationService = new HealthEducationService()
