import assert from "node:assert/strict";
import test from "node:test";

import {
  addExerciseToTemplate,
  addExerciseToWorkout,
  addSet,
  copyPreviousSet,
  createInitialState,
  createWorkoutDraft,
  deleteSet,
  moveTemplateExercise,
  removeTemplateExercise,
  renameTemplateExercise,
  saveWorkout,
  updateSet
} from "../src/model.js";

test("first launch creates editable Push Pull Legs templates", () => {
  const state = createInitialState();

  assert.deepEqual(
    state.templates.map((template) => template.id),
    ["push", "pull", "legs"]
  );
  assert.equal(state.templates[0].name, "Push");
  assert.equal(state.templates[0].exercises[0].name, "卧推");
  assert.equal(state.workouts.length, 0);
});

test("creating a workout draft copies template exercises", () => {
  const state = createInitialState();
  const workout = createWorkoutDraft(state, "push", "2026-06-08");

  assert.equal(workout.id, "2026-06-08-push");
  assert.equal(workout.templateName, "Push");
  assert.equal(workout.exercises.length, state.templates[0].exercises.length);
  assert.deepEqual(workout.exercises[0], {
    id: "bench-press",
    name: "卧推",
    sets: []
  });

  workout.exercises[0].name = "Changed in draft";
  assert.equal(state.templates[0].exercises[0].name, "卧推");
});

test("adding updating copying and deleting sets changes only the workout", () => {
  const state = createInitialState();
  const draft = createWorkoutDraft(state, "push", "2026-06-08");
  const withSet = addSet(draft, "bench-press", { weight: 60, reps: 8 });
  const updated = updateSet(withSet, "bench-press", 0, { weight: 62.5, reps: 6 });
  const copied = copyPreviousSet(updated, "bench-press");
  const deleted = deleteSet(copied, "bench-press", 0);

  assert.deepEqual(draft.exercises[0].sets, []);
  assert.deepEqual(withSet.exercises[0].sets, [{ weight: 60, reps: 8 }]);
  assert.deepEqual(updated.exercises[0].sets, [{ weight: 62.5, reps: 6 }]);
  assert.deepEqual(copied.exercises[0].sets, [
    { weight: 62.5, reps: 6 },
    { weight: 62.5, reps: 6 }
  ]);
  assert.deepEqual(deleted.exercises[0].sets, [{ weight: 62.5, reps: 6 }]);
});

test("temporary workout exercise can be added to the selected template", () => {
  const state = createInitialState();
  const draft = createWorkoutDraft(state, "pull", "2026-06-08");
  const withExercise = addExerciseToWorkout(draft, "单臂哑铃划船");
  const nextState = addExerciseToTemplate(state, "pull", "单臂哑铃划船");

  assert.equal(withExercise.exercises.at(-1).name, "单臂哑铃划船");
  assert.deepEqual(withExercise.exercises.at(-1).sets, []);
  assert.equal(nextState.templates[1].exercises.at(-1).name, "单臂哑铃划船");
  assert.equal(state.templates[1].exercises.at(-1).name, "二头弯举");
});

test("template exercises can be renamed removed and reordered", () => {
  const state = createInitialState();
  const renamed = renameTemplateExercise(state, "legs", "squat", "哈克深蹲");
  const moved = moveTemplateExercise(renamed, "legs", "squat", 1);
  const removed = removeTemplateExercise(moved, "legs", "calf-raise");
  const legs = removed.templates.find((template) => template.id === "legs");

  assert.equal(renamed.templates[2].exercises[0].name, "哈克深蹲");
  assert.equal(moved.templates[2].exercises[0].id, "romanian-deadlift");
  assert.equal(moved.templates[2].exercises[1].id, "squat");
  assert.equal(legs.exercises.some((exercise) => exercise.id === "calf-raise"), false);
});

test("saving a workout stores it in history and replaces same-day template entry", () => {
  const state = createInitialState();
  const draft = createWorkoutDraft(state, "push", "2026-06-08");
  const first = addSet(draft, "bench-press", { weight: 60, reps: 8 });
  const saved = saveWorkout(state, first);
  const changed = updateSet(first, "bench-press", 0, { weight: 65, reps: 5 });
  const resaved = saveWorkout(saved, changed);

  assert.equal(saved.workouts.length, 1);
  assert.equal(resaved.workouts.length, 1);
  assert.deepEqual(resaved.workouts[0].exercises[0].sets, [{ weight: 65, reps: 5 }]);
});
