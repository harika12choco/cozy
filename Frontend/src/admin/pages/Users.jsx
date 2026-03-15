import { useEffect, useState } from "react";
import UserTable from "../components/UserTable";
import { userService } from "../services/userService";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setError("");
        const items = await userService.list();

        if (active) {
          setUsers(items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id) {
    try {
      setError("");
      await userService.remove(id);
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Users</h3>
          <p>Manage client access, customer roles, and user account status.</p>
        </div>
      </div>

      {loading ? <p>Loading users...</p> : null}
      <UserTable
        users={users}
        onRoleChange={async (id, role) => {
          try {
            setError("");
            const updated = await userService.updateRole(id, role);
            setUsers((current) => current.map((user) => (user.id === id ? updated : user)));
          } catch (updateError) {
            setError(updateError.message);
          }
        }}
        onStatusChange={async (id, status) => {
          try {
            setError("");
            const updated = await userService.updateStatus(id, status);
            setUsers((current) => current.map((user) => (user.id === id ? updated : user)));
          } catch (updateError) {
            setError(updateError.message);
          }
        }}
        onDelete={handleDelete}
      />
    </section>
  );
}
