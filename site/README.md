# 响与时的宣传网站

收藏入口连到两个独立角色页面：响是奶油白、蓝色和黄色的运动会应援手册；时是深蓝、青色的 C&C 任务档案。布局、文案与动作用各自的角色特点组织。

- [收藏入口](https://blue-archive-desktop-companions.mibxranime.chatgpt.site/)
- [响的应援手册](https://blue-archive-desktop-companions.mibxranime.chatgpt.site/hibiki.html)
- [时的任务档案](https://blue-archive-desktop-companions.mibxranime.chatgpt.site/toki.html)

使用 Sites 托管；当前访问权限为所有者私有。网站源码保存在本目录，GitHub 用于保存作品资料与便携包。无需框架或构建步骤。

## 本地查看

首次从 Git 克隆后，在此目录依次执行：

```bash
python tools/prepare-hd.py
node tools/prepare-downloads.mjs
python -m http.server 4177
```

首条命令需要 Python 3.10+、Pillow 和 NumPy，从仓库中已保存的原稿生成相同字节的透明高清素材；第二条从固定 Release 获取两份已有便携包并核对 SHA-256。浏览器打开 `http://localhost:4177/`。用 HTTP 打开以加载模块和 JSON。

原稿保存在 `pets/`；程序生成的 `motion-hd/*.png` 和重复的 Release ZIP 不再写入 Git，处理脚本、每帧注册信息与来源校验值保留在 Git。Sites 部署和完整交付包均已包含这些生成文件，可直接使用。

## 动作与下载

每个角色页面分别拥有主视觉旁、动作舞台与下载区三个独立播放器。舞台有九种动作、十六方向、指针跟随、键盘方向切换和暂停。减少动态效果的系统设置会让动画默认暂停。

动作优先使用透明高清原稿，正式 sprite v2 图集作为加载失败时的回退。时的转椅只有正式图集来源，保持 192×208 原尺寸展示；页面明确标示这项来源限制。

复制安装指令只会复制可查看的文字。默认保留当前启用的宠物，勾选后才请求启用新宠物。浏览器拒绝剪贴板时展示可手动复制的文本；安装信息缺失时提示直接下载 ZIP。关闭 JavaScript 仍可阅读故事、查看主图并下载 ZIP。

网页下载 ZIP 是已发布 Release 的原始字节。Agent 指令使用同一固定版本的公开 Release URL，避免私有 Sites 权限阻挡 Agent 下载；二者 SHA-256 一致。完整校验值、包内配置/说明/图集路径见 `downloads/agent-install.json`。未更改 `pets/` 下的原稿、正式图集与应用配置。

## 设计依据与来源

按钮参考 Nexon 官方真实游戏界面：约 `skewX(-10deg)` 的平行四边形底板、小圆角、短阴影；文字保持水平。蓝色与黄色分别对应任务操作和确认操作。截图中的教程高亮不作为常规按钮发光效果。

- [官方 Formation 教程](https://forum.nexon.com/bluearchive-en/board_view?board=3222&thread=2523154)
- [官方 Mission 教程](https://forum.nexon.com/bluearchive-en/board_view?board=3222&thread=2720664)
- [Yostar 发布文：响与晄轮大祭](https://www.4gamer.net/games/519/G051983/20220929076/)
- [Yostar 发布文：时与白垩之预告状](https://www.4gamer.net/games/519/G051983/20230427013/)

响的工程部与应援服背景、时的 C&C 潜入任务背景与桌宠动作分开说明。兔女郎时对应「白垩之预告状」的潜入任务。页面末尾还列有 Good Smile 官方设定来源及各角色的创作记录。

素材与角色来源、AI 辅助制作及 JAZZ_JACK_ 风格参考的署名均在页面保留。角色和参考作品权利归各自原权利人。

## 验证记录

浏览器验证覆盖桌面和 320/390/760/1024/1440 像素宽度，九动作、十六方向、独立播放、暂停/继续、减少动态效果、剪贴板成功与拒绝、安装信息缺失、无 JavaScript、资源失败回退、子目录路径以及实际下载文件的 SHA-256。页面截图见 `assets/previews/`。
