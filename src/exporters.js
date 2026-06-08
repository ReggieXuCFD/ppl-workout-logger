export function exportWorkoutsJson(workouts) {
  const payload = workouts.map((workout) => ({
    date: workout.date,
    template: workout.templateName,
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((set) => ({
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0
      }))
    }))
  }));

  return JSON.stringify(payload, null, 2);
}

export function exportWorkoutsCsv(workouts) {
  const rows = [["date", "template", "exercise", "set_index", "weight", "reps"]];

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set, index) => {
        rows.push([
          workout.date,
          workout.templateName,
          exercise.name,
          String(index + 1),
          formatNumber(set.weight),
          formatNumber(set.reps)
        ]);
      });
    });
  });

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function formatNumber(value) {
  return String(Number(value) || 0);
}

function escapeCsvCell(value) {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}
