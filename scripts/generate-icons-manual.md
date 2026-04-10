# PWA 图标生成指南

## 问题
环境没有 ImageMagick，无法自动生成图标

## 解决方案（按推荐顺序）

### 方案 1：在线工具（推荐）
访问以下网站，上传 `public/icon.png`，自动生成所有尺寸：

1. **https://pwa-asset-generator.nicepkg.cn/**
   - 专为 PWA 设计
   - 自动生成 manifest 配置
   - 支持遮罩图标

2. **https://realfavicongenerator.net/**
   - 功能全面
   - 支持 iOS Safari
   - 支持 Windows tiles

3. **https://maskable.app/editor**
   - 专门生成自适应图标
   - 预览不同形状效果

### 方案 2：本地安装 ImageMagick

**macOS:**
```bash
brew install imagemagick
bash scripts/generate-icons.sh
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install imagemagick
bash scripts/generate-icons.sh
```

**Windows:**
```powershell
choco install imagemagick
bash scripts/generate-icons.sh
```

### 方案 3：手动复制（临时方案）

如果你已有 `icon.png`，可以直接复制到 icons 目录：

```bash
mkdir -p public/icons
cp public/icon.png public/icons/icon-192x192.png
cp public/icon.png public/icons/icon-512x512.png
```

然后更新 `vite.config.ts`：

```typescript
manifest: {
  icons: [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  // ... rest of config
}
```

## 所需图标尺寸

```
icon-72x72.png     - Android 启动器
icon-96x96.png     - Android 启动器
icon-128x128.png   - Chrome Web Store
icon-144x144.png   - Microsoft tiles
icon-152x152.png   - iPad
icon-167x167.png   - iPad Pro
icon-180x180.png   - iPhone
icon-192x192.png   - Android/Chrome
icon-384x384.png   - PWA 启动画面
icon-512x512.png   - PWA 启动画面
splash.png         - iOS 启动画面（可选）
```

## 验证

生成图标后，在浏览器打开 DevTools → Application → Manifest，检查：
- ✅ Icons 显示正常
- ✅ 所有尺寸都有
- ✅ 没有 404 错误

## 推荐操作

**立即执行（最简单）：**
1. 访问 https://pwa-asset-generator.nicepkg.cn/
2. 上传 `public/icon.png`
3. 下载生成的图标包
4. 解压到 `public/icons/`
5. 提交并部署

**本地开发（最佳）：**
1. 安装 ImageMagick
2. 运行 `bash scripts/fix-pwa.sh`
3. 自动完成

## 当前状态

- ✅ manifest.json 已配置
- ✅ index.html 已添加 manifest 链接
- ✅ usePWA hook 已增强
- ⚠️ 图标目录为空（需要生成）

下一步：请使用在线工具生成图标，然后提交到仓库。
