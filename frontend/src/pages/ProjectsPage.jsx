import { useState } from 'react';
import client from '../api/client';
import { useProject } from '../context/ProjectContext';

export default function ProjectsPage() {
  const { projects, refreshProjects } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');

  async function handleCreate(e) {
    e.preventDefault();
    await client.post('/projects', { name, description, version, status: 'Active' });
    setName('');
    setDescription('');
    refreshProjects();
  }

  return (
    <div className="page">
      <h1>Projects</h1>
      <form className="form-inline" onSubmit={handleCreate}>
        <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input placeholder="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        <button type="submit" className="btn">Create Project</button>
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Description</th><th>Version</th><th>Status</th><th>Members</th></tr></thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.version}</td>
              <td>{p.status}</td>
              <td>{p.members?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
