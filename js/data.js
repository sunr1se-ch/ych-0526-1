const SEGMENT_DATA = [
  {
    id: 'beginner-01',
    name: '入门练习 · 恒定转速',
    description: '适合初学者熟悉节奏，保持 80 RPM 恒定转速 30 秒',
    duration: 30,
    rpmCurve: [
      { time: 0, rpm: 0 },
      { time: 2, rpm: 80 },
      { time: 28, rpm: 80 },
      { time: 30, rpm: 0 }
    ],
    checkpoints: [
      { startTime: 3, endTime: 6, targetRpm: 80 },
      { startTime: 7, endTime: 10, targetRpm: 80 },
      { startTime: 11, endTime: 14, targetRpm: 80 },
      { startTime: 15, endTime: 18, targetRpm: 80 },
      { startTime: 19, endTime: 22, targetRpm: 80 },
      { startTime: 23, endTime: 26, targetRpm: 80 }
    ]
  },
  {
    id: 'intermediate-01',
    name: '进阶练习 · 变速拉坯',
    description: '模拟实际拉坯过程，从低速到高速再回到低速',
    duration: 45,
    rpmCurve: [
      { time: 0, rpm: 0 },
      { time: 3, rpm: 60 },
      { time: 10, rpm: 60 },
      { time: 15, rpm: 100 },
      { time: 25, rpm: 100 },
      { time: 30, rpm: 70 },
      { time: 40, rpm: 70 },
      { time: 45, rpm: 0 }
    ],
    checkpoints: [
      { startTime: 4, endTime: 7, targetRpm: 60 },
      { startTime: 8, endTime: 11, targetRpm: 60 },
      { startTime: 16, endTime: 19, targetRpm: 100 },
      { startTime: 20, endTime: 23, targetRpm: 100 },
      { startTime: 31, endTime: 34, targetRpm: 70 },
      { startTime: 35, endTime: 38, targetRpm: 70 }
    ]
  },
  {
    id: 'advanced-01',
    name: '高级练习 · 复杂节奏',
    description: '多段变速，考验对不同转速的快速适应能力',
    duration: 60,
    rpmCurve: [
      { time: 0, rpm: 0 },
      { time: 2, rpm: 50 },
      { time: 8, rpm: 50 },
      { time: 12, rpm: 90 },
      { time: 20, rpm: 90 },
      { time: 24, rpm: 120 },
      { time: 32, rpm: 120 },
      { time: 36, rpm: 80 },
      { time: 44, rpm: 80 },
      { time: 48, rpm: 60 },
      { time: 56, rpm: 60 },
      { time: 60, rpm: 0 }
    ],
    checkpoints: [
      { startTime: 3, endTime: 5, targetRpm: 50 },
      { startTime: 6, endTime: 8, targetRpm: 50 },
      { startTime: 13, endTime: 16, targetRpm: 90 },
      { startTime: 17, endTime: 20, targetRpm: 90 },
      { startTime: 25, endTime: 28, targetRpm: 120 },
      { startTime: 29, endTime: 32, targetRpm: 120 },
      { startTime: 37, endTime: 40, targetRpm: 80 },
      { startTime: 41, endTime: 44, targetRpm: 80 },
      { startTime: 49, endTime: 52, targetRpm: 60 },
      { startTime: 53, endTime: 56, targetRpm: 60 }
    ]
  }
];

const JUDGMENT_THRESHOLDS = {
  STEADY: 8,
  DRIFT: 18
};

const STORAGE_KEYS = {
  BEST_STREAK: 'pottery_trainer_best_streak',
  BEST_STREAK_BY_SEGMENT: 'pottery_trainer_best_by_segment'
};
