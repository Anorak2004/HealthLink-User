# 健康监护系统核心数据模型文档

## 概述

本文档描述了健康监护系统增强功能的核心数据模型和接口定义，包括紧急响应、科普内容和在线问诊三个主要模块。

## 文件结构

```
types/
├── health-monitoring.ts          # 核心数据类型定义
utils/
├── health-monitoring-validators.ts    # 数据验证函数
├── health-monitoring-type-guards.ts   # 类型守卫和工具函数
└── __tests__/
    ├── health-monitoring-validators.test.ts     # 验证函数测试
    └── health-monitoring-type-guards.test.ts    # 类型守卫测试
```

## 核心数据模型

### 1. 紧急响应模块

#### VitalsSnapshot (生命体征快照)
```typescript
interface VitalsSnapshot {
  heartRate?: number              // 心率 (bpm)
  bloodPressure?: {               // 血压
    systolic: number              // 收缩压 (mmHg)
    diastolic: number             // 舒张压 (mmHg)
  }
  temperature?: number            // 体温 (°C)
  oxygenSaturation?: number       // 血氧饱和度 (%)
  timestamp: Date                 // 测量时间戳
}
```

#### EmergencyResponse (紧急响应)
```typescript
interface EmergencyResponse {
  id: string                      // 响应ID
  userId: string                  // 用户ID
  triggerTime: Date               // 触发时间
  vitalsData: VitalsSnapshot      // 生命体征数据
  severity: 'critical' | 'urgent' | 'warning'  // 严重程度
  responseActions: EmergencyAction[]            // 响应动作列表
  status: 'triggered' | 'acknowledged' | 'resolved'  // 状态
}
```

#### EmergencyAction (紧急动作)
```typescript
interface EmergencyAction {
  type: 'call_120' | 'call_doctor' | 'alert_family'  // 动作类型
  priority: number                // 优先级
  executed: boolean               // 是否已执行
  executedAt?: Date              // 执行时间
}
```

### 2. 科普内容模块

#### HealthArticle (健康文章)
```typescript
interface HealthArticle {
  id: string                      // 文章ID
  title: string                   // 标题
  content: string                 // 内容
  summary: string                 // 摘要
  category: HealthCategory        // 分类
  tags: string[]                  // 标签
  images: ArticleImage[]          // 图片
  author: string                  // 作者
  publishDate: Date               // 发布日期
  readCount: number               // 阅读次数
  difficulty: 'basic' | 'intermediate' | 'advanced'  // 难度
}
```

#### HealthCategory (健康分类)
```typescript
interface HealthCategory {
  id: string                      // 分类ID
  name: string                    // 分类名称
  icon: string                    // 图标
  parentId?: string               // 父分类ID
  description: string             // 描述
}
```

### 3. 在线问诊模块

#### Doctor (医生信息)
```typescript
interface Doctor {
  id: string                      // 医生ID
  name: string                    // 姓名
  avatar: string                  // 头像
  title: string                   // 职称
  department: string              // 科室
  specialties: string[]           // 专长
  experience: number              // 从业年限
  rating: number                  // 评分 (0-5)
  reviewCount: number             // 评价数量
  isOnline: boolean               // 是否在线
  consultationFee: number         // 问诊费用
  introduction: string            // 简介
}
```

#### Consultation (问诊记录)
```typescript
interface Consultation {
  id: string                      // 问诊ID
  doctorId: string                // 医生ID
  userId: string                  // 用户ID
  status: 'pending' | 'active' | 'completed' | 'cancelled'  // 状态
  startTime: Date                 // 开始时间
  endTime?: Date                  // 结束时间
  messages: ConsultationMessage[] // 消息列表
  summary?: string                // 问诊总结
}
```

#### ConsultationMessage (问诊消息)
```typescript
interface ConsultationMessage {
  id: string                      // 消息ID
  consultationId: string          // 问诊ID
  senderId: string                // 发送者ID
  senderType: 'doctor' | 'patient'  // 发送者类型
  content: string                 // 内容
  messageType: 'text' | 'image' | 'voice' | 'file'  // 消息类型
  timestamp: Date                 // 时间戳
  isRead: boolean                 // 是否已读
}
```

## 服务接口

### 1. 紧急监测服务
```typescript
interface IEmergencyMonitoringService {
  startMonitoring(userId: string): Promise<void>
  stopMonitoring(userId: string): Promise<void>
  checkVitals(data: VitalsSnapshot): Promise<EmergencyResponse | null>
  triggerEmergencyResponse(response: EmergencyResponse): Promise<void>
  acknowledgeEmergency(responseId: string): Promise<void>
}
```

### 2. 健康科普服务
```typescript
interface IHealthEducationService {
  searchArticles(query: string, filters?: SearchFilters): Promise<HealthArticle[]>
  getArticlesByCategory(categoryId: string): Promise<HealthArticle[]>
  getArticleById(id: string): Promise<HealthArticle>
  getPopularArticles(limit?: number): Promise<HealthArticle[]>
  recordReadHistory(userId: string, articleId: string): Promise<void>
  getRecommendations(userId: string): Promise<HealthArticle[]>
}
```

### 3. 问诊服务
```typescript
interface IConsultationService {
  getDoctorList(filters?: DoctorFilters): Promise<Doctor[]>
  getDoctorById(id: string): Promise<Doctor>
  startConsultation(doctorId: string, userId: string): Promise<Consultation>
  sendMessage(consultationId: string, message: Omit<ConsultationMessage, 'id' | 'timestamp'>): Promise<void>
  getConsultationHistory(userId: string): Promise<Consultation[]>
  endConsultation(consultationId: string, summary?: string): Promise<void>
}
```

## 数据验证

### 验证函数

- `validateVitalsSnapshot()` - 验证生命体征数据
- `validateEmergencyResponse()` - 验证紧急响应数据
- `validateHealthArticle()` - 验证健康文章数据
- `validateDoctor()` - 验证医生信息数据
- `validateConsultationMessage()` - 验证问诊消息数据
- `validateConsultation()` - 验证问诊记录数据

### 类型守卫

- `isVitalsSnapshot()` - 生命体征类型守卫
- `isEmergencyResponse()` - 紧急响应类型守卫
- `isHealthArticle()` - 健康文章类型守卫
- `isDoctor()` - 医生信息类型守卫
- `isConsultationMessage()` - 问诊消息类型守卫
- `isConsultation()` - 问诊记录类型守卫

## 工具函数

### 紧急响应工具
- `createEmergencyResponse()` - 创建紧急响应
- `isEmergencyVitals()` - 检测是否为紧急情况
- `getSeverityLevel()` - 获取严重程度级别
- `formatVitalsForDisplay()` - 格式化生命体征显示

### 问诊工具
- `createConsultationMessage()` - 创建问诊消息
- `calculateDoctorScore()` - 计算医生综合评分

### 通用工具
- `generateId()` - 生成唯一ID
- `sanitizeString()` - 字符串清理
- `validateId()` - ID验证
- `validateEmail()` - 邮箱验证
- `validatePhoneNumber()` - 手机号验证

## 数据验证规则

### 生命体征验证规则
- 心率: 30-200 bpm
- 收缩压: 70-250 mmHg
- 舒张压: 40-150 mmHg
- 体温: 30-45°C
- 血氧饱和度: 70-100%

### 紧急情况阈值
- **Critical**: 心率 < 40 或 > 140, 血压 > 200/120 或 < 80/50, 体温 < 35 或 > 40, 血氧 < 85%
- **Urgent**: 心率 < 50 或 > 120, 血压 > 180/110 或 < 90/60, 体温 < 36 或 > 39, 血氧 < 90%
- **Warning**: 其他异常情况

## 使用示例

### 创建紧急响应
```typescript
const vitals: VitalsSnapshot = {
  heartRate: 45,
  timestamp: new Date()
}

const response = createEmergencyResponse('user-001', vitals, 'critical')
```

### 验证数据
```typescript
if (validateVitalsSnapshot(vitals)) {
  const severity = getSeverityLevel(vitals)
  if (severity) {
    // 触发紧急响应
  }
}
```

### 创建问诊消息
```typescript
const message = createConsultationMessage(
  'consultation-001',
  'doctor-001',
  'doctor',
  '您好，请描述症状'
)
```

## 测试覆盖

所有数据模型和验证函数都包含完整的单元测试，覆盖以下场景：
- 有效数据验证
- 无效数据拒绝
- 边界值测试
- 类型安全检查
- 工具函数功能验证

## 注意事项

1. 所有时间戳使用 `Date` 对象
2. 可选字段使用 `?` 标记
3. 枚举值使用联合类型定义
4. 所有验证函数返回布尔值
5. 工具函数提供类型安全的数据操作
6. 遵循 TypeScript 严格模式要求