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

// ===== VERSION CHECK AND FORCED UPDATE =====
const APP_VERSION = '1.3.0'; // Incrementa esto cada vez que quieras forzar actualización
const VERSION_KEY = 'kanban_app_version';

function checkAppVersion() {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    
    // Si no hay versión guardada (usuario nuevo), establecer la versión actual
    if (!savedVersion) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        return true; // Permitir continuar normalmente
    }
    
    // Solo mostrar modal si hay una versión diferente (actualización necesaria)
    if (savedVersion !== APP_VERSION) {
        showUpdateModal();
        return false;
    }
    
    return true;
}

function showUpdateModal() {
    // Crear modal de actualización
    const updateModal = document.createElement('div');
    updateModal.id = 'updateModal';
    updateModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease;
    `;
    
    updateModal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        ">
            <div style="font-size: 50px; margin-bottom: 20px;">🔄</div>
            <h2 style="color: #1D837F; margin-bottom: 15px;">Nueva Versión Disponible</h2>
            <p style="margin-bottom: 25px; color: #666; line-height: 1.5;">
                Hemos detectado una nueva versión de la aplicación con mejoras importantes. 
                <br><br>
                <strong>Es necesario actualizar para continuar.</strong>
            </p>
            <div id="updateProgress" style="display: none; margin-bottom: 20px;">
                <div style="background: #f0f0f0; border-radius: 10px; height: 6px; overflow: hidden;">
                    <div id="progressBar" style="background: #1D837F; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 10px;" id="progressText">Iniciando actualización...</p>
            </div>
            <button id="updateBtn" style="
                background: #1D837F;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                transition: all 0.3s;
            " onmouseover="this.style.background='#15625f'" onmouseout="this.style.background='#1D837F'">
                🚀 Actualizar Ahora
            </button>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Versión actual: ${APP_VERSION}
            </p>
        </div>
    `;
    
    // Agregar estilos de animación
    if (!document.querySelector('#modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    transform: translateY(30px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(updateModal);
    
    // Manejar click de actualización
    document.getElementById('updateBtn').addEventListener('click', function() {
        forceAppUpdateWithProgress();
    });
    
    // Prevenir cerrar el modal clickeando fuera
    updateModal.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

function forceAppUpdateWithProgress() {
    const updateBtn = document.getElementById('updateBtn');
    const updateProgress = document.getElementById('updateProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    // Mostrar barra de progreso
    updateBtn.style.display = 'none';
    updateProgress.style.display = 'block';
    
    // Simular progreso de actualización
    let progress = 0;
    const steps = [
        { progress: 20, text: 'Preparando actualización...' },
        { progress: 40, text: 'Limpiando caché...' },
        { progress: 60, text: 'Actualizando datos...' },
        { progress: 80, text: 'Finalizando...' },
        { progress: 100, text: '¡Actualización completada!' }
    ];
    
    let currentStep = 0;
    
    function updateProgress() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progressBar.style.width = `${step.progress}%`;
            progressText.textContent = step.text;
            currentStep++;
            
            if (currentStep < steps.length) {
                setTimeout(updateProgress, 300);
            } else {
                // Ejecutar la actualización real después del último paso
                setTimeout(() => {
                    executeActualUpdate();
                }, 500);
            }
        }
    }
    
    updateProgress();
}

function executeActualUpdate() {
    // Limpiar localStorage pero mantener usuario logueado
    const currentUserData = localStorage.getItem('kanban_user');
    
    // Limpiar todo
    localStorage.clear();
    
    // Restaurar usuario
    if (currentUserData) {
        localStorage.setItem('kanban_user', currentUserData);
    }
    
    // Establecer nueva versión
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Limpiar caché
    if ('caches' in window) {
        caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name))).then(() => {
                handleServiceWorkerUpdate(currentUserData);
            });
        });
    } else {
        handleServiceWorkerUpdate(currentUserData);
    }
}

function handleServiceWorkerUpdate(currentUserData) {
    // Desregistrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            Promise.all(registrations.map(registration => registration.unregister())).then(() => {
                // Después de desregistrar, reinicializar la app sin recargar la página
                reinitializeApp(currentUserData);
            });
        });
    } else {
        // Si no hay service worker, reinicializar directamente
        reinitializeApp(currentUserData);
    }
}

function reinitializeApp(currentUserData) {
    // Ocultar modal de actualización
    const updateModal = document.getElementById('updateModal');
    if (updateModal) {
        updateModal.remove();
    }
    
    // Resetear variables globales
    currentUser = null;
    currentProject = null;
    projects = [];
    tasks = [];
    draggedTask = null;
    
    // Cargar datos desde storage (que ahora estará vacío excepto por el usuario)
    loadFromStorage();
    
    // Si había usuario logueado, restaurarlo
    if (currentUserData) {
        currentUser = JSON.parse(currentUserData);
    }
    
    // Reinicializar datos de ejemplo si no hay proyectos
    if (projects.length === 0) {
        initializeSampleData();
    }
    
    // Mostrar la vista apropiada
    if (currentUser) {
        showDashboard();
        // Mostrar mensaje de éxito
        showUpdateSuccessMessage();
    } else {
        showLogin();
    }
}

function showUpdateSuccessMessage() {
    // Crear notificación de éxito
    const successNotification = document.createElement('div');
    successNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    successNotification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>✅</span>
            <span>¡Aplicación actualizada exitosamente!</span>
        </div>
    `;
    
    // Agregar CSS de animación si no existe
    if (!document.querySelector('#updateAnimations')) {
        const style = document.createElement('style');
        style.id = 'updateAnimations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(successNotification);
    
    // Remover la notificación después de 3 segundos
    setTimeout(() => {
        successNotification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (successNotification.parentNode) {
                successNotification.remove();
            }
        }, 300);
    }, 3000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Verificar versión ANTES de hacer cualquier otra cosa
    if (!checkAppVersion()) {
        return; // Si necesita actualizar, no continuar con la inicialización
    }
    
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
        showLogin(); // Mostrar login para usuarios nuevos
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

// ===== HELPER FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return '';
    // The input is 'YYYY-MM-DD', which JS interprets as UTC.
    // To avoid timezone issues where the date might shift back a day,
    // we adjust for the user's timezone offset.
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = adjustedDate.getFullYear();
    
    return `${day}/${month}/${year}`;
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
                <span>📅 ${formatDate(project.createdAt)}</span>
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
        `📅 ${formatDate(task.dueDate)}` : '';
    
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
    
    const phaseGroup = document.getElementById('phaseGroup');
    if (phaseGroup) {
        phaseGroup.style.display = 'block';
    }

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
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
    
    // Fechas dinámicas
    const startDate1 = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días atrás
    const endDate1 = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));   // 60 días adelante
    const startDate2 = new Date(today.getTime() - (15 * 24 * 60 * 60 * 1000)); // 15 días atrás
    const endDate2 = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));   // 90 días adelante
    
    projects = [
        {
            id: 1,
            name: "Sistema de Inventario",
            description: "Desarrollo de aplicación web para gestión de inventario en tiempo real",
            createdAt: startDate1.toISOString().split('T')[0],
            dueDate: endDate1.toISOString().split('T')[0],
            managerId: 1
        },
        {
            id: 2,
            name: "App Móvil E-commerce",
            description: "Aplicación móvil para tienda online con funciones de carrito y pagos",
            createdAt: startDate2.toISOString().split('T')[0],
            dueDate: endDate2.toISOString().split('T')[0],
            managerId: 1
        }
    ];

    // Fechas dinámicas para tareas
    const task1Date = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000));
    const task2Date = new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000));
    const task3Date = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const task4Date = new Date(today.getTime() + (25 * 24 * 60 * 60 * 1000));

    tasks = [
        {
            id: 1,
            projectId: 1,
            title: "Análisis de Requerimientos",
            description: "Definir funcionalidades principales del sistema de inventario",
            phase: 1,
            dueDate: task1Date.toISOString().split('T')[0],
            completed: true,
            createdAt: startDate1.toISOString().split('T')[0],
            updatedAt: startDate1.toISOString().split('T')[0]
        },
        {
            id: 2,
            projectId: 1,
            title: "Diseño de Base de Datos",
            description: "Crear esquema de BD para productos, categorías y movimientos",
            phase: 2,
            dueDate: task2Date.toISOString().split('T')[0],
            completed: false,
            createdAt: startDate1.toISOString().split('T')[0],
            updatedAt: startDate1.toISOString().split('T')[0]
        },
        {
            id: 3,
            projectId: 1,
            title: "Desarrollo del Backend",
            description: "Implementar la API REST para el inventario",
            phase: 3,
            dueDate: task3Date.toISOString().split('T')[0],
            completed: false,
            createdAt: startDate1.toISOString().split('T')[0],
            updatedAt: startDate1.toISOString().split('T')[0]
        },
        {
            id: 4,
            projectId: 2,
            title: "Diseño de UI/UX",
            description: "Crear los mockups y prototipos para la app móvil",
            phase: 2,
            dueDate: task4Date.toISOString().split('T')[0],
            completed: false,
            createdAt: startDate2.toISOString().split('T')[0],
            updatedAt: startDate2.toISOString().split('T')[0]
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

// ===== PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
                
                // Forzar verificación de actualizaciones
                registration.update();
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Nueva versión disponible - forzar recarga
                                console.log('Nueva versión detectada, recargando...');
                                window.location.reload();
                            } else {
                                // Primera instalación
                                console.log('Contenido cacheado por primera vez');
                            }
                        }
                    });
                });
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });

    // Verificar actualizaciones periódicamente
    setInterval(() => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) reg.update();
            });
        }
    }, 60000); // Cada minuto
}

// ===== PWA INSTALL PROMPT =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button (optional)
    showInstallButton();
});

function showInstallButton() {
    // You can add an install button to your UI here
    console.log('PWA install prompt available');
}

// Handle the install button click (optional)
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// ===== FORCE CACHE CLEAR (Para desarrollo) =====
function clearAllCaches() {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    // Limpiar localStorage también
    localStorage.clear();
    
    // Desregistrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
    
    // Recargar página
    window.location.reload(true);
}

// Nueva función para forzar datos frescos
function resetSampleData() {
    localStorage.removeItem('kanban_projects');
    localStorage.removeItem('kanban_tasks');
    projects = [];
    tasks = [];
    initializeSampleData();
    if (document.getElementById('dashboard').style.display === 'block') {
        loadProjects();
    }
    if (document.getElementById('kanbanView').style.display === 'block') {
        loadKanbanBoard();
    }
}
