# 外贸工作记录

一个用于日常外贸跟进的轻量工作台，支持记录客户沟通、运价信息、报价信息，并对内容做结构化识别。

## 功能

- 邮箱注册与登录
- 工作记录新增、编辑、删除
- 标签管理
- Excel 导入与导出
- 报价生成器
- 自动识别客户、公司、国家、型号、船公司、流程关键词
- 数据持久化到 Supabase

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase

## 环境变量

本地开发或部署时需要配置以下环境变量：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
VITE_APP_ID=app-9lfvx6paw8ap
```

注意：
- 不要把 `.env` 提交到 GitHub
- 线上环境变量请配置在 Vercel 的 Project Settings -> Environment Variables 中

## 本地运行

先确保已安装：

- Node.js 20+
- pnpm 9+ 或 10+

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev -- --host 127.0.0.1 --port 4173
```

本地访问：

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/login`
- `http://127.0.0.1:4173/quote-generator`

## Supabase 初始化

项目依赖 Supabase 作为认证和数据库服务。

初始化步骤：

1. 新建一个 Supabase 项目
2. 打开 SQL Editor
3. 执行以下文件中的 SQL：

[`supabase/migrations/00001_init_schema_and_rls.sql`](./supabase/migrations/00001_init_schema_and_rls.sql)

建议同时确认：

- 已关闭邮箱确认，便于直接注册登录
- `profiles`、`records`、`tags` 三张表已创建成功

## 部署

推荐部署方案：

- 前端：Vercel
- 数据库：Supabase

Vercel 配置建议：

- Framework Preset：Vite
- Build Command：`pnpm build`
- Output Directory：`dist`

项目已包含 `vercel.json`，用于保证单页应用路由在 Vercel 上正常工作。

## 项目结构

```text
.
├── src
│   ├── components
│   ├── contexts
│   ├── db
│   ├── lib
│   ├── pages
│   ├── types
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── supabase
│   └── migrations
├── index.html
├── package.json
├── vercel.json
└── README.md
```

## 使用建议

- 工作数据请优先保存在 Supabase，不要依赖浏览器本地缓存
- 如果长期日常使用，建议后续给 Supabase 升级付费计划，避免免费项目长时间不用被暂停
- 每次上线前可先执行：

```bash
pnpm lint
pnpm build
```