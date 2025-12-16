
# 素材结构迁移说明｜不猜策略 · Final

## 背景

v0.0.6 之前，自慰记录中的素材（assets）允许：

*   同时选择多个「内容类型」（视频 / 直播 / 图片等）
*   同时选择多个「平台」（Pornhub / Telegram / 本地等）

该结构在记录阶段方便，但在以下方面存在长期风险：

1.  素材语义不清晰
2.  平台与类型的真实对应关系不可恢复
3.  标签、统计、回顾时产生歧义
4.  后续扩展（AI、推荐、分析）不可控

因此，在数据量尚小的阶段，对素材结构进行一次确定性的结构迁移。

## 核心原则（必须遵守）

**系统永远不猜内容语义，只做结构性拆分。**

*   系统不推断
*   系统不判断“更像什么”
*   系统不替用户决定素材意义

一切语义判断交由用户后续编辑完成

## 迁移目标

将原有 `assets` 结构拆解为 **单一语义单位 ContentItem**

每个 ContentItem 表示：
「一个明确类型 + 一个明确平台 + 一组明确标签」

### 旧结构（v0.0.6 之前）
```typescript
assets = {
  types: string[]        // 允许多选
  platforms: string[]    // 允许多选
  title?: string
  actors?: string[]
  categories?: string[] // XP 标签
}
```

### 新结构（迁移后）
```typescript
contentItems: ContentItem[]
```

**ContentItem 最小结构**
```typescript
ContentItem {
  id: string
  type?: ContentType        // 视频 / 图片 / 回忆 / 幻想等
  platform?: Platform       // Pornhub / Telegram / 本地等
  title?: string
  actors?: string[]
  xpTags?: string[]
  notes?: string            // 系统迁移备注
}
```

## 拆分规则（不猜版 · 定死）

### 规则 A：多个平台
`platforms.length > 1`

➡️ **每个平台拆成一个 ContentItem**

### 规则 B：多个类型
`types.length > 1`

➡️ **每个类型拆成一个 ContentItem**

### 规则 C：平台和类型都为多选
`platforms.length > 1 && types.length > 1`

**处理方式：**
1.  拆成 `max(platforms.length, types.length)` 个 ContentItem
2.  不做平台 ↔ 类型的对应推断
3.  多余字段写入 `notes`

**❌ 不允许：**
*   不允许一一配对
*   不允许按“最合理组合”
*   不允许用关键词猜

## 字段复制规则

| 字段 | 行为 |
| :--- | :--- |
| `title` | 原样复制 |
| `actors` | 原样复制 |
| `categories` / `xpTags` | 复制给所有 ContentItem |
| `id` | 新生成 |
| `notes` | 自动添加迁移说明 |

### 自动迁移备注（必须）
凡是拆分生成的 ContentItem，系统自动加入：
> 此素材由旧版多选结构迁移生成，请检查类型与平台是否正确。

## 迁移安全策略

1.  **迁移前**：自动创建数据快照
2.  **迁移后**：
    *   不删除原字段（可保留一版以防回滚）
    *   不强制用户立即修正

## 不可回避声明

本次迁移 **不保证语义完全正确**
但保证 **结构长期可维护**
