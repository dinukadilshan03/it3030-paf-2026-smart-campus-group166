import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  createUser,
  getUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from '../services/userService';
import type { CreateUserRequest, RoleType, User, UserStatus } from '../types/auth';

const emptyCreateForm: CreateUserRequest = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
  department: '',
  phone: '',
};

export function AdminUsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createForm, setCreateForm] = useState<CreateUserRequest>(emptyCreateForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextUsers = await getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers().catch(() => undefined);
  }, [roleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((entry) => entry.status === 'ACTIVE').length,
      admins: users.filter((entry) => entry.role === 'ADMIN').length,
    }),
    [users]
  );

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await createUser(createForm);
      setCreateForm(emptyCreateForm);
      await loadUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await loadUsers();
  };

  const handleInlineUpdate = async (selectedUser: User) => {
    setError('');

    try {
      await updateUser(selectedUser.userId, {
        name: selectedUser.name,
        email: selectedUser.email,
        department: selectedUser.department ?? '',
        phone: selectedUser.phone ?? '',
      });
      setEditingUserId(null);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update user.');
    }
  };

  const handleRoleChange = async (selectedUser: User, role: RoleType) => {
    try {
      await updateUserRole(selectedUser.userId, role);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to change role.');
    }
  };

  const handleStatusChange = async (selectedUser: User, status: UserStatus) => {
    try {
      await updateUserStatus(selectedUser.userId, status);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to change status.');
    }
  };

  const updateEditingField = (
    userId: number,
    field: 'name' | 'email' | 'department' | 'phone',
    value: string
  ) => {
    setUsers((currentUsers) =>
      currentUsers.map((entry) =>
        entry.userId === userId
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      )
    );
  };

  return (
    <div className="page-shell">
      <div className="app-shell">
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Admin Control</span>
            <h1>Identity and access management</h1>
            <p>
              Signed in as {user?.name} ({user?.role})
            </p>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => loadUsers()}>
              Refresh
            </button>
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        {error ? <div className="status-banner error">{error}</div> : null}

        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Total users</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active accounts</p>
            <p className="stat-value">{stats.active}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Admins</p>
            <p className="stat-value">{stats.admins}</p>
          </div>
        </section>

        <div className="layout-grid">
          <aside className="panel">
            <span className="eyebrow">Create User</span>
            <h2 className="section-title">Bootstrap your campus team</h2>
            <p className="helper-text">
              Create local accounts first. Google-linked users can attach later when they sign in
              with the same email.
            </p>

            <form className="stack" onSubmit={handleCreateUser}>
              <div className="field-grid two-col">
                <div className="field">
                  <label>
                    Full name
                    <input
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Role
                    <select
                      value={createForm.role}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          role: event.target.value as RoleType,
                        }))
                      }
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                      <option value="TECHNICIAN">TECHNICIAN</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="field">
                <label>
                  Email
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="field">
                <label>
                  Temporary password
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, password: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="field-grid two-col">
                <div className="field">
                  <label>
                    Department
                    <input
                      value={createForm.department}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Phone
                    <input
                      value={createForm.phone}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="button-row">
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </aside>

          <section className="table-panel">
            <span className="eyebrow">Directory</span>
            <h2 className="section-title">Campus accounts</h2>

            <form className="toolbar" onSubmit={handleSearchSubmit}>
              <div className="filter">
                <label>
                  Search
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or email"
                  />
                </label>
              </div>
              <div className="filter">
                <label>
                  Role
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                    <option value="">All roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                  </select>
                </label>
              </div>
              <div className="filter">
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </label>
              </div>
              <div className="button-row">
                <button className="secondary-button" type="submit">
                  Apply Filters
                </button>
              </div>
            </form>

            {isLoading ? <div className="status-banner info">Loading users...</div> : null}

            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Access</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((entry) => {
                    const isEditing = editingUserId === entry.userId;

                    return (
                      <tr key={entry.userId}>
                        <td>
                          {isEditing ? (
                            <div className="stack">
                              <input
                                value={entry.name}
                                onChange={(event) =>
                                  updateEditingField(entry.userId, 'name', event.target.value)
                                }
                              />
                              <input
                                value={entry.email}
                                onChange={(event) =>
                                  updateEditingField(entry.userId, 'email', event.target.value)
                                }
                              />
                              <input
                                value={entry.department ?? ''}
                                onChange={(event) =>
                                  updateEditingField(entry.userId, 'department', event.target.value)
                                }
                                placeholder="Department"
                              />
                              <input
                                value={entry.phone ?? ''}
                                onChange={(event) =>
                                  updateEditingField(entry.userId, 'phone', event.target.value)
                                }
                                placeholder="Phone"
                              />
                            </div>
                          ) : (
                            <div>
                              <strong>{entry.name}</strong>
                              <div className="muted">{entry.email}</div>
                              <div className="muted">
                                {entry.department || 'No department'} - {entry.phone || 'No phone'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="stack">
                            <span className="badge role">{entry.role}</span>
                            <select
                              value={entry.role}
                              onChange={(event) =>
                                handleRoleChange(entry, event.target.value as RoleType)
                              }
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="USER">USER</option>
                              <option value="TECHNICIAN">TECHNICIAN</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div className="stack">
                            <span className={`badge status-${entry.status}`}>{entry.status}</span>
                            <select
                              value={entry.status}
                              onChange={(event) =>
                                handleStatusChange(entry, event.target.value as UserStatus)
                              }
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div className="muted">
                            Provider: {entry.oauthProvider ?? 'LOCAL'}
                            <br />
                            Local password: {entry.localAccount ? 'Enabled' : 'Not set'}
                          </div>
                        </td>
                        <td>
                          <div className="inline-actions">
                            {isEditing ? (
                              <>
                                <button
                                  className="primary-button"
                                  type="button"
                                  onClick={() => handleInlineUpdate(entry)}
                                >
                                  Save
                                </button>
                                <button
                                  className="ghost-button"
                                  type="button"
                                  onClick={() => {
                                    setEditingUserId(null);
                                    loadUsers().catch(() => undefined);
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setEditingUserId(entry.userId)}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
