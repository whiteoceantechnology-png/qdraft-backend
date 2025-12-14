/**
 * QB Server Admin - Main Application
 */

// Global state
let currentPage = 'dashboard';
let currentEntity = null;
let currentEntityId = null;
let deleteCallback = null;
let currentUserRole = null;

// Bootstrap modals
let loginModal, entityModal, deleteModal;
let toast;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap components
  loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  entityModal = new bootstrap.Modal(document.getElementById('entityModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  toast = new bootstrap.Toast(document.getElementById('toastNotification'));

  // Check authentication
  checkAuth();

  // Setup event listeners
  setupEventListeners();
});

async function checkAuth() {
  const token = api.token;
  const user = api.getUser();

  if (token && user) {
    try {
      // Validate token with server
      const currentUser = await api.getCurrentUser();
      showApp(currentUser);
    } catch (error) {
      // Token is invalid, show login
      console.error('Token validation failed:', error);
      showLogin();
    }
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('appContainer').classList.add('d-none');
  loginModal.show();
}

function showApp(user) {
  loginModal.hide();
  document.getElementById('appContainer').classList.remove('d-none');
  
  // Display user info
  currentUserRole = user.role || null;
  const userLabel = (user.username || user.email || 'Unknown') + (currentUserRole ? ` (${currentUserRole})` : '');
  document.getElementById('currentUser').textContent = userLabel;
  if (user.tenant) {
    document.getElementById('currentTenant').textContent = user.tenant.tenant_name;
  }

  // Load dashboard
  navigateTo('dashboard');

  // Apply global role gates (sidebar etc.)
  applyRoleGates();
}

function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      navigateTo(page);
    });
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('show');
  });

  // Save entity button
  document.getElementById('saveEntityBtn').addEventListener('click', handleSaveEntity);

  // Confirm delete button
  document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  try {
    errorDiv.classList.add('d-none');
    const response = await api.login(username, password);
    // Response contains user data with access_token
    showApp(response);
    showToast('Success', 'Logged in successfully', 'success');
  } catch (error) {
    errorDiv.textContent = error.message || 'Login failed';
    errorDiv.classList.remove('d-none');
  }
}

async function handleLogout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
  showLogin();
  showToast('Info', 'Logged out successfully', 'info');
}

function navigateTo(page) {
  currentPage = page;

  // Update active nav
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    tenants: 'Tenants',
    users: 'Users',
    subjects: 'Subjects',
    questions: 'Questions',
    chapters: 'Chapters',
    questionTypes: 'Question Types',
    exams: 'Exams',
    settings: 'Settings',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Load page content
  const pageContent = document.getElementById('pageContent');
  if (Pages[page]) {
    pageContent.innerHTML = Pages[page]();
    loadPageData(page);
    // Apply role gates after rendering page content
    applyRoleGates();
  } else {
    pageContent.innerHTML = Pages.empty('question-circle', 'Page not found');
  }

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('show');
}

async function loadPageData(page) {
  try {
    switch (page) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'tenants':
        await loadTenants();
        break;
      case 'users':
        await loadUsers();
        break;
      case 'subjects':
        await loadSubjects();
        break;
      case 'questions':
        await loadQuestions();
        break;
      case 'chapters':
        await loadChapters();
        break;
      case 'questionTypes':
        await loadQuestionTypes();
        break;
      case 'exams':
        await loadExams();
        break;
      case 'settings':
        await loadSettings();
        break;
    }
  } catch (error) {
    console.error('Error loading page data:', error);
    showToast('Error', 'Failed to load data: ' + error.message, 'error');
  }
}

// Dashboard
async function loadDashboard() {
  try {
    // Load stats
    const [health, metrics] = await Promise.all([
      api.getHealth().catch(() => null),
      api.getMetrics().catch(() => null),
    ]);

    // Try to load dashboard stats from API
    try {
      const stats = await api.getDashboardStats();
      if (stats.data) {
        document.getElementById('statTenants').textContent = stats.data.tenants || '0';
        document.getElementById('statUsers').textContent = stats.data.users || '0';
        document.getElementById('statQuestions').textContent = stats.data.questions || '0';
        document.getElementById('statExams').textContent = stats.data.exams || '0';
      }
    } catch (e) {
      // Stats endpoint might not exist, use placeholder
      document.getElementById('statTenants').textContent = '-';
      document.getElementById('statUsers').textContent = '-';
      document.getElementById('statQuestions').textContent = '-';
      document.getElementById('statExams').textContent = '-';
    }

    // Load health info
    loadHealth();
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

async function loadHealth() {
  try {
    const health = await api.getHealth();
    const healthDiv = document.getElementById('healthInfo');
    
    if (health) {
      healthDiv.innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <p><strong>Status:</strong> 
              <span class="badge bg-${health.status === 'healthy' ? 'success' : 'danger'}">${health.status}</span>
            </p>
            <p><strong>Uptime:</strong> ${formatUptime(health.uptime)}</p>
            <p><strong>Version:</strong> ${health.version || '1.0.0'}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Memory Used:</strong> ${health.memory?.used || '-'} MB</p>
            <p><strong>Memory Total:</strong> ${health.memory?.total || '-'} MB</p>
            <p><strong>Database:</strong> 
              <span class="badge bg-${health.database?.status === 'connected' ? 'success' : 'danger'}">
                ${health.database?.status || 'unknown'}
              </span>
            </p>
          </div>
        </div>
        <p><strong>Cache Size:</strong> ${health.cache?.size || 0} items</p>
        <p class="text-muted mb-0"><small>Last updated: ${new Date(health.timestamp).toLocaleString()}</small></p>
      `;
    }
  } catch (error) {
    document.getElementById('healthInfo').innerHTML = `
      <div class="alert alert-danger mb-0">Failed to load health info</div>
    `;
  }
}

// Tenants
async function loadTenants() {
  try {
    const response = await api.getTenants();
    const tbody = document.getElementById('tenantsTableBody');
    const tenants = response.data?.tenants || response.data || response || [];

    if (tenants.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">${Pages.empty('building', 'No tenants found')}</td></tr>`;
    } else {
      tbody.innerHTML = tenants.map(TableRows.tenant).join('');
    }
  } catch (error) {
    document.getElementById('tenantsTableBody').innerHTML = `
      <tr><td colspan="8" class="text-center text-danger">Failed to load tenants: ${error.message}</td></tr>
    `;
  }
}

// Users
async function loadUsers() {
  try {
    const response = await api.getUsers();
    const tbody = document.getElementById('usersTableBody');
    const users = response.data?.users || response.data || response || [];

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">${Pages.empty('people', 'No users found')}</td></tr>`;
    } else {
      tbody.innerHTML = users.map(TableRows.user).join('');
    }
    // Apply role gates after rendering
    applyRoleGates();
  } catch (error) {
    document.getElementById('usersTableBody').innerHTML = `
      <tr><td colspan="8" class="text-center text-danger">Failed to load users: ${error.message}</td></tr>
    `;
  }
}

// Subjects
async function loadSubjects() {
  try {
    const response = await api.getSubjects();
    const tbody = document.getElementById('subjectsTableBody');
    const subjects = response.data || response || [];

    if (subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">${Pages.empty('journal-bookmark', 'No subjects found')}</td></tr>`;
    } else {
      tbody.innerHTML = subjects.map(TableRows.subject).join('');
    }
    // Apply role gates after rendering
    applyRoleGates();
  } catch (error) {
    document.getElementById('subjectsTableBody').innerHTML = `
      <tr><td colspan="6" class="text-center text-danger">Failed to load subjects: ${error.message}</td></tr>
    `;
  }
}

// View users assigned to a subject
async function viewSubjectUsers(subjectId, subjectName) {
  try {
    const response = await api.getUsersBySubject(subjectId);
    const users = response.data?.users || [];
    
    let content = `<div class="p-3">
      <h6><i class="bi bi-journal-bookmark me-2"></i>${subjectName}</h6>
      <hr>`;
    
    if (users.length === 0) {
      content += '<p class="text-muted">No users assigned to this subject yet.</p>';
    } else {
      content += '<ul class="list-group">';
      users.forEach(u => {
        content += `<li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${u.username}</strong> <small class="text-muted">(${u.email})</small>
            <br><small>${u.user_fname || ''} - <span class="badge badge-role-${u.role}">${u.role}</span></small>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="removeUserSubject(${u.user_id}, '${u.username}')" title="Remove Assignment">
            <i class="bi bi-x-lg"></i>
          </button>
        </li>`;
      });
      content += '</ul>';
    }
    content += '</div>';
    
    document.getElementById('entityModalTitle').textContent = 'Users Assigned to Subject';
    document.getElementById('entityFormFields').innerHTML = content;
    document.getElementById('saveEntityBtn').style.display = 'none';
    entityModal.show();
  } catch (error) {
    showToast('Error', 'Failed to load users: ' + error.message, 'error');
  }
}

// Remove subject assignment from user
async function removeUserSubject(userId, username) {
  if (!confirm(`Remove subject assignment from ${username}?`)) return;
  try {
    await api.removeSubjectFromUser(userId);
    showToast('Success', `Subject removed from ${username}`, 'success');
    entityModal.hide();
    loadSubjects();
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

// Open assign subject modal
async function openAssignSubjectModal() {
  currentEntity = 'assignSubject';
  currentEntityId = null;
  
  document.getElementById('entityModalTitle').textContent = 'Assign Subject to User';
  document.getElementById('entityFormFields').innerHTML = FormFields.assignSubject();
  document.getElementById('saveEntityBtn').style.display = '';
  
  // Load users and subjects
  try {
    const [usersRes, subjectsRes] = await Promise.all([
      api.getUsers(),
      api.getSubjects({ active: 'true' })
    ]);
    
    const users = usersRes.data?.users || usersRes.data || usersRes || [];
    const subjects = subjectsRes.data || subjectsRes || [];
    
    const userSelect = document.getElementById('assignUserSelect');
    const subjectSelect = document.getElementById('assignSubjectSelect');
    
    userSelect.innerHTML = '<option value="">Select User</option>' +
      users.filter(u => ['teacher', 'user'].includes(u.role)).map(u => 
        `<option value="${u.user_id}">${u.username} (${u.email}) - ${u.role}</option>`
      ).join('');
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
      subjects.map(s => 
        `<option value="${s.subject_id}">${s.subject_name}${s.subject_code ? ' (' + s.subject_code + ')' : ''}</option>`
      ).join('');
  } catch (error) {
    showToast('Error', 'Failed to load data: ' + error.message, 'error');
  }
  
  entityModal.show();
}

// Questions
async function loadQuestions() {
  try {
    // Load chapters for filter
    const chaptersResponse = await api.getChapters();
    const chapters = chaptersResponse.data?.chapters || chaptersResponse.data || [];
    const chapterSelect = document.getElementById('filterChapter');
    if (chapterSelect) {
      chapterSelect.innerHTML = '<option value="">All Chapters</option>' +
        chapters.map(c => `<option value="${c.qbs_chapter_id}">${c.qbs_chapter_name}</option>`).join('');
    }

    // Load questions
    const chapterId = document.getElementById('filterChapter')?.value;
    const params = chapterId ? { chapter_id: chapterId } : {};
    const response = await api.getQuestions(params);
    const tbody = document.getElementById('questionsTableBody');
    const questions = response.data?.questions || response.data || response || [];

    if (questions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">${Pages.empty('question-circle', 'No questions found')}</td></tr>`;
    } else {
      tbody.innerHTML = questions.map(TableRows.question).join('');
    }
  } catch (error) {
    document.getElementById('questionsTableBody').innerHTML = `
      <tr><td colspan="7" class="text-center text-danger">Failed to load questions: ${error.message}</td></tr>
    `;
  }
}

// Chapters
let cachedSubjectsMap = {};

async function loadChapters() {
  try {
    // Load subjects for filter dropdown and mapping
    const subjectsRes = await api.getSubjects();
    const subjects = subjectsRes.data || subjectsRes || [];
    cachedSubjectsMap = {};
    subjects.forEach(s => { cachedSubjectsMap[s.subject_id] = s.subject_name; });
    
    const filterSelect = document.getElementById('filterChapterSubject');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Subjects</option>' +
        subjects.map(s => `<option value="${s.subject_id}">${s.subject_name}${s.subject_code ? ' (' + s.subject_code + ')' : ''}</option>`).join('');
    }

    // Load chapters
    const subjectId = document.getElementById('filterChapterSubject')?.value;
    const params = subjectId ? { subjectId } : {};
    const response = await api.getChapters(params);
    const tbody = document.getElementById('chaptersTableBody');
    const chapters = response.data?.chapters || response.data || response || [];

    if (chapters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">${Pages.empty('book', 'No chapters found')}</td></tr>`;
    } else {
      tbody.innerHTML = chapters.map(c => TableRows.chapter(c, cachedSubjectsMap)).join('');
    }
    // Apply role gates after rendering
    applyRoleGates();
  } catch (error) {
    document.getElementById('chaptersTableBody').innerHTML = `
      <tr><td colspan="6" class="text-center text-danger">Failed to load chapters: ${error.message}</td></tr>
    `;
  }
}

// Filter chapters by subject
function filterChaptersBySubject() {
  loadChapters();
}

// Question Types
let cachedChaptersMap = {};

async function loadQuestionTypes() {
  try {
    // Load subjects for filter dropdown and mapping
    const subjectsRes = await api.getSubjects();
    const subjects = subjectsRes.data || subjectsRes || [];
    cachedSubjectsMap = {};
    subjects.forEach(s => { cachedSubjectsMap[s.subject_id] = s.subject_name; });
    
    // Load chapters for mapping
    const chaptersRes = await api.getChapters();
    const chapters = chaptersRes.data || chaptersRes || [];
    cachedChaptersMap = {};
    chapters.forEach(c => { cachedChaptersMap[c.qbs_chapter_id] = c.qbs_chapter_name; });
    
    const filterSelect = document.getElementById('filterQTypeSubject');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Subjects</option>' +
        subjects.map(s => `<option value="${s.subject_id}">${s.subject_name}${s.subject_code ? ' (' + s.subject_code + ')' : ''}</option>`).join('');
    }

    // Load question types
    const subjectId = document.getElementById('filterQTypeSubject')?.value;
    const params = subjectId ? { subjectId } : {};
    const response = await api.getQuestionTypes(params);
    const tbody = document.getElementById('questionTypesTableBody');
    const questionTypes = response.data || response || [];

    if (questionTypes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">${Pages.empty('list-check', 'No question types found')}</td></tr>`;
    } else {
      tbody.innerHTML = questionTypes.map(qt => TableRows.questionType(qt, cachedSubjectsMap, cachedChaptersMap)).join('');
    }
    // Apply role gates after rendering
    applyRoleGates();
  } catch (error) {
    document.getElementById('questionTypesTableBody').innerHTML = `
      <tr><td colspan="7" class="text-center text-danger">Failed to load question types: ${error.message}</td></tr>
    `;
  }
}

// Filter question types by subject
function filterQuestionTypesBySubject() {
  loadQuestionTypes();
}

// Exams
async function loadExams() {
  try {
    const response = await api.getExams();
    const tbody = document.getElementById('examsTableBody');
    const exams = response.data?.exams || response.data || response || [];

    if (exams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">${Pages.empty('file-earmark-text', 'No exams found')}</td></tr>`;
    } else {
      tbody.innerHTML = exams.map(TableRows.exam).join('');
    }
  } catch (error) {
    document.getElementById('examsTableBody').innerHTML = `
      <tr><td colspan="7" class="text-center text-danger">Failed to load exams: ${error.message}</td></tr>
    `;
  }
}

// Settings
async function loadSettings() {
  try {
    // Load cache stats
    const cacheStats = await api.getCacheStats().catch(() => ({ size: 0, keys: [] }));
    document.getElementById('cacheInfo').innerHTML = `
      <p><strong>Cache Size:</strong> ${cacheStats.size || 0} items</p>
      <p><strong>Max Size:</strong> ${cacheStats.maxSize || 10000} items</p>
      <p><strong>Keys:</strong></p>
      <div class="bg-light p-2 rounded" style="max-height: 150px; overflow-y: auto;">
        <small>${cacheStats.keys?.slice(0, 20).join(', ') || 'No cached items'}</small>
        ${cacheStats.keys?.length > 20 ? `<br><em>... and ${cacheStats.keys.length - 20} more</em>` : ''}
      </div>
    `;

    // Load system info
    const metrics = await api.getMetrics().catch(() => ({}));
    document.getElementById('systemInfo').innerHTML = `
      <p><strong>Node Version:</strong> ${metrics.node_version || '-'}</p>
      <p><strong>Environment:</strong> ${metrics.env || '-'}</p>
      <p><strong>Uptime:</strong> ${formatUptime(metrics.uptime_seconds)}</p>
      <p><strong>Memory RSS:</strong> ${Math.round((metrics.memory_rss_bytes || 0) / 1024 / 1024)} MB</p>
      <p><strong>Heap Used:</strong> ${Math.round((metrics.memory_heap_used_bytes || 0) / 1024 / 1024)} MB</p>
    `;
  } catch (error) {
    console.error('Settings error:', error);
  }
}

// Modal Functions
async function openCreateModal(entity) {
  currentEntity = entity;
  currentEntityId = null;

  const titleMap = {
    tenant: 'Create Tenant',
    user: 'Create User',
    subject: 'Create Subject',
    question: 'Create Question',
    chapter: 'Create Chapter',
    questionType: 'Create Question Type',
    exam: 'Create Exam',
  };

  document.getElementById('entityModalTitle').textContent = titleMap[entity] || 'Create';
  document.getElementById('entityFormFields').innerHTML = FormFields[entity]({});
  document.getElementById('saveEntityBtn').style.display = '';

  // Load dependencies
  if (entity === 'question') {
    await loadChapterOptions();
  }
  if (entity === 'chapter') {
    await loadSubjectOptionsForChapter();
  }
  if (entity === 'questionType') {
    await loadSubjectOptionsForQuestionType();
  }

  // Apply gates within form
  applyRoleGates();

  // Adjust user role options and tenant selection for super_admin
  if (entity === 'user') {
    adjustUserRoleOptions();
    if (currentUserRole === 'super_admin') {
      await populateTenantOptions();
    }
  }

  entityModal.show();
}

async function openEditModal(entity, id) {
  currentEntity = entity;
  currentEntityId = id;

  try {
    let data;
    switch (entity) {
      case 'tenant':
        data = await api.getTenant(id);
        break;
      case 'user':
        data = await api.getUser(id);
        break;
      case 'subject':
        data = await api.getSubject(id);
        break;
      case 'question':
        data = await api.getQuestion(id);
        break;
      case 'chapter':
        data = await api.getChapter(id);
        break;
      case 'questionType':
        data = await api.getQuestionType(id);
        break;
      case 'exam':
        data = await api.getExam(id);
        break;
    }

    const entityData = data.data || data;

    const titleMap = {
      tenant: 'Edit Tenant',
      user: 'Edit User',
      subject: 'Edit Subject',
      question: 'Edit Question',
      chapter: 'Edit Chapter',
      questionType: 'Edit Question Type',
      exam: 'Edit Exam',
    };

    document.getElementById('entityModalTitle').textContent = titleMap[entity] || 'Edit';
    document.getElementById('entityFormFields').innerHTML = FormFields[entity](entityData);
    document.getElementById('saveEntityBtn').style.display = '';

    // Load dependencies
    if (entity === 'question') {
      await loadChapterOptions(entityData.qbs_chapter_id);
    }
    if (entity === 'chapter') {
      await loadSubjectOptionsForChapter(entityData.qbs_sub_id);
    }
    if (entity === 'questionType') {
      await loadSubjectOptionsForQuestionType(entityData.subject_id, entityData.chapter_id);
    }

    // Apply gates within form
    applyRoleGates();

    if (entity === 'user') {
      adjustUserRoleOptions();
      if (currentUserRole === 'super_admin') {
        await populateTenantOptions(entityData.tenant_id);
      }
    }

    entityModal.show();
  } catch (error) {
    showToast('Error', 'Failed to load data: ' + error.message, 'error');
  }
}

async function loadChapterOptions(selectedId = null) {
  try {
    const response = await api.getChapters();
    const chapters = response.data?.chapters || response.data || [];
    const select = document.getElementById('questionChapter');
    if (select) {
      select.innerHTML = '<option value="">Select Chapter</option>' +
        chapters.map(c => `
          <option value="${c.qbs_chapter_id}" ${c.qbs_chapter_id == selectedId ? 'selected' : ''}>
            ${c.qbs_chapter_name}
          </option>
        `).join('');
    }
  } catch (error) {
    console.error('Failed to load chapters:', error);
  }
}

async function loadSubjectOptionsForChapter(selectedId = null) {
  try {
    const response = await api.getSubjects();
    const subjects = response.data || response || [];
    const select = document.getElementById('chapterSubjectSelect');
    if (select) {
      select.innerHTML = '<option value="">Select Subject</option>' +
        subjects.map(s => `
          <option value="${s.subject_id}" ${s.subject_id == selectedId ? 'selected' : ''}>
            ${s.subject_name}${s.subject_code ? ' (' + s.subject_code + ')' : ''}
          </option>
        `).join('');
    }
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function loadSubjectOptionsForQuestionType(selectedSubjectId = null, selectedChapterId = null) {
  try {
    const response = await api.getSubjects();
    const subjects = response.data || response || [];
    const select = document.getElementById('questionTypeSubjectSelect');
    if (select) {
      select.innerHTML = '<option value="">Select Subject</option>' +
        subjects.map(s => `
          <option value="${s.subject_id}" ${s.subject_id == selectedSubjectId ? 'selected' : ''}>
            ${s.subject_name}${s.subject_code ? ' (' + s.subject_code + ')' : ''}
          </option>
        `).join('');
    }
    // If subject is selected, load its chapters
    if (selectedSubjectId) {
      await loadChaptersForQuestionType(selectedSubjectId, selectedChapterId);
    } else {
      const chapterSelect = document.getElementById('questionTypeChapterSelect');
      if (chapterSelect) {
        chapterSelect.innerHTML = '<option value="">Select subject first...</option>';
      }
    }
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

// Load chapters when subject is selected in question type form
async function loadChaptersForQuestionType(subjectId = null, selectedChapterId = null) {
  try {
    const subjectSelect = document.getElementById('questionTypeSubjectSelect');
    const chapterSelect = document.getElementById('questionTypeChapterSelect');
    if (!chapterSelect) return;
    
    const subId = subjectId || (subjectSelect ? subjectSelect.value : null);
    
    if (!subId) {
      chapterSelect.innerHTML = '<option value="">Select subject first...</option>';
      return;
    }
    
    const response = await api.getChapters({ subjectId: subId });
    const chapters = response.data || response || [];
    
    chapterSelect.innerHTML = '<option value="">No chapter (applies to all)</option>' +
      chapters.map(c => `
        <option value="${c.qbs_chapter_id}" ${c.qbs_chapter_id == selectedChapterId ? 'selected' : ''}>
          ${c.qbs_chapter_name}
        </option>
      `).join('');
  } catch (error) {
    console.error('Failed to load chapters:', error);
    const chapterSelect = document.getElementById('questionTypeChapterSelect');
    if (chapterSelect) {
      chapterSelect.innerHTML = '<option value="">Failed to load chapters</option>';
    }
  }
}

async function handleSaveEntity() {
  const form = document.getElementById('entityForm');
  const formData = new FormData(form);
  const data = {};

  // Re-enable disabled fields before collecting data
  const roleSel = document.getElementById('userRoleSelect');
  if (roleSel && roleSel.disabled) {
    roleSel.disabled = false;
  }

  // Collect form data again after enabling
  const updatedFormData = new FormData(form);
  updatedFormData.forEach((value, key) => {
    if (key === 'is_active') {
      data[key] = true;
    } else if (value !== '') {
      data[key] = value;
    }
  });

  // Handle checkboxes
  if (!updatedFormData.has('is_active')) {
    data.is_active = false;
  }

  try {
    // Handle special case for assignSubject
    if (currentEntity === 'assignSubject') {
      const userId = document.getElementById('assignUserSelect').value;
      const subjectId = document.getElementById('assignSubjectSelect').value;
      if (!userId || !subjectId) {
        showToast('Error', 'Please select both a user and a subject', 'error');
        return;
      }
      await api.assignSubjectToUser(userId, subjectId);
      showToast('Success', 'Subject assigned successfully', 'success');
      entityModal.hide();
      loadPageData(currentPage);
      return;
    }

    if (currentEntityId) {
      // Update
      switch (currentEntity) {
        case 'tenant':
          await api.updateTenant(currentEntityId, data);
          break;
        case 'user':
          {
            const roleSel = document.getElementById('userRoleSelect');
            const roleVal = roleSel ? roleSel.value : null;
            if (roleVal === 'tenant_admin') {
              if (currentUserRole !== 'super_admin') {
                showToast('Error', 'Only super admin can update tenant admins', 'error');
                return;
              }
              const tenantSel = document.getElementById('userTenantSelect');
              if (!tenantSel || !tenantSel.value) {
                showToast('Error', 'Select a tenant for the tenant admin', 'error');
                return;
              }
              data.tenant_id = tenantSel.value;
            } else if (currentUserRole === 'super_admin') {
              const tenantSel = document.getElementById('userTenantSelect');
              if (tenantSel && tenantSel.value) {
                data.tenant_id = tenantSel.value;
              }
            }
          }
          await api.updateUser(currentEntityId, data);
          break;
        case 'subject':
          await api.updateSubject(currentEntityId, data);
          break;
        case 'question':
          await api.updateQuestion(currentEntityId, data);
          break;
        case 'chapter':
          await api.updateChapter(currentEntityId, data);
          break;
        case 'questionType':
          await api.updateQuestionType(currentEntityId, data);
          break;
        case 'exam':
          await api.updateExam(currentEntityId, data);
          break;
      }
      showToast('Success', `${currentEntity} updated successfully`, 'success');
    } else {
      // Create
      switch (currentEntity) {
        case 'tenant':
          await api.createTenant(data);
          break;
        case 'user':
          {
            const roleSel = document.getElementById('userRoleSelect');
            const roleVal = roleSel ? roleSel.value : null;
            if (roleVal === 'tenant_admin') {
              if (currentUserRole !== 'super_admin') {
                showToast('Error', 'Only super admin can create tenant admins', 'error');
                return;
              }
              const tenantSel = document.getElementById('userTenantSelect');
              if (!tenantSel || !tenantSel.value) {
                showToast('Error', 'Select a tenant for the tenant admin', 'error');
                return;
              }
              data.tenant_id = tenantSel.value;
            } else if (currentUserRole === 'super_admin') {
              const tenantSel = document.getElementById('userTenantSelect');
              if (tenantSel && tenantSel.value) {
                data.tenant_id = tenantSel.value;
              }
            }
          }
          await api.createUser(data);
          break;
        case 'subject':
          await api.createSubject(data);
          break;
        case 'question':
          await api.createQuestion(data);
          break;
        case 'chapter':
          await api.createChapter(data);
          break;
        case 'questionType':
          await api.createQuestionType(data);
          break;
        case 'exam':
          await api.createExam(data);
          break;
      }
      showToast('Success', `${currentEntity} created successfully`, 'success');
    }

    entityModal.hide();
    loadPageData(currentPage);
  } catch (error) {
    showToast('Error', error.message, 'error');
  }
}

function confirmDelete(entity, id, name) {
  currentEntity = entity;
  currentEntityId = id;
  document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  deleteModal.show();
}

async function handleConfirmDelete() {
  try {
    switch (currentEntity) {
      case 'tenant':
        await api.deleteTenant(currentEntityId);
        break;
      case 'user':
        await api.deleteUser(currentEntityId);
        break;
      case 'subject':
        await api.deleteSubject(currentEntityId);
        break;
      case 'question':
        await api.deleteQuestion(currentEntityId);
        break;
      case 'chapter':
        await api.deleteChapter(currentEntityId);
        break;
      case 'questionType':
        await api.deleteQuestionType(currentEntityId);
        break;
      case 'exam':
        await api.deleteExam(currentEntityId);
        break;
    }

    showToast('Success', `${currentEntity} deleted successfully`, 'success');
    deleteModal.hide();
    loadPageData(currentPage);
  } catch (error) {
    showToast('Error', error.message, 'error');
    deleteModal.hide();
  }
}

// Search functionality
function searchTable(entity) {
  const searchInput = document.getElementById(`search${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
  const filter = searchInput.value.toLowerCase();
  const table = document.getElementById(`${entity}Table`);
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

// Cache flush
async function flushCacheAction() {
  try {
    await api.flushCache();
    showToast('Success', 'Cache flushed successfully', 'success');
    if (currentPage === 'settings') {
      loadSettings();
    }
  } catch (error) {
    showToast('Error', 'Failed to flush cache: ' + error.message, 'error');
  }
}

// Utility functions
function formatUptime(seconds) {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function showToast(title, message, type = 'info') {
  const toastEl = document.getElementById('toastNotification');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Reset classes
  toastEl.className = 'toast';
  
  // Add type-specific styling
  const bgClass = {
    success: 'border-success',
    error: 'border-danger',
    warning: 'border-warning',
    info: 'border-info',
  }[type] || 'border-info';
  
  toastEl.classList.add(bgClass);
  toast.show();
}

// Role gating utilities
function applyRoleGates() {
  try {
    const role = currentUserRole;

    // Sidebar nav gating
    const tenantsLink = document.querySelector('.sidebar .nav-link[data-page="tenants"]');
    if (tenantsLink) {
      tenantsLink.parentElement.style.display = role === 'super_admin' ? '' : 'none';
    }
    const usersLink = document.querySelector('.sidebar .nav-link[data-page="users"]');
    if (usersLink) {
      const allowed = role === 'super_admin' || role === 'tenant_admin';
      usersLink.parentElement.style.display = allowed ? '' : 'none';
    }
    const subjectsLink = document.querySelector('.sidebar .nav-link[data-page="subjects"]');
    if (subjectsLink) {
      const allowed = role === 'super_admin' || role === 'tenant_admin';
      subjectsLink.parentElement.style.display = allowed ? '' : 'none';
    }
    const chaptersLink = document.querySelector('.sidebar .nav-link[data-page="chapters"]');
    if (chaptersLink) {
      const allowed = role === 'super_admin' || role === 'tenant_admin';
      chaptersLink.parentElement.style.display = allowed ? '' : 'none';
    }
    const questionTypesLink = document.querySelector('.sidebar .nav-link[data-page="questionTypes"]');
    if (questionTypesLink) {
      const allowed = role === 'super_admin' || role === 'tenant_admin';
      questionTypesLink.parentElement.style.display = allowed ? '' : 'none';
    }

    // Elements with data-roles
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowedRoles = (el.getAttribute('data-roles') || '')
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  } catch (e) {
    console.warn('Role gating apply error:', e);
  }
}

function adjustUserRoleOptions() {
  const select = document.getElementById('userRoleSelect');
  if (!select) return;
  const role = currentUserRole;
  // Allowed roles per current user
  const allowed = role === 'super_admin'
    ? ['user', 'teacher', 'tenant_admin', 'super_admin']
    : role === 'tenant_admin'
      ? ['user', 'teacher']
      : [];
  // Remove disallowed options
  Array.from(select.options).forEach(opt => {
    if (!allowed.includes(opt.value)) {
      opt.disabled = true;
      opt.style.display = 'none';
    }
  });
}

async function populateTenantOptions(selectedId = null) {
  try {
    const container = document.getElementById('userTenantContainer');
    const select = document.getElementById('userTenantSelect');
    if (!container || !select) return;
    const res = await api.getTenants();
    const tenants = res.data?.tenants || res.data || res || [];
    select.innerHTML = '<option value="">Select Tenant</option>' +
      tenants.map(t => `<option value="${t.tenant_id}" ${String(t.tenant_id) === String(selectedId) ? 'selected' : ''}>${t.tenant_name} (${t.tenant_code})</option>`).join('');
  } catch (e) {
    console.warn('Failed to populate tenants:', e);
  }
}

// Expose functions globally
window.navigateTo = navigateTo;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.searchTable = searchTable;
window.loadHealth = loadHealth;
window.flushCacheAction = flushCacheAction;
window.loadQuestions = loadQuestions;
window.loadChapters = loadChapters;
window.filterChaptersBySubject = filterChaptersBySubject;
window.loadQuestionTypes = loadQuestionTypes;
window.filterQuestionTypesBySubject = filterQuestionTypesBySubject;
window.loadChaptersForQuestionType = loadChaptersForQuestionType;
window.loadSubjects = loadSubjects;
window.openAssignSubjectModal = openAssignSubjectModal;
window.viewSubjectUsers = viewSubjectUsers;
window.removeUserSubject = removeUserSubject;
// Expose gating helpers for debugging if needed
window.applyRoleGates = applyRoleGates;
// Shortcut: open prefilled Tenant Admin creation form
function openCreateTenantAdmin() {
  if (currentUserRole !== 'super_admin') {
    showToast('Error', 'Only super admin can create tenant admins', 'error');
    return;
  }
  // Render user form
  currentEntity = 'user';
  currentEntityId = null;
  document.getElementById('entityModalTitle').textContent = 'Create Tenant Admin';
  document.getElementById('entityFormFields').innerHTML = FormFields.user({});
  applyRoleGates();
  adjustUserRoleOptions();
  // Prefill role as tenant_admin
  const roleSel = document.getElementById('userRoleSelect');
  if (roleSel) {
    roleSel.value = 'tenant_admin';
    // Make role readonly for tenant admin creation
    roleSel.disabled = true;
  }
  // Populate tenants for selection
  populateTenantOptions();
  entityModal.show();
}
window.openCreateTenantAdmin = openCreateTenantAdmin;
