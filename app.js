let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let aggressiveIntervals = JSON.parse(localStorage.getItem("aggressiveSRI") || "[1,2,4,7]");
let relaxedIntervals = JSON.parse(localStorage.getItem("relaxedSRI") || "[3,6,12,21]");
const standardIntervals = [1, 3, 7, 14, 21];

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("taskDate");
  if (dateInput) dateInput.value = today;

  if (document.getElementById("revisionTasks")) renderTodayTasks(today);
  if (document.getElementById("allTasks")) renderAllTasks();
  if (document.getElementById("aggressiveInput")) {
    document.getElementById("aggressiveInput").value = aggressiveIntervals.join(",");
    document.getElementById("relaxedInput").value = relaxedIntervals.join(",");
  }
});

function addTask() {
  const title = document.getElementById("taskTitle").value;
  const details = document.getElementById("taskDetails").value;
  const date = document.getElementById("taskDate").value;
  const regime = document.getElementById("sriRegime").value;

  if (!title || !date) return alert("Title and Date required");

  let intervals = regime === "standard" ? standardIntervals :
                  regime === "aggressive" ? aggressiveIntervals : relaxedIntervals;

  const newTask = {
    title, details, date, regime,
    revisions: intervals.map(days => ({
      due: getFutureDate(date, days),
      done: false
    }))
  };

  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  location.reload();
}

function getFutureDate(base, days) {
  let d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function renderTodayTasks(today) {
  const revContainer = document.getElementById("revisionTasks");
  const dailyContainer = document.getElementById("dailyTasks");

  tasks.forEach((task, i) => {
    task.revisions.forEach((rev, j) => {
      if (rev.due === today) {
        const div = document.createElement("div");
        div.className = `task-item ${rev.done ? "done" : ""}`;
        div.innerHTML = `
          <div class="task-content" onclick="toggleDetails(this, '${task.details}')">${task.title}</div>
          <input type="checkbox" class="checkbox" ${rev.done ? "checked" : ""} onchange="toggleRevision(${i}, ${j}, this)">
        `;
        revContainer.appendChild(div);
      }
    });

    if (task.date === today) {
      const div = document.createElement("div");
      div.className = "task-item";
      div.textContent = task.title;
      div.onclick = () => alert(task.details);
      dailyContainer.appendChild(div);
    }
  });
}

function toggleDetails(el, details) {
  el.innerHTML = el.innerHTML === details ? el.dataset.title : details;
}

function toggleRevision(i, j, checkbox) {
  tasks[i].revisions[j].done = checkbox.checked;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  location.reload();
}

function renderAllTasks() {
  const container = document.getElementById("allTasks");
  let grouped = {};

  tasks.forEach((task, i) => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push({ ...task, index: i });
  });

  Object.keys(grouped).sort().forEach(date => {
    const section = document.createElement("div");
    section.innerHTML = `<h3>${date}</h3>`;
    grouped[date].forEach(task => {
      const div = document.createElement("div");
      div.className = "task-item";
      div.innerHTML = `
        <div class="task-content" onclick="toggleDetails(this, '${task.details}')">${task.title}</div>
        <button onclick="deleteTask(${task.index})">Delete</button>
      `;
      section.appendChild(div);
    });
    container.appendChild(section);
  });
}

function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  location.reload();
}

function resetAllTasks() {
  if (confirm("Delete all tasks?")) {
    localStorage.removeItem("tasks");
    location.reload();
  }
}

function downloadTasks() {
  const blob = new Blob([JSON.stringify(tasks)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks_backup.txt";
  a.click();
}

function uploadTasks() {
  document.getElementById("uploadFile").click();
}

function handleFileUpload(e) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error();
      tasks = parsed;
      localStorage.setItem("tasks", JSON.stringify(tasks));
      location.reload();
    } catch {
      alert("Invalid file format.");
    }
  };
  reader.readAsText(e.target.files[0]);
}

function saveSRIConfig() {
  try {
    aggressiveIntervals = document.getElementById("aggressiveInput").value.split(",").map(Number);
    relaxedIntervals = document.getElementById("relaxedInput").value.split(",").map(Number);
    localStorage.setItem("aggressiveSRI", JSON.stringify(aggressiveIntervals));
    localStorage.setItem("relaxedSRI", JSON.stringify(relaxedIntervals));
    alert("SRI Regimes updated!");
  } catch {
    alert("Invalid intervals. Please enter numbers separated by commas.");
  }
}
