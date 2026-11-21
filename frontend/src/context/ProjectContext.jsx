import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(() => {
    const raw = localStorage.getItem('currentProject');
    return raw ? JSON.parse(raw) : null;
  });

  const refreshProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await client.get('/projects');
    setProjects(data);
    if (!currentProject && data.length > 0) {
      setCurrentProject(data[0]);
      localStorage.setItem('currentProject', JSON.stringify(data[0]));
    }
  }, [user, currentProject]);

  useEffect(() => {
    refreshProjects();
  }, [user]);

  const selectProject = useCallback((project) => {
    setCurrentProject(project);
    localStorage.setItem('currentProject', JSON.stringify(project));
  }, []);

  const value = useMemo(
    () => ({ projects, currentProject, selectProject, refreshProjects }),
    [projects, currentProject, selectProject, refreshProjects],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
