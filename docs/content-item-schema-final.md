
# 素材数据结构最终规范

## 设计目标

1.  每个素材 = 一个真实可理解的内容单位
2.  支持长期演进（AI / 统计 / 标签系统）
3.  不依赖“上下文猜测”

## ContentItem 定义

```typescript
type ContentItem = {
  id: string                     // 唯一 ID
  type?: ContentType             // 内容形式
  platform?: Platform            // 来源平台
  title?: string                 // 标题 / 识别名
  actors?: string[]              // 演员 / 角色
  xpTags?: string[]              // XP 标签（仅性癖）
  notes?: string                 // 备注（迁移 / 说明）
}
```

## ContentType（内容形式）

单选，必为“内容本体形式”

**允许值：**
*   视频
*   直播
*   图片 / 图集
*   小说 / 文字
*   回忆（真实经历）
*   幻想（纯脑补）
*   音频
*   漫画

**❌ 禁止：**
*   真人 / 二次元（这是风格）
*   国产 / 欧美（这是来源）
*   长 / 短（这是属性）

## Platform（来源平台）

单选

**示例：**
*   Pornhub
*   Xvideos
*   Telegram
*   OnlyFans
*   本地文件
*   记忆（用于回忆）
*   无来源（用于幻想）

## xpTags（性癖标签）

仅允许 XP / 性偏好

**不允许：**
*   时间
*   情绪
*   健康状态
*   行为结果

## notes（备注）

**用途：**
*   迁移说明
*   用户自定义解释
*   无法结构化的信息

## 强约束（不可破坏）

❗ 一个 ContentItem 只能有一个 `type`
❗ 一个 ContentItem 只能有一个 `platform`
❗ 多个素材 = 多个 ContentItem
❗ 系统不得自动合并 ContentItem
