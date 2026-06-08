import { exportWorkoutsCsv, exportWorkoutsJson } from "./exporters.js";
import {
  addExerciseToTemplate,
  addExerciseToWorkout,
  addSet,
  copyPreviousSet,
  createWorkoutDraft,
  deleteSet,
  moveTemplateExercise,
  removeTemplateExercise,
  renameTemplateExercise,
  saveWorkout,
  updateSet
} from "./model.js";
import { loadState, saveState } from "./storage.js";

const app = document.querySelector("#app");
const notice = document.querySelector("#notice");
const title = document.querySelector("#screen-title");
const navButtons = [...document.querySelectorAll(".nav-button")];

let state = loadState();
let screen = "today";
let activeWorkout = null;
let exportMode = "json";

if (state.warning) {
  showNotice(state.warning);
}

render();
registerServiceWorker();

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-screen]");
  if (!target) return;

  if (target.dataset.screen) {
    screen = target.dataset.screen;
    render();
    return;
  }

  const action = target.dataset.action;
  const exerciseId = target.dataset.exerciseId;
  const templateId = target.dataset.templateId;

  if (action === "start-workout") {
    startWorkout(templateId);
  }

  if (action === "cancel-workout") {
    activeWorkout = null;
    render();
  }

  if (action === "add-set") {
    activeWorkout = addSet(activeWorkout, exerciseId, { weight: 0, reps: 0 });
    renderToday();
  }

  if (action === "copy-set") {
    activeWorkout = copyPreviousSet(activeWorkout, exerciseId);
    renderToday();
  }

  if (action === "delete-set") {
    activeWorkout = deleteSet(activeWorkout, exerciseId, Number(target.dataset.setIndex));
    renderToday();
  }

  if (action === "save-workout") {
    state = saveWorkout(state, activeWorkout);
    saveState(state);
    showNotice("训练已保存。");
    renderToday();
  }

  if (action === "add-workout-exercise-to-template") {
    const exercise = activeWorkout.exercises.find((item) => item.id === exerciseId);
    if (exercise) {
      state = addExerciseToTemplate(state, activeWorkout.templateId, exercise.name);
      saveState(state);
      showNotice("已加入当前模板。");
      renderToday();
    }
  }

  if (action === "remove-template-exercise") {
    state = removeTemplateExercise(state, templateId, exerciseId);
    saveState(state);
    renderTemplates();
  }

  if (action === "move-template-exercise") {
    state = moveTemplateExercise(state, templateId, exerciseId, Number(target.dataset.direction));
    saveState(state);
    renderTemplates();
  }

  if (action === "export-json") {
    exportMode = "json";
    renderExport();
  }

  if (action === "export-csv") {
    exportMode = "csv";
    renderExport();
  }

  if (action === "download-export") {
    downloadExport();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target.dataset.action === "update-set") {
    activeWorkout = updateSet(
      activeWorkout,
      target.dataset.exerciseId,
      Number(target.dataset.setIndex),
      { [target.dataset.field]: target.value }
    );
  }

  if (target.dataset.action === "rename-template-exercise") {
    state = renameTemplateExercise(
      state,
      target.dataset.templateId,
      target.dataset.exerciseId,
      target.value
    );
    saveState(state);
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  if (form.dataset.action === "add-workout-exercise") {
    activeWorkout = addExerciseToWorkout(activeWorkout, String(formData.get("exerciseName") || ""));
    form.reset();
    renderToday();
  }

  if (form.dataset.action === "add-template-exercise") {
    state = addExerciseToTemplate(
      state,
      form.dataset.templateId,
      String(formData.get("exerciseName") || "")
    );
    saveState(state);
    form.reset();
    renderTemplates();
  }
});

function render() {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screen);
  });

  if (screen === "today") renderToday();
  if (screen === "templates") renderTemplates();
  if (screen === "export") renderExport();
}

function renderToday() {
  title.textContent = "Today";
  if (!activeWorkout) {
    app.innerHTML = `
      <div class="template-grid">
        ${state.templates.map(renderStartTemplate).join("")}
      </div>
      ${renderRecentWorkouts()}
    `;
    return;
  }

  app.innerHTML = `
    <section class="workout-summary">
      <div>
        <p class="section-label">${activeWorkout.date}</p>
        <h2>${escapeHtml(activeWorkout.templateName)}</h2>
      </div>
      <button class="secondary-button" type="button" data-action="cancel-workout">换模板</button>
    </section>

    <div class="exercise-list">
      ${activeWorkout.exercises.map(renderWorkoutExercise).join("")}
    </div>

    <form class="inline-form" data-action="add-workout-exercise">
      <input name="exerciseName" type="text" placeholder="临时加一个动作" autocomplete="off">
      <button class="secondary-button" type="submit">添加</button>
    </form>

    <button class="primary-button full-width" type="button" data-action="save-workout">保存今天训练</button>
  `;
}

function renderTemplates() {
  title.textContent = "Templates";
  app.innerHTML = `
    <div class="template-list">
      ${state.templates.map(renderTemplateEditor).join("")}
    </div>
  `;
}

function renderExport() {
  title.textContent = "Export";
  const output =
    exportMode === "json" ? exportWorkoutsJson(state.workouts) : exportWorkoutsCsv(state.workouts);

  app.innerHTML = `
    <section class="panel">
      <p class="section-label">Saved workouts</p>
      <h2>${state.workouts.length}</h2>
      <div class="button-row">
        <button class="secondary-button ${exportMode === "json" ? "selected" : ""}" type="button" data-action="export-json">JSON</button>
        <button class="secondary-button ${exportMode === "csv" ? "selected" : ""}" type="button" data-action="export-csv">CSV</button>
        <button class="primary-button" type="button" data-action="download-export">下载</button>
      </div>
      <textarea class="export-box" readonly wrap="off">${escapeHtml(output)}</textarea>
    </section>
  `;
}

function renderStartTemplate(template) {
  return `
    <button class="template-card" type="button" data-action="start-workout" data-template-id="${template.id}">
      <span>${escapeHtml(template.name)}</span>
      <small>${template.exercises.length} 个动作</small>
    </button>
  `;
}

function renderRecentWorkouts() {
  const recent = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (recent.length === 0) {
    return `<section class="empty-state">还没有训练记录。今天存第一条。</section>`;
  }

  return `
    <section class="panel">
      <p class="section-label">Recent</p>
      <div class="recent-list">
        ${recent
          .map(
            (workout) => `
              <div class="recent-item">
                <strong>${workout.date}</strong>
                <span>${escapeHtml(workout.templateName)}</span>
                <small>${workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} 组</small>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWorkoutExercise(exercise) {
  return `
    <article class="exercise-card">
      <div class="exercise-header">
        <h3>${escapeHtml(exercise.name)}</h3>
        <button class="secondary-button small-button" type="button" data-action="add-workout-exercise-to-template" data-exercise-id="${exercise.id}">入模板</button>
      </div>
      <div class="set-list">
        ${exercise.sets.length === 0 ? `<p class="muted">还没有组。</p>` : ""}
        ${exercise.sets.map((set, index) => renderSetRow(exercise.id, set, index)).join("")}
      </div>
      <div class="button-row">
        <button class="secondary-button" type="button" data-action="add-set" data-exercise-id="${exercise.id}">加一组</button>
        <button class="secondary-button" type="button" data-action="copy-set" data-exercise-id="${exercise.id}">复制上一组</button>
      </div>
    </article>
  `;
}

function renderSetRow(exerciseId, set, index) {
  return `
    <div class="set-row">
      <span class="set-index">${index + 1}</span>
      <label>
        <span>kg</span>
        <input inputmode="decimal" type="number" step="0.5" min="0" value="${set.weight}" data-action="update-set" data-field="weight" data-exercise-id="${exerciseId}" data-set-index="${index}">
      </label>
      <label>
        <span>reps</span>
        <input inputmode="numeric" type="number" step="1" min="0" value="${set.reps}" data-action="update-set" data-field="reps" data-exercise-id="${exerciseId}" data-set-index="${index}">
      </label>
      <button class="icon-button" type="button" aria-label="删除第 ${index + 1} 组" data-action="delete-set" data-exercise-id="${exerciseId}" data-set-index="${index}">×</button>
    </div>
  `;
}

function renderTemplateEditor(template) {
  return `
    <section class="panel">
      <div class="template-heading">
        <h2>${escapeHtml(template.name)}</h2>
        <span>${template.exercises.length} 个动作</span>
      </div>
      <div class="template-exercises">
        ${template.exercises.map((exercise) => renderTemplateExercise(template.id, exercise)).join("")}
      </div>
      <form class="inline-form" data-action="add-template-exercise" data-template-id="${template.id}">
        <input name="exerciseName" type="text" placeholder="添加常用动作" autocomplete="off">
        <button class="secondary-button" type="submit">添加</button>
      </form>
    </section>
  `;
}

function renderTemplateExercise(templateId, exercise) {
  return `
    <div class="template-exercise-row">
      <input type="text" value="${escapeHtml(exercise.name)}" data-action="rename-template-exercise" data-template-id="${templateId}" data-exercise-id="${exercise.id}">
      <button class="icon-button" type="button" aria-label="上移" data-action="move-template-exercise" data-template-id="${templateId}" data-exercise-id="${exercise.id}" data-direction="-1">↑</button>
      <button class="icon-button" type="button" aria-label="下移" data-action="move-template-exercise" data-template-id="${templateId}" data-exercise-id="${exercise.id}" data-direction="1">↓</button>
      <button class="icon-button" type="button" aria-label="删除" data-action="remove-template-exercise" data-template-id="${templateId}" data-exercise-id="${exercise.id}">×</button>
    </div>
  `;
}

function startWorkout(templateId) {
  const date = localDateString();
  const workoutId = `${date}-${templateId}`;
  const existingWorkout = state.workouts.find((workout) => workout.id === workoutId);
  activeWorkout = existingWorkout
    ? JSON.parse(JSON.stringify(existingWorkout))
    : createWorkoutDraft(state, templateId, date);
  renderToday();
}

function downloadExport() {
  const content =
    exportMode === "json" ? exportWorkoutsJson(state.workouts) : exportWorkoutsCsv(state.workouts);
  const type = exportMode === "json" ? "application/json" : "text/csv";
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ppl-workouts.${exportMode}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function showNotice(message) {
  notice.textContent = message;
  notice.classList.remove("hidden");
  window.setTimeout(() => notice.classList.add("hidden"), 2600);
}

function localDateString() {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
