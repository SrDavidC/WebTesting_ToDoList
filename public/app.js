let token = '';

const msg = document.getElementById('auth-msg');

function request(method, url, data) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    },
    body: data ? JSON.stringify(data) : undefined
  }).then(r => r.json());
}

document.getElementById('register').onclick = () => {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  request('POST', '/api/register', { username, password })
    .then(d => {
      if (d.token) {
        token = d.token;
        showApp();
      } else {
        msg.textContent = d.error;
      }
    });
};

document.getElementById('login').onclick = () => {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  request('POST', '/api/login', { username, password })
    .then(d => {
      if (d.token) {
        token = d.token;
        showApp();
      } else {
        msg.textContent = d.error;
      }
    });
};

function showApp() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  loadTasks();
}

document.getElementById('add').onclick = () => {
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const dueDate = document.getElementById('dueDate').value;
  const priority = document.getElementById('priority').value;
  request('POST', '/api/tasks', { title, description, dueDate, priority })
    .then(loadTasks);
};

document.getElementById('refresh').onclick = loadTasks;

function loadTasks() {
  const status = document.getElementById('filter-status').value;
  const priority = document.getElementById('filter-priority').value;
  const sortBy = document.getElementById('sort-by').value;
  const order = document.getElementById('sort-order').value;
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (sortBy) params.append('sortBy', sortBy);
  if (order) params.append('order', order);
  request('GET', '/api/tasks?' + params.toString())
    .then(tasks => {
      const list = document.getElementById('tasks');
      list.innerHTML = '';
      tasks.forEach(t => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        if (t.status === 'completed') li.classList.add('completed');

        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between';

        const info = document.createElement('div');
        info.innerHTML = `<strong>${t.title}</strong> <span class="badge bg-secondary ms-2">${t.priority}</span>`;
        if (t.description) {
          const desc = document.createElement('div');
          desc.className = 'text-muted small';
          desc.textContent = t.description;
          info.appendChild(desc);
        }
        if (t.dueDate) {
          const due = document.createElement('div');
          due.className = 'text-muted small';
          due.textContent = t.dueDate;
          info.appendChild(due);
        }

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const done = document.createElement('button');
        done.className = 'btn btn-sm ' + (t.status === 'completed' ? 'btn-secondary' : 'btn-success');
        done.textContent = t.status === 'completed' ? 'Mark Pending' : 'Mark Done';
        done.onclick = () => {
          request('PATCH', `/api/tasks/${t.id}/status`, { status: t.status === 'completed' ? 'pending' : 'completed' })
            .then(loadTasks);
        };

        const del = document.createElement('button');
        del.className = 'btn btn-sm btn-danger ms-2';
        del.textContent = 'Delete';
        del.onclick = () => request('DELETE', `/api/tasks/${t.id}`).then(loadTasks);

        actions.appendChild(done);
        actions.appendChild(del);

        row.appendChild(info);
        row.appendChild(actions);
        li.appendChild(row);
        list.appendChild(li);
      });
    });
}
