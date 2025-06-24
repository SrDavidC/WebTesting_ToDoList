# WebTesting ToDoList

A lightweight todo list web application focused on testability. The backend is a simple Node.js REST API storing all data in memory. The frontend is a small React single page app served statically from the same server.

## Setup

1. Install Node.js (version 18+).
2. Start the server:

```bash
npm start
```

3. Open `http://localhost:3000` in your browser.

Because the data lives in memory only, everything is reset when the server restarts.

## API Endpoints

The API exposes the following routes:

- `POST /api/register` – `{username, password}`
- `POST /api/login` – `{username, password}`
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

`GET /api/tasks` supports filtering by `status` and `priority`, as well as sorting by `dueDate`, `priority`, or `createdAt`.

The code is fully modular and can be easily extended or tested.
