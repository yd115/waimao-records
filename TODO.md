# 任务：将应用数据永久存储到 Supabase 数据库并实现用户登录

## 计划
- [x] 步骤 1: 数据库迁移 (SQL)
  - [x] 创建 `user_role` 枚举和 `profiles` 表
  - [x] 创建 `handle_new_user` 触发器函数和触发器
  - [x] 创建 `tags` 表和 `records` 表
  - [x] 设置 RLS (行级安全) 策略
- [x] 步骤 2: 配置身份验证
  - [x] 调用 `supabase_verification` 禁用邮箱验证（使用用户名登录模拟）
  - [x] 更新 `src/context/AuthContext.tsx` 实现登录/注册/注销逻辑
  - [x] 更新 `src/components/common/RouteGuard.tsx` 处理路由拦截
- [x] 步骤 3: 路由和页面调整
  - [x] 创建 `src/pages/LoginPage.tsx`
  - [x] 更新 `src/routes.tsx` 添加登录路由
  - [x] 在 `src/App.tsx` 中集成 AuthProvider 和 RouteGuard
- [x] 步骤 4: 实现数据库 API
  - [x] 创建 `src/db/api.ts` 封装标签和记录的 CRUD 操作
- [x] 步骤 5: 更新业务组件
  - [x] 更新 `src/pages/HomePage.tsx` 以使用数据库数据
  - [x] 更新 `src/components/QuickInput.tsx`
  - [x] 更新 `src/components/TagManager.tsx`
  - [x] 更新 `src/components/FilterBar.tsx`
  - [x] 更新 `src/components/EditDialog.tsx`
  - [x] 更新 `src/components/TodayCustomers.tsx` (间接支持)
- [x] 步骤 6: Excel 导入导出功能
  - [x] 安装 xlsx 库
  - [x] 创建 `src/lib/excel.ts` 实现 Excel 导入导出
  - [x] 更新 HomePage 添加导入导出按钮
  - [x] 确保 iOS 兼容性（使用标准文件 API）
- [x] 步骤 7: 验证与清理
  - [x] 运行 lint 检查
  - [x] 验证数据持久化和用户隔离
  - [x] 修复 FileText 导入问题

## 注释
- ✅ 数据库架构完成，支持用户隔离
- ✅ 用户认证系统完成（用户名登录）
- ✅ 所有业务组件已迁移到数据库
- ✅ Excel 导入导出功能已实现
- ✅ iOS 兼容性：使用标准 file input 和 download API
- ✅ 所有代码通过 lint 检查
- ✅ 已移除未使用的 FileText 图标导入

## 使用说明
1. **首次使用**：注册账号（第一个注册的用户自动成为管理员）
2. **登录**：使用用户名和密码登录
3. **快速记录**：在主页输入工作记录，系统自动智能分析
4. **导出数据**：点击"导出"按钮，下载 Excel 文件到设备
5. **导入数据**：点击"导入"按钮，选择 Excel 文件批量导入
6. **iOS 用户**：导出的文件会保存到"文件"应用中，导入时也从"文件"应用选择

## 故障排除
- 如遇到 `FileText is not defined` 错误，请清除浏览器缓存或强制刷新（Ctrl+Shift+R / Cmd+Shift+R）

## 注释
- 存储库信息：`/workspace/app-9lfvx6paw8ap`
- 使用用户名 + 密码登录（模拟邮箱格式 `username@miaoda.com`）
- 初始标签将在用户首次进入时自动创建（或通过迁移插入默认值）
