# 技术路线分解与后端模块规划（初稿）

本文件将《大创技术核心.docx》与简化技术清单对应到可实现的后端模块，并说明如何与现有微信小程序前端对接。后续可以根据《简化技术.xlsx》《技术闭环构建.xlsx》补充每个模块的细节与优先级。

## M1. 患者档案与基础数据采集（Phase 0）

- 职责：管理居民基本信息、慢病诊断、随访记录、体征数据（血压/血糖/体温/体重）、急诊与住院记录。
- 前端入口：小程序「健康记录」「健康评估」相关页面。
- 典型接口：
  - `GET /api/health-data`：拉取最近健康记录（对接现有 `apiService.getHealthData()`）。
  - `POST /api/health-data`：提交一条新的健康记录（对接 `submitHealthData()`）。
  - `GET /api/health-assessment`：获取最近一次综合评估结果。

## M2. 风险分层与紧急监测（Phase 1）

- 职责：对 24h 生命体征监测数据进行阈值判断，记录紧急事件，返回严重程度（warning/urgent/critical）。
- 逻辑基础：复用 `utils/emergency-monitoring-service.ts` 中的阈值配置与判定规则，逐步后端化。
- 典型接口：
  - `POST /api/vitals/check`：入参为 `VitalsSnapshot`，返回 `severity` 与建议动作列表。
  - `GET /api/vitals/emergencies`：按用户查询 24h 内紧急事件统计，供前端展示。

## M3. NLP 引擎（简化版）与共病识别（Phase 2）

- 职责：从电子病历文本 / 语音转写中识别疾病与共病组合。
- 现阶段策略：使用规则与关键词匹配，实现「高血压+糖尿病+抑郁」等组合识别；接口和数据结构预留给后续临床 BERT/BioBERT 模型。
- 典型接口：
  - `POST /api/nlp/parse-emr`：入参为病历文本，输出结构化诊断标签。
  - `POST /api/nlp/parse-speech`：入参为语音转写文本，输出症状线索（如“脚麻”→周围神经病变）。

## M4. 共病关系图谱服务（Phase 2）

- 职责：根据结构化诊断数据构建共病关系（边表即可），估计疾病间风险倍数。
- 典型接口：
  - `GET /api/comorbidity/graph?disease=...`：返回常见共病及风险倍数，用于医生端决策支持。

## M5. 健康科普服务（Phase 1–2）

- 职责：管理科普文章、分类与阅读记录，支撑小程序「健康科普」模块。
- 当前实现：小程序端已有 `utils/health-education-service.ts` 的 mock 版本，后续将迁移到后端。
- 典型接口：
  - `GET /api/education/articles`：支持关键词与分类筛选。
  - `GET /api/education/articles/:id`：文章详情。
  - `POST /api/education/read`：记录用户阅读行为，作为后续推荐与经济学分析的补充数据。

## M6. 经济学评价与 ICER 引擎（Phase 3）

- 职责：实现基于 ICER（增量成本效果比）的干预效果评估逻辑，使用中国 ICER 阈值（如 37,446 元/DALY）作为核心参数。
- 数据：干预方案（如社区康复 vs 三甲随访）、成本（医疗/非医疗）、效果（QALY 或代理指标），真实世界数据（依从性、急诊次数等）。
- 典型接口：
  - `POST /api/economics/icer/evaluate`：入参为两个方案的成本与效果，返回 ICER 值与「是否经济」标记。
  - `GET /api/economics/recommendation?patientId=...`：基于当前 ICER 与支付能力阈值给出干预建议（降级/升级）。

## M7. 闭环编排服务（Phase 3–4）

- 职责：将「风险识别→干预推荐→执行与依从性→效果与成本再评估」串成闭环，周期性更新患者的推荐方案。
- 触发方式：定时任务或消息队列（例如每日/每周跑一次批处理）。
- 输出：更新后的干预建议、经济性标记、共病风险提示，用于医生工作台和小程序的个性化提示。

## M8. 联邦学习网关（Phase 4）

- 职责：在多机构场景下协调模型训练轮次，聚合参数，保证数据不出本地。
- 当前阶段：仅设计接口与数据结构，占位实现（本地单中心训练），用于答辩与后续扩展。
- 典型接口（内部）：
  - `POST /api/fl/start-round`：启动新一轮联邦训练。
  - `POST /api/fl/upload-update`：各节点上传本地梯度/模型更新。
  - `POST /api/fl/aggregate`：服务端聚合、更新全局模型。

## 与现有小程序的对接方式（初步建议）

- 后端形式：优先考虑复用本仓库的 Next.js API 路由（`app/api/.../route.ts`），路径遵循 `/api/...` 约定，便于与小程序 `utils/api.ts` 中的 `baseUrl` 对齐。
- 迭代策略：
  1. 先在 Next.js 中实现 M1 与 M2 的基础接口，替换 `utils/api.ts` 中的 mock 数据；
  2. 再为 M3–M7 预留接口与入参/出参类型，在后端内部逐步替换为真实模型与算法；
  3. 将 Excel 中的「简化技术」「技术闭环构建」逐项映射到上述模块，并在本文件中补充「来源表格/行号」标注。

