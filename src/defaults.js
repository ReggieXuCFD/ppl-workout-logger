export const DEFAULT_TEMPLATES = [
  {
    id: "push",
    name: "Push",
    exercises: [
      { id: "bench-press", name: "卧推", order: 1 },
      { id: "incline-dumbbell-press", name: "上斜哑铃卧推", order: 2 },
      { id: "shoulder-press", name: "肩推", order: 3 },
      { id: "lateral-raise", name: "侧平举", order: 4 },
      { id: "triceps-pushdown", name: "绳索下压", order: 5 }
    ]
  },
  {
    id: "pull",
    name: "Pull",
    exercises: [
      { id: "pull-up-or-lat-pulldown", name: "引体向上/高位下拉", order: 1 },
      { id: "barbell-row-or-machine-row", name: "杠铃划船/器械划船", order: 2 },
      { id: "seated-row", name: "坐姿划船", order: 3 },
      { id: "face-pull", name: "面拉", order: 4 },
      { id: "biceps-curl", name: "二头弯举", order: 5 }
    ]
  },
  {
    id: "legs",
    name: "Legs",
    exercises: [
      { id: "squat", name: "深蹲", order: 1 },
      { id: "romanian-deadlift", name: "罗马尼亚硬拉", order: 2 },
      { id: "leg-press", name: "腿举", order: 3 },
      { id: "leg-curl", name: "腿弯举", order: 4 },
      { id: "calf-raise", name: "小腿提踵", order: 5 }
    ]
  }
];
