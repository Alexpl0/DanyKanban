// ===== APPLICATION STATE =====
let currentUser = null;
let currentProject = null;
let projects = [];
let tasks = [];
let draggedTask = null;

// ===== PHASE CONFIGURATION =====
const phases = [
    { id: 0, name: 'Backlog', class: 'backlog' },
    { id: 1, name: 'Fase 1: Planificación', class: 'phase-1' },
    { id: 2, name: 'Fase 2: Diseño del Producto', class: 'phase-2' },
    { id: 3, name: 'Fase 3: Diseño del Proceso', class: 'phase-3' },
    { id: 4, name: 'Fase 4: Validación', class: 'phase-4' },
    { id: 5, name: 'Fase 5: Lanzamiento', class: 'phase-5' },
    { id: 6, name: 'Completado', class: 'completed' }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('kanban_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLogin();
    }

    // Initialize sample data if empty
    if (projects.length === 0) {
        initializeSampleData();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Modal form
    document.getElementById('modalForm').addEventListener('submit', handleModalSubmit);
    
    // Close modal on background click
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// ===== AUTHENTICATION =====
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple auth check (you can make this more robust)
    if (email && password) {
        currentUser = {
            id: 1,
            name: 'Admin User',
            email: email,
            avatar: email.charAt(0).toUpperCase()
        };
        
        localStorage.setItem('kanban_user', JSON.stringify(currentUser));
        showDashboard();
    }
}

function logout() {
    localStorage.removeItem('kanban_user');
    currentUser = null;
    showLogin();
}

// ===== VIEW MANAGEMENT =====
function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('kanbanView').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('kanbanView').style.display = 'none';
    
    updateUserDisplay();
    loadProjects();
}

function showKanban(projectId) {
    currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) return;
    
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('kanbanView').style.display = 'block';
    
    document.getElementById('projectTitle').textContent = currentProject.name;
    loadKanbanBoard();
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userAvatar').textContent = currentUser.avatar;
        document.getElementById('userName').textContent = currentUser.name;
    }
}

// ===== PROJECT MANAGEMENT =====
function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    
    projects.forEach(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const card = document.createElement('div');
        card.className = 'project-card';
        card.onclick = () => showKanban(project.id);
        
        card.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="project-meta">
                <span>📋 ${projectTasks.length} tareas</span>
                <span>📅 ${project.createdAt}</span>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ===== KANBAN BOARD MANAGEMENT =====
function loadKanbanBoard() {
    const board = document.getElementById('kanbanBoard');
    board.innerHTML = '';
    
    phases.forEach(phase => {
        const phaseTasks = tasks.filter(t => t.projectId === currentProject.id && t.phase === phase.id);
        
        const column = document.createElement('div');
        column.className = `kanban-column ${phase.class}`;
        column.dataset.phase = phase.id;
        
        column.innerHTML = `
            <div class="column-header">
                <div class="column-title">${phase.name}</div>
                <div class="column-count">${phaseTasks.length}</div>
            </div>
            <div class="task-list" ondrop="handleDrop(event)" ondragover="handleDragOver(event)">
                ${phaseTasks.map(task => createTaskCard(task)).join('')}
            </div>
            <button class="add-task-btn" onclick="openTaskModal(${phase.id})">
                ➕ Agregar Tarea
            </button>
        `;
        
        board.appendChild(column);
    });
    
    // Update progress bars
    updateProgressBars();
}

function createTaskCard(task) {
    const dueDateDisplay = task.dueDate ? 
        `📅 ${new Date(task.dueDate).toLocaleDateString()}` : '';
    
    const completedClass = task.completed ? 'completed' : '';
    const checkboxClass = task.completed ? 'checked' : '';
    const checkIcon = task.completed ? '✓' : '';
    
    return `
        <div class="task-card ${completedClass}" draggable="true" data-task-id="${task.id}" 
             ondragstart="handleDragStart(event)" onclick="openTaskModal(${task.phase}, ${task.id})">
            <div class="task-checkbox ${checkboxClass}" onclick="toggleTaskCompletion(event, ${task.id})">${checkIcon}</div>
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>🏷️ ID: ${task.id}</span>
                <span>${dueDateDisplay}</span>
            </div>
        </div>
    `;
}

// ===== DRAG AND DROP FUNCTIONS =====
function handleDragStart(e) {
    draggedTask = parseInt(e.target.dataset.taskId);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const newPhase = parseInt(e.currentTarget.closest('.kanban-column').dataset.phase);
    
    if (draggedTask !== null) {
        moveTask(draggedTask, newPhase);
        draggedTask = null;
        
        // Remove dragging class from all cards
        document.querySelectorAll('.task-card.dragging').forEach(card => {
            card.classList.remove('dragging');
        });
    }
}

function moveTask(taskId, newPhase) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.phase !== newPhase) {
        task.phase = newPhase;
        task.updatedAt = new Date().toISOString().split('T')[0];
        saveToStorage();
        loadKanbanBoard();
    }
}

// ===== MODAL FUNCTIONS =====
function openProjectModal() {
    document.getElementById('modalTitle').textContent = 'Nuevo Proyecto';

    // Verificar si el elemento phaseGroup existe antes de manipularlo
    const phaseGroup = document.getElementById('phaseGroup');
    if (phaseGroup) {
        phaseGroup.style.display = 'none';
    }

    const completedGroup = document.getElementById('completedGroup');
    if (completedGroup) {
        completedGroup.style.display = 'none';
    }

    document.getElementById('taskTitle').placeholder = 'Nombre del proyecto';
    document.getElementById('taskDescription').placeholder = 'Descripción del proyecto';

    // Cambiar el texto del campo de fecha
    const dueDateLabel = document.querySelector('label[for="taskDueDate"]');
    if (dueDateLabel) {
        dueDateLabel.textContent = 'Fecha de Entrega del Proyecto';
    }

    document.getElementById('modal').style.display = 'flex';
    document.getElementById('modalForm').reset();
}

function openTaskModal(phase = 0, taskId = null) {
    const isEdit = taskId !== null;
    const task = isEdit ? tasks.find(t => t.id === taskId) : null;

    document.getElementById('modalTitle').textContent = isEdit ? 'Editar Tarea' : 'Nueva Tarea';

    // Verificar si los elementos existen antes de manipularlos
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskPhase = document.getElementById('taskPhase');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskCompleted = document.getElementById('taskCompleted');

    if (isEdit && task) {
        if (taskTitle) taskTitle.value = task.title;
        if (taskDescription) taskDescription.value = task.description;
        if (taskPhase) taskPhase.value = task.phase;
        if (taskDueDate) taskDueDate.value = task.dueDate || '';
        if (taskCompleted) taskCompleted.checked = task.completed || false;
        document.getElementById('modalForm').dataset.editId = taskId;
    } else {
        if (taskTitle) taskTitle.value = '';
        if (taskDescription) taskDescription.value = '';
        if (taskPhase) taskPhase.value = phase;
        if (taskDueDate) taskDueDate.value = '';
        if (taskCompleted) taskCompleted.checked = false;
        delete document.getElementById('modalForm').dataset.editId;
    }

    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalForm').reset();
}

function handleModalSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const isEdit = e.target.dataset.editId;
    
    if (document.getElementById('phaseGroup').style.display === 'none') {
        // Creating a project
        const newProject = {
            id: Date.now(),
            name: data.title,
            description: data.description,
            dueDate: data.dueDate,
            createdAt: new Date().toISOString().split('T')[0],
            managerId: currentUser.id
        };
        
        projects.push(newProject);
        saveToStorage();
        loadProjects();
    } else {
        // Creating or editing a task
        if (isEdit) {
            const task = tasks.find(t => t.id === parseInt(isEdit));
            if (task) {
                task.title = data.title;
                task.description = data.description;
                task.phase = parseInt(data.phase);
                task.dueDate = data.dueDate;
                task.completed = data.completed === 'on';
                task.updatedAt = new Date().toISOString().split('T')[0];
            }
        } else {
            const newTask = {
                id: Date.now(),
                projectId: currentProject.id,
                title: data.title,
                description: data.description,
                phase: parseInt(data.phase),
                dueDate: data.dueDate,
                completed: data.completed === 'on',
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0]
            };
            
            tasks.push(newTask);
        }
        
        saveToStorage();
        loadKanbanBoard();
    }
    
    closeModal();
}

// ===== PROGRESS AND COMPLETION FUNCTIONS =====
function toggleTaskCompletion(event, taskId) {
    event.stopPropagation(); // Prevent opening modal when clicking checkbox
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString().split('T')[0];
        saveToStorage();
        loadKanbanBoard();
    }
}

function updateProgressBars() {
    if (!currentProject) return;

    const projectTasks = tasks.filter(t => t.projectId === currentProject.id);
    const completedTasks = projectTasks.filter(t => t.completed);

    // Task progress
    const taskProgressPercent = projectTasks.length > 0 ? 
        Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

    document.getElementById('taskProgress').textContent = `${taskProgressPercent}%`;
    document.getElementById('taskProgressBar').style.width = `${taskProgressPercent}%`;

    // Time progress
    if (currentProject.dueDate && currentProject.createdAt) {
        const startDate = new Date(currentProject.createdAt);
        const endDate = new Date(currentProject.dueDate);
        const currentDate = new Date();

        const totalTime = endDate.getTime() - startDate.getTime();
        const elapsedTime = currentDate.getTime() - startDate.getTime();

        const timeProgressPercent = totalTime > 0 ? 
            Math.min(Math.max(Math.round((elapsedTime / totalTime) * 100), 0), 100) : 0;

        document.getElementById('timeProgress').textContent = `${timeProgressPercent}%`;
        document.getElementById('timeProgressBar').style.width = `${timeProgressPercent}%`;
    } else {
        document.getElementById('timeProgress').textContent = 'Sin fecha límite';
        document.getElementById('timeProgressBar').style.width = '0%';
    }
}

// ===== DATA MANAGEMENT =====
function initializeSampleData() {
    projects = [
        {
            id: 1,
            name: "Sistema de Inventario",
            description: "Desarrollo de aplicación web para gestión de inventario en tiempo real",
            createdAt: "2025-06-01",
            dueDate: "2025-08-01",
            managerId: 1
        },
        {
            id: 2,
            name: "App Móvil E-commerce",
            description: "Aplicación móvil para tienda online con funciones de carrito y pagos",
            createdAt: "2025-05-15",
            dueDate: "2025-07-30",
            managerId: 1
        }
    ];

    tasks = [
        {
            id: 1,
            projectId: 1,
            title: "Análisis de Requerimientos",
            description: "Definir funcionalidades principales del sistema de inventario",
            phase: 1,
            dueDate: "2025-06-15",
            completed: true,
            createdAt: "2025-06-01",
            updatedAt: "2025-06-01"
        },
        {
            id: 2,
            projectId: 1,
            title: "Diseño de Base de Datos",
            description: "Crear esquema de BD para productos, categorías y movimientos",
            phase: 2,
            dueDate: "2025-06-25",
            completed: false,
            createdAt: "2025-06-10",
            updatedAt: "2025-06-10"
        }
    ];

    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem('kanban_projects', JSON.stringify(projects));
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
}

function loadFromStorage() {
    const savedProjects = localStorage.getItem('kanban_projects');
    const savedTasks = localStorage.getItem('kanban_tasks');
    
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}