const tabBtns = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

let activeTab = "paste";

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    document.getElementById(`${activeTab}-panel`).classList.add("active");
  });
});

function setStatus(msg, isError = true) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#b03a2e" : "#4a7c59";
}

function renderList(elId, items) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    if (el.classList.contains("copy-list")) {
      li.addEventListener("click", () => {
        navigator.clipboard.writeText(item);
        li.style.borderColor = "#4a7c59";
        setTimeout(() => (li.style.borderColor = ""), 600);
      });
    }
    el.appendChild(li);
  });
}

function renderResults(data) {
  document.getElementById("summary").textContent = data.summary || "";
  document.getElementById("notes").textContent = data.notes || "";
  renderList("primaryTitles", data.primary_titles);
  renderList("adjacentTitles", data.adjacent_titles);
  renderList("skillKeywords", data.skill_keywords);
  renderList("linkedinSearches", data.linkedin_boolean_searches);
  renderList("googleSearches", data.google_xray_searches);
  resultsEl.classList.remove("hidden");
}

analyzeBtn.addEventListener("click", async () => {
  setStatus("");
  resultsEl.classList.add("hidden");
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";

  try {
    let response;
    if (activeTab === "paste") {
      const resumeText = document.getElementById("resumeText").value.trim();
      if (resumeText.length < 50) {
        throw new Error("Please paste more resume text (at least a few sentences).");
      }
      response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
    } else {
      const fileInput = document.getElementById("resumeFile");
      if (!fileInput.files.length) throw new Error("Please choose a file first.");
      const formData = new FormData();
      formData.append("resume", fileInput.files[0]);
      response = await fetch("/api/analyze-file", { method: "POST", body: formData });
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    renderResults(data);
  } catch (err) {
    setStatus(err.message);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Generate search terms";
  }
});
