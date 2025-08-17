# 服务抽象层重构说明

## 概述

本次重构将原有的API服务升级为支持双模式（模拟/API）的服务抽象层，提供了更好的错误处理、自动降级和服务监控功能。

## 主要改进

### 1. 统一的服务接口
- 实现了 `IDataService` 接口，提供统一的数据访问方法
- 支持所有健康数据相关操作：获取、提交、评估、咨询等
- 类型安全的接口定义

### 2. 智能模式切换
- 支持 `mock` 和 `api` 两种模式
- 通过 `ModeManager` 统一管理模式切换
- 模式变更时自动通知相关组件

### 3. 自动降级机制
- API调用失败时自动使用模拟数据
- 智能错误计数和状态管理
- 服务恢复时自动切回正常模式

### 4. 服务状态监控
- 实时监控服务在线状态
- 错误计数和降级状态跟踪
- 最后调用时间记录

### 5. 增强的错误处理
- 详细的错误分类和上下文信息
- 用户友好的错误消息
- 自动重试机制（可配置）

## 使用方式

### 基本使用
```typescript
import { apiService } from './utils/api'

// 获取健康数据
const healthData = await apiService.getHealthData()

// 提交健康数据
const success = await apiService.submitHealthData({
  type: 'blood_pressure',
  value: '120/80',
  date: '2024-01-16',
  time: '09:00'
})

// 获取服务状态
const status = apiService.getServiceStatus()
console.log('当前模式:', status.mode)
console.log('在线状态:', status.isOnline)
```

### 模式管理
```typescript
// 获取当前模式
const currentMode = apiService.getCurrentMode()

// 切换模式
apiService.switchMode('mock') // 切换到模拟模式
apiService.switchMode('api')  // 切换到API模式

// 检查服务是否在线
const isOnline = await apiService.isOnline()
```

### 服务监控
```typescript
// 获取详细的服务状态
const status = apiService.getServiceStatus()
console.log({
  mode: status.mode,           // 当前模式
  isOnline: status.isOnline,   // 在线状态
  errorCount: status.errorCount, // 错误计数
  fallbackActive: status.fallbackActive, // 降级状态
  lastApiCall: status.lastApiCall // 最后调用时间
})
```

## 文件结构

```
utils/
├── api.ts                          # 重构后的主API服务
├── service-interfaces.ts           # 服务接口定义
├── mode-manager.ts                 # 模式管理器
├── service-usage-example.ts        # 使用示例
└── __tests__/
    └── api-service-refactored.test.ts # 测试文件
```

## 接口定义

### IDataService
```typescript
interface IDataService {
  // 健康数据
  getHealthData(): Promise<HealthData[]>
  submitHealthData(data: HealthDataInput): Promise<boolean>
  
  // 健康评估
  getHealthAssessment(): Promise<HealthAssessment>
  performHealthAssessment(): Promise<HealthAssessment>
  
  // 医生咨询
  getDoctorMessages(): Promise<DoctorMessage[]>
  sendMessageToDoctor(content: string): Promise<boolean>
  
  // 健康指标
  getHealthIndicators(): Promise<HealthIndicator[]>
  
  // 用户统计
  getUserStats(): Promise<UserStats>
  
  // 服务状态
  getServiceStatus(): ServiceStatus
  isOnline(): Promise<boolean>
}
```

### ServiceStatus
```typescript
interface ServiceStatus {
  mode: 'mock' | 'api'        // 当前模式
  isOnline: boolean           // 在线状态
  lastApiCall: number         // 最后调用时间戳
  errorCount: number          // 错误计数
  fallbackActive: boolean     // 降级状态
}
```

## 向后兼容性

重构后的服务完全向后兼容，现有的页面代码无需修改即可使用新功能：

```typescript
// 原有代码继续工作
const data = await apiService.getHealthData()
const success = await apiService.submitHealthData(healthData)

// 新增功能
const mode = apiService.getCurrentMode()
const status = apiService.getServiceStatus()
```

## 测试

运行测试验证功能：
```bash
npm test utils/__tests__/api-service-refactored.test.ts
```

## 最佳实践

1. **模式切换**: 在开发环境使用mock模式，生产环境使用api模式
2. **错误处理**: 监听服务状态变化，及时处理降级情况
3. **用户体验**: 在降级模式下向用户说明当前使用离线数据
4. **性能监控**: 定期检查服务状态和错误计数

## 故障排除

### 常见问题

1. **模式切换不生效**
   - 检查 ModeManager 是否正确初始化
   - 确认模式变更监听器已注册

2. **API调用失败**
   - 检查网络连接
   - 验证API端点配置
   - 查看错误日志和状态信息

3. **降级模式异常**
   - 确认模拟数据完整性
   - 检查本地存储权限

### 调试信息

```typescript
// 获取调试信息
const debugInfo = {
  currentMode: apiService.getCurrentMode(),
  serviceStatus: apiService.getServiceStatus(),
  isOnline: await apiService.isOnline()
}
console.log('服务调试信息:', debugInfo)
```

## 总结

重构后的服务抽象层提供了：
- ✅ 统一的服务接口
- ✅ 智能模式切换
- ✅ 自动降级机制
- ✅ 服务状态监控
- ✅ 增强的错误处理
- ✅ 完全向后兼容
- ✅ 类型安全保证

这为双模式系统提供了坚实的基础，确保应用在各种网络环境下都能稳定运行。