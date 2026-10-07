# 飞鸟马时-兔女郎全身手绘风格 · v1.0

此目录是可携带的 ChatGPT Pets v2 成品。安装图集为 `spritesheet.png`，名称、描述、图集哈希与布局记录在 `pet.json`。

v1.0 便携 ZIP 只包含一个顶层目录 `toki-bunny-fullbody-handdrawn/`，保持原发布字节，包含正式图集、元数据、说明与历史版预览。当前仓库的 `package/previews/` 已单独改善为透明预览，因此预览与说明不再和历史 ZIP 逐字节对应；安装用 `spritesheet.png` 与 `pet.json` 保持原样。

## 安装

1. 下载并解压[便携 ZIP](https://github.com/MIBXR/blue-archive-pets/releases/download/v1.0-toki-bunny-fullbody-handdrawn/toki-bunny-fullbody-handdrawn-portable.zip)，保留本说明、`pet.json` 和 `spritesheet.png`。
2. 让已连接 ChatGPT Pets 的助手读取这些文件，核对图集 SHA-256，并使用 Pets 验证工具预检。
3. 预检通过后，在目标环境中核实要更新的自定义宠物；已有对应宠物时使用该环境实际查到的 ID 更新，没有时创建新宠物。
4. 安装后重新读取宠物记录，核实名称、描述和图集。默认保持当前启用选择；只有明确要求时才切换。

可以直接复制：

> 请读取本包的 README.md 和 pet.json，校验 spritesheet.png 的 SHA-256，并用 ChatGPT Pets 的精灵图验证工具预检。通过后，在当前环境确认是否已有对应的自定义宠物：有则更新，没有则新建。完成后重新核实名称、描述与图集，并保持当前启用的宠物不变。

复制或解压文件不会自动安装。`pet.json` 是作品交付元数据，不是跨账号宠物身份。安装时使用目标环境中新取得的上传会话。

## 动作预览

| 文件 | 内容 |
| --- | --- |
| [all-states.png](previews/all-states.png) / [透明 GIF](previews/all-states.gif) | 九状态与十六方向转椅的完整合集 |
| [states/](previews/states/) | 九个日常状态各有完整 RGBA APNG（`.png`）与透明 GIF |
| [chair-follow.png](previews/chair-follow.png) / [透明 GIF](previews/chair-follow.gif) | 十六方向转椅跟随 |
| [idle-bunny-idle.png](previews/idle-bunny-idle.png) / [透明 GIF](previews/idle-bunny-idle.gif) | 待机、学兔子、返回待机的衔接 |
| [motion-stills.png](previews/motion-stills.png) | 四个原尺寸透明静帧，横向拼接为 768×208 |
| [all-states.mp4](previews/all-states.mp4) | 保留的历史视频，带原有浅色背景 |

<p align="center"><img src="previews/states/idle.png" width="192" alt="时的原尺寸透明待机 APNG"><img src="previews/chair-follow.png" width="192" alt="时的原尺寸透明转椅 APNG"></p>

所有动图从正式图集的 192×208 格子直接提取，不使用网站高清素材，也不放大或重新绘制。APNG 完整保留原 RGBA，包括半透明边缘；透明 GIF 是兼容版，因格式只支持二值透明，细软边缘以 APNG 为准。73 个正式格子与原播放节奏全部保留。预览用于展示，应用内的动作触发、停留和跟随由 ChatGPT Pets 控制。

## 图集信息

- 名称：**飞鸟马时-兔女郎全身手绘风格**。
- 作品版本：**1.0**。
- 格式：透明 RGBA PNG，**1536×2288**；8 列、11 行，每格 **192×208**。
- 有效帧：`[6,8,8,4,5,8,6,6,6,8,8]`，九个日常状态 57 帧，转椅跟随 16 帧，共 73 格。
- 文件 SHA-256：`f5017eb5170348875f138c8c111697cda27199cc1e73a295e66e4781730db10f`。
- 解码 RGBA SHA-256：`e57901beb4815cae879db41f9731c4657c555ad81e492c2a67786d4eb7bcc406`。

这次透明预览改善只重新导出了仓库内的 GIF、APNG 和静帧，正式图集、`pet.json`、历史 MP4 与 v1.0 Release ZIP 的原始字节均未改变。交付元数据在此前归档时已移除原环境 ID、历史更新和启用状态，并增加作品版本字段，避免把源账号状态误当成新环境的安装结果。

角色来自《碧蓝档案 / Blue Archive》；手绘风格参考为用户确认的 [JAZZ JACK（@JAZZ_JACK_）](https://x.com/JAZZ_JACK_)。桌宠由 AI 辅助生成与后续整理制作，角色和参考作品的权利归相应权利人。完整来源与高清原稿见[作品页面](https://github.com/MIBXR/blue-archive-pets/tree/main/pets/toki-bunny-fullbody-handdrawn)。
