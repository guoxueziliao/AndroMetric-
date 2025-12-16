
# UI Notice System

统一提示系统规范（Final）

**适用版本**: v0.0.6+
**状态**: Final / 可长期维护

## 1. 目标与设计原则

### 1.1 目标
UI Notice System 用于在不打断记录流程的前提下：
- 明确提示 **数据缺失 / 异常 / 建议补充**
- 引导用户 **主动修复或忽略**
- 为未来的 **数据体检 / 抗熵机制** 提供统一承载层

### 1.2 不可破坏原则
- **不自动修复**用户事实数据
- **不强制补全**
- **不阻断保存流程**
- 提示 ≠ 错误
- 所有提示必须可忽略

### 1.3 使用边界
- UI Notice 只展示“事实 + 影响 + 行动建议”
- 不做判断、不下结论、不道德化
- 所有修复行为 **必须显式触发**

---

## 2. Notice 数据模型（统一结构）

### 2.1 NoticeLevel
`type NoticeLevel = 'error' | 'warn' | 'info';`

| Level | 含义 |
| :--- | :--- |
| **error** | 结构性异常，可能影响数据完整性 |
| **warn** | 重要信息缺失，影响统计或回顾 |
| **info** | 建议补充项，不影响使用 |

### 2.2 NoticeItem（核心结构）
```typescript
type NoticeItem = {
  id: string;              // 唯一ID（规则ID + 实体ID）
  level: NoticeLevel;
  
  title: string;           // 一句话事实描述
  detail?: string;         // 可选：影响说明 / 使用提示
  
  ruleId: string;          // 规则编号（如 C-M1）
  path?: string;           // 数据定位（调试/跳转用）
  
  action?: NoticeAction;   // 可选：用户可执行操作
};
```

### 2.3 NoticeAction
```typescript
type NoticeAction = {
  label: string;           // 按钮文案（去选择 / 去补充 / 一键修复）
  intent?: 'primary' | 'ghost';
  onAction: () => void;
  confirm?: {
    title: string;
    message: string;
  };
};
```

---

## 3. UI 组件规范（逻辑层）

### 3.1 组件清单
| 组件名 | 用途 |
| :--- | :--- |
| **NoticeBadge** | 卡片角标，显示提示数量 |
| **InlineNotice** | 单条提示（卡片内） |
| **NoticeStack** | 多条提示聚合 |
| **ToastNotice** | 动作反馈（非解释） |

### 3.2 NoticeBadge
- **用途**：提示“该实体存在问题”
- **只显示**：图标 + 数量
- **不显示文字描述**
- 点击后展开 / 收起 NoticeStack

### 3.3 InlineNotice
- **用途**：显示单条具体问题
- **显示规则**：
    - 始终显示 `title`
    - `detail` 默认折叠
    - 有 `action` 才显示按钮
    - **不显示“错误 / 警告”字样**

### 3.4 NoticeStack
- **用途**：聚合展示多个 NoticeItem
- **规则**：
    - 默认最多显示 3 条
    - 超出显示：`还有 N 条提示…`
    - 展开后按 severity 排序

### 3.5 ToastNotice
- **用途**：反馈用户动作结果
- **仅用于**：一键修复完成、保存 / 删除 / 跳转成功
- **禁止用于**：解释缺失原因、提示用户“该补数据了”

---

## 4. 文案规范（强约束）

### 4.1 title
- 只描述事实
- 不使用情绪词
- 不使用“错误 / 必须 / 不合法”

✅ **示例**：`未选择素材来源平台`
❌ **反例**：`素材来源错误`、`必须选择平台`

### 4.2 detail
- 只描述影响
- 不评价行为
- 可说明“统计影响 / 回顾影响”

### 4.3 action.label
- 动词开头
- 不超过 6 个字
- 不使用“修正 / 修复”除非真的自动修改

---

## 5. ContentItem 体检 → NoticeItem 映射表（Final）

**适用对象**：ContentItem（素材单元）

### C-M1｜未选择素材类型
- **level**: `error`
- **title**: `未选择素材类型`
- **detail**: `无法区分视频、图片或文字素材`
- **action**: `去选择`

### C-M2｜未选择平台来源
- **level**: `warn`
- **title**: `未选择来源平台`
- **detail**: `无法统计平台偏好`
- **action**: `去选择`

### C-M3｜平台为“其他 / 自定义”但无名称
- **level**: `warn`
- **title**: `平台名称为空`
- **detail**: `建议填写具体来源名称`
- **action**: `去补充`

### C-M4｜未填写任何标题 / 备注
- **level**: `info`
- **title**: `未填写素材备注`
- **detail**: `回顾时可能难以识别内容`
- **action**: `去补充`

### C-M5｜XP 标签为空
- **level**: `info`
- **title**: `未添加性癖标签`
- **detail**: `不影响记录，仅影响偏好统计`
- **action**: `去添加`

### C-M6｜同一素材引用多个平台（迁移前遗留）
- **level**: `warn`
- **title**: `一个素材包含多个平台`
- **detail**: `建议拆分为多个素材单元`
- **action**: `拆分素材（未来）`

### C-M7｜素材缺少唯一 ID（历史数据）
- **level**: `error`
- **title**: `素材缺少唯一标识`
- **detail**: `可能影响编辑与迁移`
- **action**: `一键修复`

---

## 6. 排序与聚合规则
1. `error` > `warn` > `info`
2. 同级按 `ruleId` 稳定排序
3. 同一 `ruleId` + `ContentItem` 只显示一次
