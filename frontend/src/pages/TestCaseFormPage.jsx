import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useProject } from '../context/ProjectContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TYPES = ['Functional', 'Integration', 'Regression', 'Smoke', 'UI', 'API'];

export default function TestCaseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [type, setType] = useState('Functional');
  const [preconditions, setPreconditions] = useState('');
  const [postconditions, setPostconditions] = useState('');
  const [tags, setTags] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [steps, setSteps] = useState([{ action: '', expectedResult: '' }]);
  const [error, setError] = useState('');

  const members = currentProject?.members?.map((m) => m.user) || [];

  useEffect(() => {
    if (!isEdit) return;
    client.get(`/test-cases/${id}`).then(({ data }) => {
      setTitle(data.title);
      setDescription(data.description || '');
      setPriority(data.priority);
      setType(data.type);
      setPreconditions(data.preconditions || '');
      setPostconditions(data.postconditions || '');
      setTags((data.tags || []).join(', '));
      setAssignedToId(data.assignedToId || '');
      setSteps(data.steps?.length ? data.steps.map((s) => ({ action: s.action, expectedResult: s.expectedResult })) : [{ action: '', expectedResult: '' }]);
    });
  }, [id, isEdit]);

  const updateStep = useCallback((index, field, value) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }, []);

  const addStep = useCallback(() => setSteps((prev) => [...prev, { action: '', expectedResult: '' }]), []);
  const removeStep = useCallback((index) => setSteps((prev) => prev.filter((_, i) => i !== index)), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      projectId: currentProject.id,
      title, description, priority, type, preconditions, postconditions,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      assignedToId: assignedToId || null,
      steps: steps.filter((s) => s.action.trim()),
    };
    try {
      if (isEdit) {
        await client.patch(`/test-cases/${id}`, payload);
      } else {
        await client.post('/test-cases', payload);
      }
      navigate('/test-cases');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save test case');
    }
  }

  return (
    <div className="page">
      <h1>{isEdit ? 'Edit' : 'New'} Test Case</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <div className="form-row">
          <label>Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label>Pre-conditions<textarea value={preconditions} onChange={(e) => setPreconditions(e.target.value)} /></label>
        <label>Post-conditions<textarea value={postconditions} onChange={(e) => setPostconditions(e.target.value)} /></label>
        <label>Tags (comma-separated)<input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
        <label>Assigned To
          <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>

        <h3>Test Steps</h3>
        {steps.map((s, i) => (
          <div className="step-row" key={i}>
            <input placeholder="Action" value={s.action} onChange={(e) => updateStep(i, 'action', e.target.value)} />
            <input placeholder="Expected Result" value={s.expectedResult} onChange={(e) => updateStep(i, 'expectedResult', e.target.value)} />
            <button type="button" onClick={() => removeStep(i)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addStep}>+ Add Step</button>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn">{isEdit ? 'Save Changes' : 'Create Test Case'}</button>
      </form>
    </div>
  );
}
