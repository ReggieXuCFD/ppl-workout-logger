import { createInitialState } from "./model.js";

const STATE_KEY = "ppl-workout-logger-state-v1";
const BACKUP_KEY = "ppl-workout-logger-malformed-backup";

export function loadState() {
  const stored = window.localStorage.getItem(STATE_KEY);
  if (!stored) {
    const initialState = createInitialState();
    saveState(initialState);
    return initialState;
  }

  try {
    const parsed = JSON.parse(stored);
    if (isValidState(parsed)) {
      return parsed;
    }
    throw new Error("Stored state has an invalid shape");
  } catch (error) {
    window.localStorage.setItem(BACKUP_KEY, stored);
    const initialState = createInitialState();
    saveState(initialState);
    return {
      ...initialState,
      warning: "本地数据格式异常，已备份并重置为默认模板。"
    };
  }
}

export function saveState(state) {
  const cleanState = {
    templates: state.templates,
    workouts: state.workouts
  };
  window.localStorage.setItem(STATE_KEY, JSON.stringify(cleanState));
}

export function resetState() {
  const initialState = createInitialState();
  saveState(initialState);
  return initialState;
}

function isValidState(value) {
  return (
    value &&
    Array.isArray(value.templates) &&
    Array.isArray(value.workouts) &&
    value.templates.every(
      (template) =>
        typeof template.id === "string" &&
        typeof template.name === "string" &&
        Array.isArray(template.exercises)
    )
  );
}
