# 制陶拉坯转速节拍对照

一个纯前端的制陶拉坯转速训练工具，帮助学员对照目标转速曲线，通过按键确认节奏，训练稳定控制陶轮转速的能力。

## 功能特性

- 🎯 **目标转速曲线**：可视化展示 RPM 随时间变化的目标曲线
- 🎡 **陶轮动画**：实时旋转的陶轮视觉效果，转速对应目标 RPM
- ⏱️ **进度条时间轴**：清晰显示播放进度、RPM 区间和检查点
- 📊 **实时评分系统**：
  - **Steady**：偏差 ≤ 8%，Streak +1
  - **Drift**：8% < 偏差 ≤ 18%，保持 Streak
  - **Break**：偏差 > 18%，连续 3 次 Streak 清零
- 🏆 **个人最佳记录**：自动保存全局最佳和各片段最佳 Streak
- 📈 **统计分析**：各段 steady 占比、平均偏差、总确认次数
- 📱 **响应式设计**：支持桌面端和移动端
- 🐳 **Docker 部署**：一键构建，静态资源独立服务

## 快速开始

### 方法一：Docker 部署（推荐）

```bash
# 构建镜像
docker build -t pottery-trainer .

# 运行容器
docker run -d --name pottery-trainer -p 8080:80 pottery-trainer

# 访问
# 打开浏览器访问 http://localhost:8080
```

### 方法二：本地直接访问

直接用浏览器打开 `index.html` 文件即可使用。

### 方法三：本地静态服务器

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8080
```

## 使用方法

1. **选择训练片段**：从下拉菜单中选择一个训练片段
2. **开始训练**：点击「开始」按钮或按空格键
3. **节奏确认**：当进度条进入绿色检查点区域时，按空格键确认
4. **查看结果**：实时查看判定结果、Streak 变化和统计数据
5. **完成训练**：播放结束后可查看最终成绩，或点击「重置」重新开始

## 评分规则

| 判定 | 偏差范围 | Streak 变化 |
|------|----------|-------------|
| Steady | ≤ 8% | +1 |
| Drift | 8% ~ 18% | 保持不变 |
| Break | > 18% | 连续 3 次清零 |

## 数据格式说明

所有训练片段数据定义在 `js/data.js` 文件中。

### 片段数据结构

```javascript
{
  id: 'unique-id',           // 唯一标识
  name: '片段名称',          // 显示名称
  description: '描述',       // 片段说明
  duration: 30,              // 总时长（秒）
  rpmCurve: [                // 目标转速曲线
    { time: 0, rpm: 0 },     // 时间点 + 目标 RPM
    { time: 2, rpm: 80 },
    { time: 28, rpm: 80 },
    { time: 30, rpm: 0 }
  ],
  checkpoints: [             // 按键检查点（应在该时段按空格）
    { startTime: 3, endTime: 6, targetRpm: 80 },
    { startTime: 7, endTime: 10, targetRpm: 80 }
  ]
}
```

### 字段说明

- **rpmCurve**：定义 RPM 随时间变化的曲线点，系统会在相邻点之间进行线性插值计算任意时间点的目标 RPM。
  - 建议首尾设置 `rpm: 0` 作为开始和结束的缓冲
  - 曲线点按时间升序排列

- **checkpoints**：定义用户需要按空格键确认的时间段。
  - `startTime`：检查点开始时间
  - `endTime`：检查点结束时间
  - `targetRpm`：该时段的目标 RPM（用于判定）
  - 检查点不要重叠

## 如何替换新片段

### 步骤 1：准备数据

按照上述数据格式准备新的训练片段数据。例如：

```javascript
{
  id: 'custom-01',
  name: '自定义练习 · 我的节奏',
  description: '这是我自定义的训练片段',
  duration: 40,
  rpmCurve: [
    { time: 0, rpm: 0 },
    { time: 3, rpm: 70 },
    { time: 15, rpm: 70 },
    { time: 20, rpm: 110 },
    { time: 35, rpm: 110 },
    { time: 40, rpm: 0 }
  ],
  checkpoints: [
    { startTime: 4, endTime: 7, targetRpm: 70 },
    { startTime: 8, endTime: 11, targetRpm: 70 },
    { startTime: 12, endTime: 15, targetRpm: 70 },
    { startTime: 21, endTime: 24, targetRpm: 110 },
    { startTime: 25, endTime: 28, targetRpm: 110 },
    { startTime: 29, endTime: 32, targetRpm: 110 }
  ]
}
```

### 步骤 2：添加到数据文件

编辑 `js/data.js`，将新片段对象添加到 `SEGMENT_DATA` 数组中：

```javascript
const SEGMENT_DATA = [
  // ... 原有片段 ...
  {
    id: 'custom-01',
    // ... 新片段数据 ...
  }
];
```

### 步骤 3：验证

刷新页面，在下拉菜单中应该能看到新添加的片段。选择并开始训练即可。

### 设计建议

1. **时长适中**：建议 30-60 秒，过长容易疲劳
2. **RPM 曲线平滑**：避免 RPM 突变，模拟真实拉坯过程
3. **检查点分布合理**：每个 RPM 稳定段设置 2-3 个检查点
4. **难度递进**：从恒定转速开始，逐步增加变速段
5. **首尾缓冲**：开始和结束各留 2-3 秒的 0 RPM 缓冲期

## 项目结构

```
/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 核心逻辑
│   └── data.js             # 训练片段数据
├── Dockerfile              # Docker 构建配置
├── nginx.conf              # Nginx 配置
└── README.md               # 使用说明
```

## 技术栈

- **纯前端**：HTML5 + CSS3 + Vanilla JavaScript（无框架依赖）
- **动画**：CSS Animation + requestAnimationFrame + SVG
- **数据存储**：localStorage
- **部署**：Nginx + Docker

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 快捷键

| 按键 | 功能 |
|------|------|
| 空格 | 开始播放 / 确认节奏 |

## 许可证

MIT License
