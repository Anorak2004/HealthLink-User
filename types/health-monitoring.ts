// 健康监护系统核心数据模型和接口定义

// ============================================================================
// 紧急响应相关类型定义
// ============================================================================

export interface VitalsSnapshot {
  heartRate?: number
  bloodPressure?: { 
    systolic: number
    diastolic: number 
  }
  temperature?: number
  oxygenSaturation?: number
  timestamp: Date
}

export interface EmergencyAction {
  type: 'call_120' | 'call_doctor' | 'alert_family'
  priority: number
  executed: boolean
  executedAt?: Date
}

export interface EmergencyResponse {
  id: string
  userId: string
  triggerTime: Date
  vitalsData: VitalsSnapshot
  severity: 'critical' | 'urgent' | 'warning'
  responseActions: EmergencyAction[]
  status: 'triggered' | 'acknowledged' | 'resolved'
}

// 紧急监测服务接口
export interface IEmergencyMonitoringService {
  startMonitoring(userId: string): Promise<void>
  stopMonitoring(userId: string): Promise<void>
  checkVitals(data: VitalsSnapshot): Promise<EmergencyResponse | null>
  triggerEmergencyResponse(response: EmergencyResponse): Promise<void>
  acknowledgeEmergency(responseId: string): Promise<void>
}

// ============================================================================
// 科普内容相关类型定义
// ============================================================================

export interface ArticleImage {
  url: string
  caption: string
  alt: string
}

export interface HealthCategory {
  id: string
  name: string
  icon: string
  parentId?: string
  description: string
}

export interface HealthArticle {
  id: string
  title: string
  content: string
  summary: string
  category: HealthCategory
  tags: string[]
  images: ArticleImage[]
  author: string
  publishDate: Date
  readCount: number
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export interface SearchFilters {
  category?: string
  difficulty?: string
  dateRange?: { 
    start: Date
    end: Date 
  }
}

// 健康科普服务接口
export interface IHealthEducationService {
  searchArticles(query: string, filters?: SearchFilters): Promise<HealthArticle[]>
  getArticlesByCategory(categoryId: string): Promise<HealthArticle[]>
  getArticleById(id: string): Promise<HealthArticle>
  getPopularArticles(limit?: number): Promise<HealthArticle[]>
  recordReadHistory(userId: string, articleId: string): Promise<void>
  getRecommendations(userId: string): Promise<HealthArticle[]>
}

// ============================================================================
// 在线问诊相关类型定义
// ============================================================================

export interface Doctor {
  id: string
  name: string
  avatar: string
  title: string
  department: string
  specialties: string[]
  experience: number
  rating: number
  reviewCount: number
  isOnline: boolean
  consultationFee: number
  introduction: string
}

export interface ConsultationMessage {
  id: string
  consultationId: string
  senderId: string
  senderType: 'doctor' | 'patient'
  content: string
  messageType: 'text' | 'image' | 'voice' | 'file'
  timestamp: Date
  isRead: boolean
}

export interface Consultation {
  id: string
  doctorId: string
  userId: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  startTime: Date
  endTime?: Date
  messages: ConsultationMessage[]
  summary?: string
}

export interface DoctorFilters {
  department?: string
  specialty?: string
  isOnline?: boolean
  minRating?: number
}

// 问诊服务接口
export interface IConsultationService {
  getDoctorList(filters?: DoctorFilters): Promise<Doctor[]>
  getDoctorById(id: string): Promise<Doctor>
  startConsultation(doctorId: string, userId: string): Promise<Consultation>
  sendMessage(consultationId: string, message: Omit<ConsultationMessage, 'id' | 'timestamp'>): Promise<void>
  getConsultationHistory(userId: string): Promise<Consultation[]>
  endConsultation(consultationId: string, summary?: string): Promise<void>
}

// ============================================================================
// 通用类型定义
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}