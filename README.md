# GitHub Stars Collection

我的 GitHub 收藏（Star）导航站 —— 自动归类、搜索、筛选，方便查找使用过的开源项目。

线上地址：<https://cheer4u.github.io/github-stars-site/>

## 功能

- 按主题（topic）/ 语言筛选，支持全文搜索与多种排序
- 卡片 / 列表两种视图
- 数据内置在 `data.js`，页面无外部 API 请求，加载快

## 一键更新

- 首页右上角 **Update** 按钮会打开 Actions 页面，点 **Run workflow → Run workflow** 确认即可拉取最新收藏；
- 也可直接访问：<https://github.com/cheer4u/github-stars-site/actions/workflows/update-stars.yml>
- 每天 UTC 03:17（北京时间 11:17）自动更新一次；
- 数据有变化时自动提交 `data.js` **并在同一次运行中直接部署 Pages**（GITHUB_TOKEN 的 push 不会触发其他工作流，所以部署由更新工作流显式调用）；
- 从 Actions 返回网站时会自动刷新看到新数据。

## 本地刷新（Windows，可选）

```powershell
cd stars-site
.\fetch_stars.ps1   # 用 gh CLI 拉取最新 star 列表到 starred.json
.\build_data.ps1    # 生成 data.js
git add data.js; git commit -m "chore: update stars data"; git push
```

## 技术

- 纯静态站（HTML/CSS/JS），零依赖；
- `.github/workflows/update-stars.yml` 通过 GitHub API `/users/cheer4u/starred` 分页拉取全部收藏；
- `.github/workflows/deploy.yml` 部署到 GitHub Pages。
