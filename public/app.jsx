const { useState, useEffect } = React;

function api(method, url, data, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (data) opts.body = JSON.stringify(data);
  return fetch(url, opts).then(r => r.json());
}

function Login({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = path => {
    api('POST', path, { username, password })
      .then(d => {
        if (d.token) {
          onAuth(d.token);
        } else {
          setError(d.error || 'Error');
        }
      });
  };

  return (
    <div className="auth-panel">
      <h2>Account</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <div>
        <button onClick={() => submit('/api/login')}>Login</button>
        <button className="secondary" onClick={() => submit('/api/register')}>Register</button>
      </div>
      {error && <p className="msg error">{error}</p>}
    </div>
  );
}

function TaskForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Low');

  const submit = () => {
    onCreate({ title, description, dueDate, priority });
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Low');
  };

  return (
    <div className="task-form">
      <h3>Add Task</h3>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <button onClick={submit}>Add</button>
    </div>
  );
}

function Filters({ filters, onChange, refresh }) {
  return (
    <div className="filters">
      <select value={filters.status} onChange={e => onChange({ ...filters, status: e.target.value })}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      <select value={filters.priority} onChange={e => onChange({ ...filters, priority: e.target.value })}>
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select value={filters.sortBy} onChange={e => onChange({ ...filters, sortBy: e.target.value })}>
        <option value="createdAt">Created</option>
        <option value="dueDate">Due Date</option>
        <option value="priority">Priority</option>
      </select>
      <select value={filters.order} onChange={e => onChange({ ...filters, order: e.target.value })}>
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

function Task({ task, onToggle, onDelete }) {
  return (
    <li className={"task " + task.status}>
      <span className="title">{task.title}</span>
      <span className="meta">{task.priority} {task.dueDate ? `- ${task.dueDate}` : ''}</span>
      <div className="actions">
        <button onClick={() => onToggle(task)}>{task.status === 'completed' ? 'Undo' : 'Done'}</button>
        <button className="secondary" onClick={() => onDelete(task)}>Delete</button>
      </div>
      {task.description && <p className="desc">{task.description}</p>}
    </li>
  );
}

function App() {
  const [token, setToken] = useState('');
  const [tasks, setTasks] = useState([]);
  const [filtersState, setFilters] = useState({ status: '', priority: '', sortBy: 'createdAt', order: 'asc' });
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!token) return;
    const params = new URLSearchParams(filtersState).toString();
    api('GET', '/api/tasks?' + params, null, token).then(setTasks);
  };

  const create = data => {
    api('POST', '/api/tasks', data, token).then(t => {
      setTasks(prev => [...prev, t]);
      setMsg('Task added');
      setTimeout(() => setMsg(''), 2000);
    });
  };

  const toggle = task => {
    const status = task.status === 'completed' ? 'pending' : 'completed';
    api('PATCH', `/api/tasks/${task.id}/status`, { status }, token).then(load);
  };

  const del = task => {
    api('DELETE', `/api/tasks/${task.id}`, null, token).then(load);
  };

  useEffect(load, [token, filtersState]);

  if (!token) return <Login onAuth={setToken} />;

  return (
    <div className="container">
      <h1>ToDo List</h1>
      {msg && <p className="msg">{msg}</p>}
      <TaskForm onCreate={create} />
      <Filters filters={filtersState} onChange={setFilters} refresh={load} />
      <ul className="task-list">
        {tasks.map(t => (
          <Task key={t.id} task={t} onToggle={toggle} onDelete={del} />
        ))}
      </ul>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

