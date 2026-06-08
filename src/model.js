import { DEFAULT_TEMPLATES } from "./defaults.js";

export function createInitialState() {
  return {
    templates: clone(DEFAULT_TEMPLATES),
    workouts: []
  };
}

export function createWorkoutDraft(state, templateId, date = todayString()) {
  const template = findTemplate(state, templateId);

  return {
    id: `${date}-${template.id}`,
    date,
    templateId: template.id,
    templateName: template.name,
    exercises: sortedExercises(template.exercises).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: []
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function addSet(workout, exerciseId, set) {
  return mapWorkoutExercise(workout, exerciseId, (exercise) => ({
    ...exercise,
    sets: [...exercise.sets, normalizeSet(set)]
  }));
}

export function updateSet(workout, exerciseId, setIndex, set) {
  return mapWorkoutExercise(workout, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((currentSet, index) =>
      index === setIndex ? normalizeSet({ ...currentSet, ...set }) : currentSet
    )
  }));
}

export function copyPreviousSet(workout, exerciseId) {
  const exercise = workout.exercises.find((item) => item.id === exerciseId);
  if (!exercise || exercise.sets.length === 0) {
    return addSet(workout, exerciseId, { weight: 0, reps: 0 });
  }

  return addSet(workout, exerciseId, exercise.sets.at(-1));
}

export function deleteSet(workout, exerciseId, setIndex) {
  return mapWorkoutExercise(workout, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.filter((_, index) => index !== setIndex)
  }));
}

export function addExerciseToWorkout(workout, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return workout;

  return touchWorkout({
    ...workout,
    exercises: [
      ...workout.exercises,
      {
        id: uniqueId(trimmedName, workout.exercises),
        name: trimmedName,
        sets: []
      }
    ]
  });
}

export function addExerciseToTemplate(state, templateId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return state;

  return mapTemplate(state, templateId, (template) => ({
    ...template,
    exercises: [
      ...template.exercises,
      {
        id: uniqueId(trimmedName, template.exercises),
        name: trimmedName,
        order: template.exercises.length + 1
      }
    ]
  }));
}

export function renameTemplateExercise(state, templateId, exerciseId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return state;

  return mapTemplate(state, templateId, (template) => ({
    ...template,
    exercises: template.exercises.map((exercise) =>
      exercise.id === exerciseId ? { ...exercise, name: trimmedName } : exercise
    )
  }));
}

export function removeTemplateExercise(state, templateId, exerciseId) {
  return mapTemplate(state, templateId, (template) => ({
    ...template,
    exercises: normalizeOrder(template.exercises.filter((exercise) => exercise.id !== exerciseId))
  }));
}

export function moveTemplateExercise(state, templateId, exerciseId, direction) {
  return mapTemplate(state, templateId, (template) => {
    const exercises = sortedExercises(template.exercises);
    const index = exercises.findIndex((exercise) => exercise.id === exerciseId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= exercises.length) {
      return template;
    }

    const nextExercises = [...exercises];
    const [exercise] = nextExercises.splice(index, 1);
    nextExercises.splice(nextIndex, 0, exercise);
    return { ...template, exercises: normalizeOrder(nextExercises) };
  });
}

export function saveWorkout(state, workout) {
  const savedWorkout = touchWorkout(workout);
  const otherWorkouts = state.workouts.filter((item) => item.id !== savedWorkout.id);
  return {
    ...state,
    workouts: [...otherWorkouts, clone(savedWorkout)].sort((a, b) => a.date.localeCompare(b.date))
  };
}

function findTemplate(state, templateId) {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return template;
}

function mapTemplate(state, templateId, mapper) {
  return {
    ...state,
    templates: state.templates.map((template) =>
      template.id === templateId ? mapper(template) : template
    )
  };
}

function mapWorkoutExercise(workout, exerciseId, mapper) {
  return touchWorkout({
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === exerciseId ? mapper(exercise) : exercise
    )
  });
}

function normalizeSet(set) {
  return {
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0
  };
}

function normalizeOrder(exercises) {
  return exercises.map((exercise, index) => ({ ...exercise, order: index + 1 }));
}

function sortedExercises(exercises) {
  return [...exercises].sort((a, b) => a.order - b.order);
}

function touchWorkout(workout) {
  return {
    ...workout,
    updatedAt: new Date().toISOString()
  };
}

function uniqueId(name, existingItems) {
  const base = slugify(name);
  const existing = new Set(existingItems.map((item) => item.id));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

function slugify(value) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || `exercise-${Math.random().toString(36).slice(2, 8)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
