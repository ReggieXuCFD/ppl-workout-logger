# PPL Workout Logger

个人用的安卓手机优先 PWA 健身记录器，用来快速记录 Push / Pull / Legs 训练、编辑常用动作模板，并导出 JSON/CSV 给大模型或表格分析。

## 功能

- Push / Pull / Legs 默认模板
- 默认动作可编辑、可新增、可删除、可排序
- 今日训练按模板生成
- 每组记录重量和次数
- 支持复制上一组
- 支持保存当天训练历史
- 支持 JSON 和 CSV 导出
- 支持 PWA 安装和基础离线缓存

## 本地运行

```bash
python3 -m http.server 4174
```

然后打开：

```text
http://127.0.0.1:4174
```

## 测试

```bash
node --test
```

## 数据说明

数据保存在浏览器本地 `localStorage` 中。换设备或清浏览器数据前，请先在 Export 页面导出 JSON 或 CSV。
