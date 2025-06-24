# WebTesting ToDoList

This project provides a minimal todo list web application with a Node.js backend and a plain JavaScript frontend. The backend stores data in memory and exposes a REST API. The frontend is a simple single page app.

## Setup

1. Install Node.js (version 18+). No external npm packages are required.
2. Run the server:

```bash
node server/server.js
```

3. Visit `http://localhost:3000` in your browser to use the app.

## API

- `POST /api/register` – `{username, password}`
- `POST /api/login` – `{username, password}`
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

Filtering and sorting are available via query parameters on `GET /api/tasks`.

Because all data is held in memory, it will be lost when the server restarts. The code has been kept modular so it can be easily extended or tested.
