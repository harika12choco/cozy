const roles = ["Customer", "Client", "Admin"];
const statuses = ["active", "blocked"];

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v7h-2v-7zm4 0h2v7h-2v-7zM7 10h2v7H7v-7zm1 10h8a2 2 0 0 0 2-2V8H6v10a2 2 0 0 0 2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function UserTable({ users, onRoleChange, onStatusChange, onDelete }) {
  return (
    <div className="admin-table-shell">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Joined</th>
            <th>Orders</th>
            <th>Role</th>
            <th>Status</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="admin-table-title">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </td>
              <td>{user.joined}</td>
              <td>{user.orders}</td>
              <td>
                <select
                  className="admin-select"
                  value={user.role}
                  onChange={(event) => onRoleChange(user.id, event.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="admin-select"
                  value={user.status}
                  onChange={(event) => onStatusChange(user.id, event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="admin-icon-btn danger"
                  aria-label={`Delete ${user.name}`}
                  title="Delete"
                  onClick={() => onDelete(user.id)}
                >
                  <DeleteIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
