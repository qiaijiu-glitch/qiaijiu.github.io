# GitHub Pages 发布说明

## 作用

这个项目已经接入 GitHub Pages 自动发布。

- 本地开发仍然使用 `npm run dev`
- 发布预览使用 `npm run build` 产出的 `dist/`
- 推送到 `main` 分支后，GitHub Actions 会自动构建并部署 Pages

## 首次启用

1. 打开仓库的 `Settings > Pages`
2. `Build and deployment` 里选择 `Source: GitHub Actions`
3. 确认仓库默认分支是 `main`

## 以后怎么更新预览

1. 本地修改项目
2. 运行 `npm run build` 自检
3. 提交并推送到 `main`
4. 等待仓库里的 `Deploy GitHub Pages` 工作流执行完成
5. 预览链接会自动更新

## 对当前项目的影响

- 不影响本地预览方式
- 不影响模型、数据联动和交互逻辑
- 只负责把构建后的静态资源发布到 GitHub Pages

## 资源说明

当前项目依赖以下静态资源一起发布：

- `dist/assets/`
- `dist/models/`

模型不显示时，优先检查：

1. GitHub Pages 是否启用了 `GitHub Actions`
2. 工作流是否构建成功
3. 发布内容是否来自 `dist/`
