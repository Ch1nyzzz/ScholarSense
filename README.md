
# One Glance 📚

**AI-Native Paper OS** for Researchers.  
**One Glance** 是一款专为研究人员打造的原生 AI 文献阅读与管理工具。它深度集成了全球主流的大模型服务，能够自动提取文献核心洞察、解析复杂的数学公式、进行深度方法论分析，并提供现代化的知识管理体验。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)

---

## ✨ 核心特性 (Features)

*   **🧠 全能模型支持**: 
    *   **Google Gemini**: Pro 3.0 / Flash 2.5 / 2.0 Thinking。
    *   **DeepSeek (深度求索)**: 原生支持 V3 (Chat) 和 R1 (Reasoner)。
    *   **Kimi / Moonshot**: 支持最新的 Kimi k2 系列和 k2-thinking。
    *   **Qwen (通义千问)**: 支持 Qwen-Max, Qwen-Plus 等。
    *   **Zhipu GLM (智谱)**: 支持 GLM-4.6, GLM-4-Flash 等。
    *   **MiniMax**: 支持 MiniMax-M2 系列。
*   **📑 深度 AI 解析**: 自动生成包含背景、动机、方法论（LaTeX 公式支持）、实验结果、审稿人视角的结构化报告。
*   **🔗 智能网络解析**: 直接粘贴 Arxiv 链接，AI 自动联网搜索并生成报告。
*   **☁️ 私有云同步**: 支持连接您自己的 **Supabase** 数据库，实现多设备同步，数据完全私有。
*   **💎 极简 UI**: 类似 Apple 设计语言的现代化界面，专注阅读体验。

---

## 🛠️ 本地开发 (Local Development)

确保您的电脑上已安装 [Node.js](https://nodejs.org/) (v18 或更高版本)。

### 1. 克隆项目
```bash
git clone https://github.com/your-username/one-glance.git
cd one-glance
```

### 2. 安装依赖
```bash
npm install
# 或者使用 pnpm (推荐)
# pnpm install
```

### 3. 启动开发服务器
```bash
npm run dev
```
启动后，浏览器访问 `http://localhost:5173` 即可看到应用。

---

## 🚀 部署指南 (Deployment)

本项目是纯前端应用 (SPA)，可以轻松部署到 Vercel、Netlify 或任何静态网页托管服务。

### 推荐：部署到 Vercel

1.  将代码 Push 到您的 GitHub 仓库。
2.  登录 [Vercel](https://vercel.com/)，点击 "Add New Project"。
3.  选择您的 `one-glance` 仓库。
4.  **Build Settings** 保持默认即可：
    *   **Framework Preset**: Vite
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  点击 **Deploy**。

---

## ⚙️ 配置指南 (Configuration)

One Glance 是一个**无后端 (Client-side Only)** 或 **自带后端 (BYOB)** 的应用。**您不需要在 `.env` 文件中配置 API Key**，所有配置均在应用的设置界面中完成，Key 仅存储在您浏览器的本地存储 (LocalStorage) 中。

### 第一步：获取 API Key

| 服务商 (Provider) | 推荐模型 | 获取地址 | 备注 |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.0-flash-thinking` | [Google AI Studio](https://aistudio.google.com/app/apikey) | **免费且强大**，推荐首选。 |
| **DeepSeek** | `deepseek-chat`, `deepseek-reasoner` | [DeepSeek Platform](https://platform.deepseek.com/) | 性价比极高，推理能力强。 |
| **Kimi / Moonshot** | `kimi-latest`, `kimi-k2-thinking` | [Moonshot AI](https://platform.moonshot.ai/) | 长文本与逻辑推理优秀。 |
| **Qwen (阿里云)** | `qwen-max`, `qwen-plus` | [Qwen / Aliyun](https://qwen.ai) | 中文理解能力顶尖。 |
| **Zhipu GLM** | `glm-4.6`, `glm-4-flash` | [BigModel.cn](https://bigmodel.cn) | 综合能力均衡。 |
| **MiniMax** | `MiniMax-M2` | [MiniMax Platform](https://platform.minimax.io) | 拟人化交互体验好。 |
| **SiliconFlow** | `DeepSeek-R1`, `Qwen2.5` | [SiliconCloud](https://cloud.siliconflow.cn/) | 聚合平台，访问速度快。 |
| **OpenAI** | `gpt-4o`, `o1` | [OpenAI Platform](https://platform.openai.com/) | 行业基准。 |

### 第二步：在应用中配置

1.  打开应用，点击左下角的 **设置图标 (⚙️)**。
2.  在 **AI Provider & Model** 区域选择您想使用的服务商（如 `DeepSeek` 或 `Kimi`）。
3.  在 **API Key** 输入框中粘贴您的 Key。
4.  (可选) 选择您喜欢的模型，或者手动输入自定义模型 ID。
5.  点击 **Save Changes**。

---

## ☁️ 云端同步配置 (Supabase Sync) - 可选

如果您需要在不同设备间同步文献库，可以使用 Supabase 的免费层。

1.  登录 [Supabase](https://supabase.com/) 并创建一个新项目。
2.  在 Supabase 后台，进入 **Settings -> API**，复制 `Project URL` 和 `anon public key`。
3.  进入 **SQL Editor**，运行以下 SQL 脚本以初始化数据库：

```sql
-- 1. 创建 papers 表
create table papers (
  id uuid primary key,
  user_id uuid references auth.users not null,
  title text,
  original_title text,
  source_url text,
  storage_path text,
  analysis jsonb,
  tags text[],
  status text,
  is_favorite boolean default false,
  user_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 开启行级安全 (RLS)
alter table papers enable row level security;

-- 3. 创建存储桶 (Storage Bucket)
insert into storage.buckets (id, name, public) values ('papers', 'papers', false);

-- 4. 设置安全策略 (Policies) - 允许用户仅访问自己的数据
create policy "Users can manage their own papers"
on papers for all
using (auth.uid() = user_id);

create policy "Users can upload their own pdfs"
on storage.objects for insert
with check ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can view their own pdfs"
on storage.objects for select
using ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );
```

4.  回到 One Glance 的设置界面，在 **Cloud Sync** 区域填入 URL 和 Key，并注册/登录账号即可。

---

## 📄 License

MIT License.