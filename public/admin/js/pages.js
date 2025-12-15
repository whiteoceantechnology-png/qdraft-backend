/**
 * QB Server Admin - Page Templates
 */

const Pages = {
  // Dashboard Page
  dashboard: () => `
    <div class="fade-in">
      <div class="stats-grid" id="statsGrid">
        <div class="stat-card" data-roles="super_admin">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-value" id="statTenants">-</div>
              <div class="stat-label">Total Tenants</div>
            </div>
            <div class="icon bg-primary"><i class="bi bi-building"></i></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-value" id="statUsers">-</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="icon bg-success"><i class="bi bi-people"></i></div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8" data-roles="super_admin">
          <div class="data-card mb-4">
            <div class="data-card-header">
              <h5><i class="bi bi-server me-2"></i>System Health</h5>
              <button class="btn btn-sm btn-outline-primary" onclick="loadHealth()">
                <i class="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
            <div class="data-card-body p-3">
              <div id="healthInfo">
                <div class="loading-spinner">
                  <div class="spinner-border text-primary" role="status"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="data-card mb-4">
            <div class="data-card-header">
              <h5><i class="bi bi-lightning me-2"></i>Quick Actions</h5>
            </div>
            <div class="data-card-body p-3">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary" data-roles="super_admin" onclick="navigateTo('tenants'); openCreateModal('tenant')">
                  <i class="bi bi-plus-circle me-2"></i>Create Tenant
                </button>
                <button class="btn btn-outline-success" data-roles="super_admin,tenant_admin" onclick="navigateTo('users'); openCreateModal('user')">
                  <i class="bi bi-person-plus me-2"></i>Add User
                </button>
                <button class="btn btn-outline-warning" data-roles="super_admin" onclick="flushCacheAction()">
                  <i class="bi bi-trash me-2"></i>Flush Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  // Tenants Page
  tenants: () => `
    <div class="fade-in">
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-building me-2"></i>Manage Tenants</h5>
          <div class="d-flex gap-2">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" placeholder="Search tenants..." id="searchTenants" onkeyup="searchTable('tenants')">
            </div>
            <button class="btn btn-primary" data-roles="super_admin" onclick="openCreateModal('tenant')">
              <i class="bi bi-plus-lg me-2"></i>Add Tenant
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="table-responsive">
            <table class="table data-table" id="tenantsTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tenant Name</th>
                  <th>Code</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="tenantsTableBody">
                <tr>
                  <td colspan="9" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  // Users Page
  users: () => `
    <div class="fade-in">
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-people me-2"></i>Manage Users</h5>
          <div class="d-flex gap-2">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" placeholder="Search users..." id="searchUsers" onkeyup="searchTable('users')">
            </div>
            <button class="btn btn-primary" data-roles="super_admin,tenant_admin" onclick="openCreateModal('user')">
              <i class="bi bi-person-plus me-2"></i>Add User
            </button>
            <button class="btn btn-outline-primary" data-roles="super_admin" onclick="openCreateTenantAdmin()">
              <i class="bi bi-shield-lock me-2"></i>Add Tenant Admin
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="table-responsive">
            <table class="table data-table" id="usersTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <tr>
                  <td colspan="8" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  // Subjects Page
  subjects: () => `
    <div class="fade-in">
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-journal-bookmark me-2"></i>Manage Subjects</h5>
          <div class="d-flex gap-2">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" placeholder="Search subjects..." id="searchSubjects" onkeyup="searchTable('subjects')">
            </div>
            <button class="btn btn-primary" data-roles="super_admin,tenant_admin" onclick="openCreateModal('subject')">
              <i class="bi bi-plus-lg me-2"></i>Add Subject
            </button>
            <button class="btn btn-outline-success" data-roles="super_admin,tenant_admin" onclick="openAssignSubjectModal()">
              <i class="bi bi-person-check me-2"></i>Assign to User
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="table-responsive">
            <table class="table data-table" id="subjectsTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="subjectsTableBody">
                <tr>
                  <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  // Chapters Page
  chapters: () => `
    <div class="fade-in">
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-book me-2"></i>Manage Chapters</h5>
          <div class="d-flex gap-2">
            <select class="form-select" id="filterChapterSubject" style="width: 200px;" onchange="filterChaptersBySubject()">
              <option value="">All Subjects</option>
            </select>
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" placeholder="Search chapters..." id="searchChapters" onkeyup="searchTable('chapters')">
            </div>
            <button class="btn btn-primary" data-roles="super_admin,tenant_admin" onclick="openCreateModal('chapter')">
              <i class="bi bi-plus-lg me-2"></i>Add Chapter
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="table-responsive">
            <table class="table data-table" id="chaptersTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Chapter Name</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="chaptersTableBody">
                <tr>
                  <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  // Question Types Page
  questionTypes: () => `
    <div class="fade-in">
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-list-check me-2"></i>Manage Question Types</h5>
          <div class="d-flex gap-2">
            <select class="form-select" id="filterQTypeSubject" style="width: 200px;" onchange="filterQuestionTypesBySubject()">
              <option value="">All Subjects</option>
            </select>
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" placeholder="Search question types..." id="searchQuestionTypes" onkeyup="searchTable('questionTypes')">
            </div>
            <button class="btn btn-primary" data-roles="super_admin,tenant_admin" onclick="openCreateModal('questionType')">
              <i class="bi bi-plus-lg me-2"></i>Add Question Type
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="table-responsive">
            <table class="table data-table" id="questionTypesTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type Name</th>
                  <th>Display Name</th>
                  <th>Subject</th>
                  <th>Chapter</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="questionTypesTableBody">
                <tr>
                  <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,

  // Settings Page
  settings: () => `
    <div class="fade-in">
      <div class="row">
        <div class="col-lg-6">
          <div class="data-card mb-4">
            <div class="data-card-header">
              <h5><i class="bi bi-database me-2"></i>Cache Management</h5>
            </div>
            <div class="data-card-body p-3">
              <div id="cacheInfo">
                <div class="loading-spinner">
                  <div class="spinner-border text-primary" role="status"></div>
                </div>
              </div>
              <div class="mt-3">
                <button class="btn btn-danger" onclick="flushCacheAction()">
                  <i class="bi bi-trash me-2"></i>Flush All Cache
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="data-card mb-4">
            <div class="data-card-header">
              <h5><i class="bi bi-info-circle me-2"></i>System Info</h5>
            </div>
            <div class="data-card-body p-3">
              <div id="systemInfo">
                <div class="loading-spinner">
                  <div class="spinner-border text-primary" role="status"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="data-card">
        <div class="data-card-header">
          <h5><i class="bi bi-link-45deg me-2"></i>API Endpoints</h5>
        </div>
        <div class="data-card-body p-3">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/api-docs</code></td>
                <td>Swagger API Documentation</td>
                <td><a href="/api-docs" target="_blank" class="btn btn-sm btn-outline-primary">Open</a></td>
              </tr>
              <tr>
                <td><code>/health</code></td>
                <td>Health Check Endpoint</td>
                <td><a href="/health" target="_blank" class="btn btn-sm btn-outline-primary">Open</a></td>
              </tr>
              <tr>
                <td><code>/health/detailed</code></td>
                <td>Detailed Health Info</td>
                <td><a href="/health/detailed" target="_blank" class="btn btn-sm btn-outline-primary">Open</a></td>
              </tr>
              <tr>
                <td><code>/metrics</code></td>
                <td>System Metrics</td>
                <td><a href="/metrics" target="_blank" class="btn btn-sm btn-outline-primary">Open</a></td>
              </tr>
              <tr>
                <td><code>/status</code></td>
                <td>Express Status Monitor</td>
                <td><a href="/status" target="_blank" class="btn btn-sm btn-outline-primary">Open</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,

  // Empty State
  empty: (icon, message) => `
    <div class="empty-state">
      <i class="bi bi-${icon}"></i>
      <h5>${message}</h5>
    </div>
  `,
};

// Form Field Templates
const FormFields = {
  tenant: (data = {}) => `
    <div class="form-section">
      <div class="form-section-title">Basic Information</div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Tenant Name *</label>
          <input type="text" class="form-control" name="tenant_name" value="${data.tenant_name || ''}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Tenant Code *</label>
          <input type="text" class="form-control" name="tenant_code" value="${data.tenant_code || ''}" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" name="email" value="${data.email || ''}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Phone</label>
          <input type="text" class="form-control" name="phone" value="${data.phone || ''}">
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Website</label>
        <input type="url" class="form-control" name="website" value="${data.website || ''}">
      </div>
      <div class="mb-3">
        <label class="form-label">Address</label>
        <textarea class="form-control" name="address" rows="2">${data.address || ''}</textarea>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Subscription</div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">Plan</label>
          <select class="form-select" name="subscription_plan">
            <option value="free" ${data.subscription_plan === 'free' ? 'selected' : ''}>Free</option>
            <option value="basic" ${data.subscription_plan === 'basic' ? 'selected' : ''}>Basic</option>
            <option value="premium" ${data.subscription_plan === 'premium' ? 'selected' : ''}>Premium</option>
            <option value="enterprise" ${data.subscription_plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
          </select>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Start Date</label>
          <input type="date" class="form-control" name="subscription_start" value="${data.subscription_start ? data.subscription_start.split('T')[0] : ''}">
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">End Date</label>
          <input type="date" class="form-control" name="subscription_end" value="${data.subscription_end ? data.subscription_end.split('T')[0] : ''}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">Max Users</label>
          <input type="number" class="form-control" name="max_users" value="${data.max_users || 5}">
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Max Questions</label>
          <input type="number" class="form-control" name="max_questions" value="${data.max_questions || 1000}">
        </div>
        <div class="col-md-4 mb-3 d-flex align-items-end">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" name="is_active" id="tenantActive" ${data.is_active !== false ? 'checked' : ''}>
            <label class="form-check-label" for="tenantActive">Active</label>
          </div>
        </div>
      </div>
    </div>
  `,

  user: (data = {}) => `
    <div class="form-section">
      <div class="form-section-title">Account Information</div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Username *</label>
          <input type="text" class="form-control" name="username" value="${data.username || ''}" required ${data.user_id ? 'readonly' : ''}>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Email *</label>
          <input type="email" class="form-control" name="email" value="${data.email || ''}" required>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Password ${data.user_id ? '(leave blank to keep)' : '*'}</label>
          <input type="password" class="form-control" name="password" ${data.user_id ? '' : 'required'}>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Role</label>
          <select class="form-select" name="role" id="userRoleSelect">
            <option value="user" ${data.role === 'user' ? 'selected' : ''}>User</option>
            <option value="teacher" ${data.role === 'teacher' ? 'selected' : ''}>Teacher</option>
            <option value="tenant_admin" ${data.role === 'tenant_admin' ? 'selected' : ''}>Tenant Admin</option>
            <option value="super_admin" ${data.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
          </select>
        </div>
      </div>
      <div class="row" data-roles="super_admin" id="userTenantContainer">
        <div class="col-md-12 mb-3">
          <label class="form-label">Tenant *</label>
          <select class="form-select" name="tenant_id" id="userTenantSelect">
            <option value="">Select Tenant</option>
          </select>
          <small class="text-muted">Required when creating Tenant Admin</small>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Personal Information</div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" name="user_fname" value="${data.user_fname || ''}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Mobile Number</label>
          <input type="text" class="form-control" name="mobile_number" value="${data.mobile_number || ''}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">School Name</label>
          <input type="text" class="form-control" name="school_name" value="${data.school_name || ''}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Board</label>
          <input type="text" class="form-control" name="board" value="${data.board || ''}">
        </div>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" name="is_active" id="userActive" ${data.is_active !== false ? 'checked' : ''}>
        <label class="form-check-label" for="userActive">Active</label>
      </div>
    </div>
  `,

  subject: (data = {}) => `
    <div class="form-section">
      <div class="form-section-title">Subject Information</div>
      <div class="row">
        <div class="col-md-8 mb-3">
          <label class="form-label">Subject Name *</label>
          <input type="text" class="form-control" name="subject_name" value="${data.subject_name || ''}" required>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Subject Code</label>
          <input type="text" class="form-control" name="subject_code" value="${data.subject_code || ''}" placeholder="e.g., MATH101">
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Description</label>
        <textarea class="form-control" name="description" rows="3" placeholder="Brief description of the subject...">${data.description || ''}</textarea>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" name="is_active" id="subjectActive" ${data.is_active !== false ? 'checked' : ''}>
        <label class="form-check-label" for="subjectActive">Active</label>
      </div>
    </div>
  `,

  assignSubject: () => `
    <div class="form-section">
      <div class="form-section-title">Assign Subject to User</div>
      <div class="mb-3">
        <label class="form-label">Select User *</label>
        <select class="form-select" name="user_id" id="assignUserSelect" required>
          <option value="">Loading users...</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Select Subject *</label>
        <select class="form-select" name="subject_id" id="assignSubjectSelect" required>
          <option value="">Loading subjects...</option>
        </select>
      </div>
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        This will assign the selected subject to the user. Teachers and staff can then manage questions for their assigned subject.
      </div>
    </div>
  `,

  chapter: (data = {}) => `
    <div class="form-section">
      <div class="form-section-title">Chapter Information</div>
      <div class="mb-3">
        <label class="form-label">Chapter Name *</label>
        <input type="text" class="form-control" name="qbs_chapter_name" value="${data.qbs_chapter_name || ''}" required>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Subject *</label>
          <select class="form-select" name="qbs_sub_id" id="chapterSubjectSelect" required>
            <option value="">Loading subjects...</option>
          </select>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Department ID *</label>
          <input type="number" class="form-control" name="qbs_dept_id" value="${data.qbs_dept_id || 1}" required min="1">
          <small class="text-muted">Enter department identifier</small>
        </div>
      </div>
    </div>
  `,

  questionType: (data = {}) => `
    <div class="form-section">
      <div class="form-section-title">Question Type Information</div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Type Name *</label>
          <input type="text" class="form-control" name="qbs_qs_type_name" value="${data.qbs_qs_type_name || ''}" required placeholder="e.g., MCQ, SHORT_ANSWER">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Display Name *</label>
          <input type="text" class="form-control" name="name" value="${data.name || ''}" required placeholder="e.g., Multiple Choice Question">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Subject *</label>
          <select class="form-select" name="subject_id" id="questionTypeSubjectSelect" required onchange="loadChaptersForQuestionType()">
            <option value="">Loading subjects...</option>
          </select>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Chapter</label>
          <select class="form-select" name="chapter_id" id="questionTypeChapterSelect">
            <option value="">Select subject first...</option>
          </select>
          <small class="text-muted">Optional - assign to specific chapter</small>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Marks</label>
          <input type="number" class="form-control" name="marks" value="${data.marks || 1}" min="0" step="0.5">
        </div>
      </div>
    </div>
  `
};

// Helper functions for rendering table rows
const TableRows = {
  tenant: (item) => {
    const now = new Date();
    const startDate = item.subscription_start ? new Date(item.subscription_start) : null;
    const endDate = item.subscription_end ? new Date(item.subscription_end) : null;
    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';
    
    let subStatus = 'Active';
    let subBadge = 'bg-success';
    if (startDate && now < startDate) {
      subStatus = 'Not Started';
      subBadge = 'bg-warning';
    } else if (endDate && now > endDate) {
      subStatus = 'Expired';
      subBadge = 'bg-danger';
    } else if (endDate) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        subStatus = `${daysLeft}d left`;
        subBadge = 'bg-warning';
      }
    }
    
    return `
    <tr>
      <td>${item.tenant_id}</td>
      <td>
        <strong>${item.tenant_name}</strong>
      </td>
      <td><code>${item.tenant_code}</code></td>
      <td>${item.email || '-'}</td>
      <td><span class="badge badge-plan-${item.subscription_plan}">${item.subscription_plan}</span></td>
      <td>
        <small>${formatDate(item.subscription_start)} - ${formatDate(item.subscription_end)}</small><br>
        <span class="badge ${subBadge}">${subStatus}</span>
      </td>
      <td>
        ${item.is_active 
          ? '<span class="badge bg-success">Active</span>' 
          : '<span class="badge bg-secondary">Inactive</span>'}
      </td>
      <td>${item.max_users || 5}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" data-roles="super_admin" onclick="openEditModal('tenant', ${item.tenant_id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" data-roles="super_admin" onclick="confirmDelete('tenant', ${item.tenant_id}, '${item.tenant_name}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `;
  },

  user: (item) => `
    <tr>
      <td>${item.user_id}</td>
      <td><strong>${item.username}</strong></td>
      <td>${item.email}</td>
      <td>${item.user_fname || '-'}</td>
      <td><span class="badge badge-role-${item.role}">${item.role}</span></td>
      <td>${item.subject || item.assignedSubject?.subject_name || '<span class="text-muted">Not assigned</span>'}</td>
      <td>
        ${item.is_active 
          ? '<span class="badge bg-success">Active</span>' 
          : '<span class="badge bg-secondary">Inactive</span>'}
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" data-roles="super_admin,tenant_admin" onclick="openEditModal('user', ${item.user_id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" data-roles="super_admin,tenant_admin" onclick="confirmDelete('user', ${item.user_id}, '${item.username}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `,

  subject: (item) => `
    <tr>
      <td>${item.subject_id}</td>
      <td><strong>${item.subject_name}</strong></td>
      <td><code>${item.subject_code || '-'}</code></td>
      <td style="max-width: 300px;">
        <div class="text-truncate">${item.description || '-'}</div>
      </td>
      <td>
        ${item.is_active 
          ? '<span class="badge bg-success">Active</span>' 
          : '<span class="badge bg-secondary">Inactive</span>'}
      </td>
      <td>
        <button class="btn btn-sm btn-outline-info btn-action me-1" data-roles="super_admin,tenant_admin" onclick="viewSubjectUsers(${item.subject_id}, '${item.subject_name}')" title="View Assigned Users">
          <i class="bi bi-people"></i>
        </button>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" data-roles="super_admin,tenant_admin" onclick="openEditModal('subject', ${item.subject_id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" data-roles="super_admin,tenant_admin" onclick="confirmDelete('subject', ${item.subject_id}, '${item.subject_name}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `,

  chapter: (item, subjectsMap = {}) => `
    <tr>
      <td>${item.qbs_chapter_id}</td>
      <td><strong>${item.qbs_chapter_name}</strong></td>
      <td>${subjectsMap[item.qbs_sub_id] || item.subject_name || `Subject #${item.qbs_sub_id}`}</td>
      <td>${item.qbs_dept_id}</td>
      <td><span class="badge bg-info">${item.question_count || 0}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" data-roles="super_admin,tenant_admin" onclick="openEditModal('chapter', ${item.qbs_chapter_id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" data-roles="super_admin,tenant_admin" onclick="confirmDelete('chapter', ${item.qbs_chapter_id}, '${item.qbs_chapter_name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `,

  questionType: (item, subjectsMap = {}, chaptersMap = {}) => `
    <tr>
      <td>${item.qbs_qs_type_id}</td>
      <td><strong>${item.qbs_qs_type_name}</strong></td>
      <td>${item.name}</td>
      <td>${subjectsMap[item.subject_id] || `Subject #${item.subject_id}`}</td>
      <td>${item.chapter_id ? (chaptersMap[item.chapter_id] || `Chapter #${item.chapter_id}`) : '<span class="text-muted">-</span>'}</td>
      <td><span class="badge bg-primary">${item.marks || 1}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" data-roles="super_admin,tenant_admin" onclick="openEditModal('questionType', ${item.qbs_qs_type_id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-action" data-roles="super_admin,tenant_admin" onclick="confirmDelete('questionType', ${item.qbs_qs_type_id}, '${(item.name || item.qbs_qs_type_name).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `
};
