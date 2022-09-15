const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [
  {
    "id": "a7056a47-1693-422c-b307-b0abd799f6c1",
    "name": "Jon",
    "username": "jonas1",
    "pro": false,
    "todos": [
      {
        "id": uuidv4(),
        "title": "Nome da tarefa",
        "done": false,
        "deadline": new Date(),
        "created_at": new Date()
      }
    ]
  },
  {
    "id": "b582aa9f-9efb-4489-a980-9eb2bb3f8d71",
    "name": "Jon",
    "username": "jonas2",
    "pro": false,
    "todos": []
  }
];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) return response.status(404).json({ error: 'Mensagem do erro' });

  request.user = user;

  return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { pro, todos } = request.user;

  if (!pro && todos.length >= 10) return response.status(403).json(
    { error: 'Plano básico possui máximo de 10 todos' }
  );

  return next();
}

function checksTodoExists(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username)

  if (!user) return response.status(404).json({ error: 'User not found' });

  const todoId = request.params.id;

  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  const validateUUID = regexExp.test(todoId); 

  if (!validateUUID) return response.status(400).json({ error: 'ID not valide' });

  const todoIndex = user.todos.findIndex(todos => todos.id === todoId);
  
  if (todoIndex === -1) return response.status(404).json({ error: 'Todo not found' });

  request.user = user;
  request.todo = user.todos[todoIndex];

  return next();
}

function findUserById(request, response, next) {
  const userId = request.params.id;

  if (!userId) return response.status(404).json({ error: 'User not existente' });

  const userIndex = users.findIndex(users => users.id === userId)

  if (userIndex === -1) return response.status(404).json({ error: 'User not found' });

  const user = users.find(user => user.id === userId)

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};