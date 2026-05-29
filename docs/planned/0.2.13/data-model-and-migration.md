# 0.2.13 数据模型

## 当前问题

当前补剂是每日记录里的写死选项。它适合快速勾选，但不适合表达：

- 为什么吃。
- 吃多久。
- 每天还是隔天。
- 什么时候暂停。
- 剂量和单位。
- 已结束和历史回看。

## 建议模型

实现前必须按真实代码校准命名。概念上需要三层：

1. `HealthProject`
   - 用户正在管理的健康项目。
   - 字段：id、type、name、goal、status、notes、createdAt、updatedAt。
2. `HealthProjectPlan`
   - 项目的周期计划。
   - 字段：projectId、scheduleType、startDate、endDate、amount、unit、timeTags、pausedRanges。
3. `HealthProjectLog`
   - 某天的执行事实。
   - 字段：projectId、date、status、amount、note、source。

## 最小字段

`HealthProject` 最少需要：

- `id`
- `type`
- `name`
- `status`
- `createdAt`
- `updatedAt`

`HealthProjectPlan` 最少需要：

- `id`
- `projectId`
- `scheduleType`
- `startDate`
- `endDate?`

补剂计划可选字段：

- `amount`
- `unit`
- `timeTags`
- `note`

`HealthProjectLog` 最少需要：

- `id`
- `projectId`
- `date`
- `status`
- `source`

## 类型边界

第一版类型：

- `supplement`
- `sunlight`
- `stretching`
- `rehab`
- `sleep_routine`
- `other_habit`

补剂单位：

- `mg`
- `g`
- `mcg`
- `IU`
- `capsule`
- `tablet`
- `ml`
- `drop`
- `custom`

服用时间标签：

- `morning`
- `noon`
- `evening`
- `bedtime`
- `before_meal`
- `after_meal`
- `anytime`

不进入第一版：

- `medication`
- `treatment`
- `diagnosis`

## 兼容与迁移

旧 `supplements` 字段、migration、JSON backup、import preview 和 snapshot integrity 细节见 [`migration-and-data-safety.md`](./migration-and-data-safety.md)。
