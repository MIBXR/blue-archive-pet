# 飞鸟马时-兔女郎全身手绘风格 · v1.0

此目录是可携带的 sprite v2 成品，供支持该格式的 Agent、Petdex Desktop 或兼容桌宠应用使用。安装图集为 `spritesheet.png`，名称、描述、图集哈希与布局记录在 `pet.json`。

v1.0 便携 ZIP 只包含一个顶层目录 `toki-bunny-fullbody-handdrawn/`，保持原发布字节，包含正式图集、元数据、说明与历史版预览。当前仓库的 `package/previews/` 已单独改善为透明预览，因此预览与说明不再和历史 ZIP 逐字节对应；安装用 `spritesheet.png` 与 `pet.json` 保持原样。

## 安装

1. 下载并解压[便携 ZIP](https://github.com/MIBXR/blue-archive-pets/releases/download/v1.0-toki-bunny-fullbody-handdrawn/toki-bunny-fullbody-handdrawn-portable.zip)，保留本说明、`pet.json` 和 `spritesheet.png`。
2. 优先使用你指定或当前 Agent 的目标：支持 v2 的 Codex 安装到 `$CODEX_HOME/pets/toki-bunny-fullbody-handdrawn/`（默认 `~/.codex/pets/toki-bunny-fullbody-handdrawn/`），其他 Agent 使用从其文档或配置确认的兼容宠物目录，没有适用的 Agent 或目标客户端仅支持 v1 时安装到 `~/.petdex/pets/toki-bunny-fullbody-handdrawn/`。将 `~` 展开为当前操作系统用户主目录，保留原图，不转换为 v1。
3. 核对图集 SHA-256 与 v2 布局，保留原始元数据副本。直接安装到 Codex 或 Petdex 时，生成目标目录内的 `pet.json`：`id` 为 `toki-bunny-fullbody-handdrawn`、`displayName` 为原名称、`description` 为原描述、`spritesheetPath` 为 `spritesheet.png`、`spriteVersionNumber` 为 `2`。其他 Agent 按其已确认的配置格式适配。配置与正式 PNG 直接位于该宠物目录内，不再额外嵌套同名文件夹；已有宠物须核实版本与哈希。
4. 重新读取配置与图集哈希，核实文件安装。默认保持当前启用选择；只有明确要求时才在目标应用支持的界面或配置中切换，并核实启用结果。Petdex 目录供 Petdex Desktop 或兼容客户端打开，客户端未运行或不支持 v2 时说明尚未启用。

可以直接复制：

> 请读取本包的 README.md 和 pet.json，校验 spritesheet.png 的 SHA-256 与 v2 布局。优先使用我指定或当前 Agent 的目标：支持 v2 的 Codex 安装到 $CODEX_HOME/pets/toki-bunny-fullbody-handdrawn/，未设置时使用 ~/.codex/pets/toki-bunny-fullbody-handdrawn/；其他支持该格式的 Agent 使用从文档或实际配置确认的宠物目录；没有适用的 Agent 或目标客户端仅支持 v1 时使用 ~/.petdex/pets/toki-bunny-fullbody-handdrawn/。保留原始元数据副本并按目标应用规范生成配置，直接安装到 Codex 或 Petdex 时使用 id、displayName、description、spritesheetPath 与 spriteVersionNumber=2。正式 PNG 保持原样，不转换为 v1。完成后报告目标绝对路径、文件安装及实际启用状态，保持当前启用的宠物不变。

复制或解压文件不会自动启用桌宠。`pet.json` 是作品交付元数据，安装时需要按目标应用的配置格式适配；文件安装不依赖 `codex` 命令或 ChatGPT Pets 云端上传工具。

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

所有动图从正式图集的 192×208 格子直接提取，不使用网站高清素材，也不放大或重新绘制。APNG 完整保留原 RGBA，包括半透明边缘；透明 GIF 是兼容版，因格式只支持二值透明，细软边缘以 APNG 为准。73 个正式格子与原播放节奏全部保留。预览用于展示，应用内的动作触发、停留和跟随由目标桌宠应用控制。

## 图集信息

- 名称：**飞鸟马时-兔女郎全身手绘风格**。
- 作品版本：**1.0**。
- 格式：透明 RGBA PNG，**1536×2288**；8 列、11 行，每格 **192×208**。
- 有效帧：`[6,8,8,4,5,8,6,6,6,8,8]`，九个日常状态 57 帧，转椅跟随 16 帧，共 73 格。
- 文件 SHA-256：`f5017eb5170348875f138c8c111697cda27199cc1e73a295e66e4781730db10f`。
- 解码 RGBA SHA-256：`e57901beb4815cae879db41f9731c4657c555ad81e492c2a67786d4eb7bcc406`。

这次透明预览改善只重新导出了仓库内的 GIF、APNG 和静帧，正式图集、`pet.json`、历史 MP4 与 v1.0 Release ZIP 的原始字节均未改变。交付元数据在此前归档时已移除原环境 ID、历史更新和启用状态，并增加作品版本字段，避免把源账号状态误当成新环境的安装结果。

角色来自《碧蓝档案 / Blue Archive》；手绘风格参考为用户确认的 [JAZZ JACK（@JAZZ_JACK_）](https://x.com/JAZZ_JACK_)。桌宠由 AI 辅助生成与后续整理制作，角色和参考作品的权利归相应权利人。完整来源与高清原稿见[作品页面](https://github.com/MIBXR/blue-archive-pets/tree/main/pets/toki-bunny-fullbody-handdrawn)。
