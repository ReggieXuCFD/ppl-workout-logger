import assert from "node:assert/strict";
import test from "node:test";

import { exportWorkoutsCsv, exportWorkoutsJson } from "../src/exporters.js";

const workouts = [
  {
    id: "2026-06-08-push",
    date: "2026-06-08",
    templateId: "push",
    templateName: "Push",
    exercises: [
      {
        id: "bench-press",
        name: "卧推",
        sets: [
          { weight: 60, reps: 8 },
          { weight: 62.5, reps: 6 }
        ]
      },
      {
        id: "incline",
        name: "Incline, Dumbbell Press",
        sets: [{ weight: 24, reps: 10 }]
      }
    ]
  }
];

test("JSON export preserves workout structure", () => {
  const exported = JSON.parse(exportWorkoutsJson(workouts));

  assert.deepEqual(exported, [
    {
      date: "2026-06-08",
      template: "Push",
      exercises: [
        {
          name: "卧推",
          sets: [
            { weight: 60, reps: 8 },
            { weight: 62.5, reps: 6 }
          ]
        },
        {
          name: "Incline, Dumbbell Press",
          sets: [{ weight: 24, reps: 10 }]
        }
      ]
    }
  ]);
});

test("CSV export flattens each set into one row and quotes commas", () => {
  const exported = exportWorkoutsCsv(workouts);

  assert.equal(
    exported,
    [
      "date,template,exercise,set_index,weight,reps",
      "2026-06-08,Push,卧推,1,60,8",
      "2026-06-08,Push,卧推,2,62.5,6",
      "2026-06-08,Push,\"Incline, Dumbbell Press\",1,24,10"
    ].join("\n")
  );
});
