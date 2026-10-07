# 飞鸟马时-兔女郎全身手绘风格 · v1.0

此目录是可携带的 ChatGPT Pets v2 成品。安装图集为 `spritesheet.png`，名称、描述、图集哈希与布局记录在 `pet.json`。

便携 ZIP 只包含一个顶层目录 `toki-bunny-fullbody-handdrawn/`，该目录中的文件与本 `package/` 完全对应，包括本说明、图集、元数据和 `previews/`。

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
| [all-states.gif](previews/all-states.gif) / [all-states.mp4](previews/all-states.mp4) | 九状态与十六方向转椅的完整合集 |
| [states/](previews/states/) | 九个日常状态的独立 GIF |
| [chair-follow.gif](previews/chair-follow.gif) | 十六方向转椅跟随 |
| [idle-bunny-idle.gif](previews/idle-bunny-idle.gif) | 待机、学兔子、返回待机的衔接 |
| [motion-stills.png](previews/motion-stills.png) | 动作静帧合集 |

分状态 GIF 采用 192×208 原尺寸与浅色背景，便于欣赏轮廓；透明 PNG 是安装原件。预览节奏用于展示，应用内的动作触发、停留和跟随由 ChatGPT Pets 控制。

## 图集信息

- 名称：**飞鸟马时-兔女郎全身手绘风格**。
- 作品版本：**1.0**。
- 格式：透明 RGBA PNG，**1536×2288**；8 列、11 行，每格 **192×208**。
- 有效帧：`[6,8,8,4,5,8,6,6,6,8,8]`，九个日常状态 57 帧，转椅跟随 16 帧，共 73 格。
- 文件 SHA-256：`f5017eb5170348875f138c8c111697cda27199cc1e73a295e66e4781730db10f`。
- 解码 RGBA SHA-256：`e57901beb4815cae879db41f9731c4657c555ad81e492c2a67786d4eb7bcc406`。

本次入库没有改变图集或任何预览字节。交付元数据整理时移除了原环境 ID、历史更新和启用状态，并增加作品版本字段，避免把源账号状态误当成新环境的安装结果。

角色来自《碧蓝档案 / Blue Archive》；手绘风格参考为用户确认的 [JAZZ JACK（@JAZZ_JACK_）](https://x.com/JAZZ_JACK_)。桌宠由 AI 辅助生成与后续整理制作，角色和参考作品的权利归相应权利人。完整来源与高清原稿见[作品页面](https://github.com/MIBXR/blue-archive-pets/tree/main/pets/toki-bunny-fullbody-handdrawn)。
