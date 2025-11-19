
# ScholarSense 📚

**ScholarSense** is an AI-Native Paper OS designed for researchers. It serves as a personal knowledge management tool with deep reading capabilities powered by Google's Gemini models.

**ScholarSense** 是为研究人员设计的原生 AI 文献操作系统。它是一个由 Google Gemini 模型驱动的个人知识管理工具，具备深度阅读和分析能力。

---

## ✨ Features / 功能特性

*   **AI-Powered Analysis**: Automatically extracts and summarizes background, motivation, methodology, and conclusions using Gemini 2.5 Flash.
    *   **AI 深度分析**: 使用 Gemini 2.5 Flash 自动提取并总结背景、动机、方法论和结论。
*   **Installable App (PWA)**: Works as a native application on macOS, Windows, iOS, and Android.
    *   **原生应用体验 (PWA)**: 可作为原生应用安装在 macOS、Windows、iOS 和 Android 上。
*   **Cloud Sync (BYOB)**: Optional sync capability using your own Supabase backend.
    *   **云端同步 (BYOB)**: 支持使用您自己的 Supabase 后端进行多端同步，数据完全由您掌控。
*   **Deep Reading Mode**: Split-view interface with the original PDF and AI analysis side-by-side.
    *   **深度阅读模式**: 提供原始 PDF 与 AI 分析对照的分屏阅读界面。
*   **Smart Tagging**: Auto-generated semantic tags for better organization.
    *   **智能标签**: 自动生成语义标签，便于分类整理。
*   **Persistent Storage**: Uses IndexedDB to store your PDFs locally, or Supabase for cloud storage.
    *   **持久化存储**: 使用 IndexedDB 在本地存储 PDF，或通过 Supabase 存储在云端，刷新不丢失。

---

## 📱 How to Install (Make it Software) / 如何安装（作为软件使用）

ScholarSense is a **Progressive Web App (PWA)**. You can install it directly from the browser without an app store.
ScholarSense 是一个 **渐进式 Web 应用 (PWA)**。你可以直接从浏览器安装它，无需经过应用商店。

### On Desktop (Chrome/Edge) / 桌面端
1.  Open the website. (打开网站)
2.  Look for the **Install icon** (computer with arrow) in the address bar on the right. (点击地址栏右侧的 **安装图标**)
3.  Click **Install**. (点击 **安装**)
4.  It will launch in its own window and appear in your Start Menu/Dock/Spotlight. (它将以独立窗口启动，并出现在开始菜单或 Dock 栏中)

### On iOS (iPhone/iPad) / iOS 端
1.  Open in **Safari**. (在 Safari 中打开)
2.  Tap the **Share** button. (点击 **分享** 按钮)
3.  Scroll down and tap **"Add to Home Screen"**. (向下滑动并点击 **“添加到主屏幕”**)

### On Android / 安卓端
1.  Open in **Chrome**. (在 Chrome 中打开)
2.  Tap the three dots menu. (点击右上角三个点)
3.  Tap **"Install App"** or **"Add to Home Screen"**. (点击 **“安装应用”** 或 **“添加到主屏幕”**)

---

## ☁️ Setting Up Cloud Sync (Multi-Device) / 设置云端同步（多端同步）

To sync your papers between your Phone and Computer, you need a backend. Since ScholarSense is privacy-first, you own your backend using **Supabase** (Free Tier is sufficient).
要在手机和电脑之间同步文献，你需要一个后端。为了保护隐私，ScholarSense 采用 "Bring Your Own Backend" 模式，你可以使用 **Supabase**（免费版完全够用）作为自己的后端。

### Step 1: Create Supabase Project / 创建 Supabase 项目
1.  Go to [Supabase.com](https://supabase.com) and sign up. (注册 Supabase)
2.  Create a new project (e.g., "My-ScholarSense"). (创建一个新项目)
3.  Go to **Project Settings** -> **API**. (进入设置 -> API)
4.  Copy the **Project URL** and **anon / public Key**. (复制 Project URL 和 anon/public Key)

### Step 2: Create Database Table / 创建数据库表
Go to the **SQL Editor** in Supabase and run this command to create the sync table:
进入 Supabase 的 **SQL Editor**，运行以下命令来创建同步表：

```sql
create table user_backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  data jsonb,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS) / 开启行级安全
alter table user_backups enable row level security;

-- Allow users to only see/edit their own rows / 仅允许用户访问自己的数据
create policy "Users can insert their own backup"
on user_backups for insert
with check (auth.uid() = user_id);

create policy "Users can update their own backup"
on user_backups for update
using (auth.uid() = user_id);

create policy "Users can select their own backup"
on user_backups for select
using (auth.uid() = user_id);
```

### Step 3: Connect App / 连接应用
1.  Open ScholarSense **Settings**. (打开应用设置)
2.  Enter your **Supabase URL** and **Supabase Key**. (填入 URL 和 Key)
3.  Create an account (Sign Up) inside the Settings panel. (在设置面板中直接注册账号)
4.  Click **"Push to Cloud"** on your main device, and **"Pull from Cloud"** on your other devices. (在主设备点击“上传同步”，在其他设备点击“下载恢复”)

---

## 🚀 Local Development / 本地开发部署

1.  **Clone the repository / 克隆仓库**
    ```bash
    git clone https://github.com/your-username/scholarsense.git
    cd scholarsense
    ```

2.  **Install dependencies / 安装依赖**
    ```bash
    npm install
    ```

3.  **Run the development server / 启动开发服务器**
    ```bash
    npm run dev
    ```

---

## 📄 License

MIT License.
