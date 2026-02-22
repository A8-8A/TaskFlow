const baseUrl = "/api/tasks";

function getAllTasks() {
    fetch(baseUrl)
        .then(response => response.json())
        .then(data => {
            document.getElementById("output").textContent = JSON.stringify(data, null, 2);
            renderTable(data);
            updateCount(data.length);
            setHint(false);
        })
        .catch(error => {
            document.getElementById("output").textContent = "Error: " + error;
        });
}

function getTaskById() {
    const id = document.getElementById("taskId").value.trim();
    if (!id) { alert("Please enter a Task ID"); return; }
    getTaskByIdFromTable(id);
}

function getTaskByIdFromTable(id) {
    fetch(`${baseUrl}/${id}`)
        .then(async response => {
            const text = await response.text();
            if (!response.ok) throw new Error(text || "Not found");
            return text ? JSON.parse(text) : {};
        })
        .then(task => {
            document.getElementById("output").textContent = JSON.stringify(task, null, 2);
            renderTable([task]);
            updateCount(1);
            setHint(false);
        })
        .catch(error => {
            document.getElementById("output").textContent = "Error: " + error.message;
        });
}

function saveTask() {
    const taskName = document.getElementById("c_taskName").value.trim();
    if (!taskName) { alert("Task Name is required"); return; }

    const payload = {
        taskName,
        description: document.getElementById("c_description").value.trim(),
        assignedUser: document.getElementById("c_assignedUser").value.trim(),
        dueDate: document.getElementById("c_dueDate").value || null,
        priority: document.getElementById("c_priority").value,
        status: document.getElementById("c_status").value
    };

    const editId = document.getElementById("edit_id").value;
    const url    = editId ? `${baseUrl}/${editId}` : baseUrl;
    const method = editId ? "PUT" : "POST";

    fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        const text = await response.text();
        if (!response.ok) throw new Error(text || "Save failed");
        return text ? JSON.parse(text) : {};
    })
    .then(data => {
        document.getElementById("output").textContent = JSON.stringify(data, null, 2);
        cancelEdit();
        renderTable([data]);
        updateCount(1);
        setHint(false);
    })
    .catch(error => {
        document.getElementById("output").textContent = "Error: " + error.message;
    });
}

function priorityBadge(p) {
    const map = {
        LOW:    ['badge-low',    'Low'],
        MEDIUM: ['badge-medium', 'Medium'],
        HIGH:   ['badge-high',   'High']
    };
    const [cls, label] = map[p] || ['badge-medium', p || '-'];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function statusBadge(s) {
    const map = {
        TODO:        ['status-todo',       'To Do'],
        IN_PROGRESS: ['status-inprogress', 'In Progress'],
        DONE:        ['status-done',       'Done']
    };
    const [cls, label] = map[s] || ['status-todo', s || '-'];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function renderTable(tasks) {
    const body = document.getElementById("tasksBody");

    if (!Array.isArray(tasks) || tasks.length === 0) {
        body.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                        <p>No tasks found</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    body.innerHTML = tasks.map(t => `
        <tr class="data-row" id="row-${t.id}">
            <td><span class="id-cell">#${safe(t.id)}</span></td>
            <td><span class="name-cell">${safe(t.taskName)}</span></td>
            <td>${safe(t.assignedUser)}</td>
            <td>${safe(t.dueDate)}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${statusBadge(t.status)}</td>
            <td>
                <div class="actions">
                    <button class="btn-action btn-view" onclick="toggleDetail(${t.id})">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
                        View
                    </button>
                    <button class="btn-action btn-edit" onclick="startEdit(${t.id})">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTask(${t.id})">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
        <tr class="detail-row" id="detail-${t.id}" style="display:none;">
            <td colspan="7">
                <div class="detail-inner">
                    <div class="detail-field">
                        <span class="detail-label">Task ID</span>
                        <span class="detail-value">#${safe(t.id)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Task Name</span>
                        <span class="detail-value">${safe(t.taskName)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Assigned User</span>
                        <span class="detail-value">${safe(t.assignedUser)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Due Date</span>
                        <span class="detail-value">${safe(t.dueDate)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Priority</span>
                        <span class="detail-value">${priorityBadge(t.priority)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${statusBadge(t.status)}</span>
                    </div>
                    <div class="detail-field full-width">
                        <span class="detail-label">Description</span>
                        <span class="detail-value">${safe(t.description)}</span>
                    </div>
                </div>
            </td>
        </tr>
    `).join("");
}

function toggleDetail(id) {
    const row = document.getElementById(`detail-${id}`);
    const open = row.style.display !== "none";
    row.style.display = open ? "none" : "table-row";
}

function safe(v) {
    return (v === null || v === undefined || v === "") ? "—" : String(v);
}

function updateCount(n) {
    const el = document.getElementById("taskCount");
    el.textContent = n === 1 ? "1 task" : `${n} tasks`;
}

function setHint(show) {
    document.getElementById("emptyHint").style.display = show ? "" : "none";
}

function startEdit(id) {
    fetch(`${baseUrl}/${id}`)
        .then(async response => {
            const text = await response.text();
            if (!response.ok) throw new Error(text || "Not found");
            return text ? JSON.parse(text) : {};
        })
        .then(task => {
            document.getElementById("edit_id").value        = task.id;
            document.getElementById("c_taskName").value     = task.taskName ?? "";
            document.getElementById("c_description").value  = task.description ?? "";
            document.getElementById("c_assignedUser").value = task.assignedUser ?? "";
            document.getElementById("c_dueDate").value      = task.dueDate ?? "";
            document.getElementById("c_priority").value     = task.priority ?? "MEDIUM";
            document.getElementById("c_status").value       = task.status ?? "TODO";

            document.getElementById("saveBtn").innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Update Task`;
            document.getElementById("formTitle").textContent = "Edit Task";
            document.getElementById("formSub").textContent   = `Editing task #${task.id} — ${task.taskName}`;
            document.getElementById("cancelBtn").style.display = "";
            document.getElementById("formCard").classList.add("edit-mode");

            renderTable([task]);
            updateCount(1);
        })
        .catch(error => {
            document.getElementById("output").textContent = "Error: " + error.message;
        });
}

function cancelEdit() {
    document.getElementById("edit_id").value        = "";
    document.getElementById("c_taskName").value     = "";
    document.getElementById("c_description").value  = "";
    document.getElementById("c_assignedUser").value = "";
    document.getElementById("c_dueDate").value      = "";
    document.getElementById("c_priority").value     = "MEDIUM";
    document.getElementById("c_status").value       = "TODO";

    document.getElementById("saveBtn").innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Create Task`;
    document.getElementById("formTitle").textContent = "New Task";
    document.getElementById("formSub").textContent   = "Fill in the details below to create a task";
    document.getElementById("cancelBtn").style.display = "none";
    document.getElementById("formCard").classList.remove("edit-mode");
}

function deleteTask(id) {
    if (!confirm(`Delete task #${id}?`)) return;
    fetch(`${baseUrl}/${id}`, { method: "DELETE" })
        .then(response => {
            if (response.status !== 204) throw new Error("Delete failed");
            getAllTasks();
        })
        .catch(error => {
            document.getElementById("output").textContent = "Error: " + error.message;
        });
}

// Table starts empty — user controls what loads
setHint(true);