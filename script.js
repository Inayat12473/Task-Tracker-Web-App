// LocalStorage key
const LS_KEY = 'task-tracker-v1';

// DOM refs
const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('desc');
const dueInput = document.getElementById('due');
const priorityInput = document.getElementById('priority');
const editingId = document.getElementById('editingId');
const taskList = document.getElementById('taskList');
const emptyEl = document.getElementById('empty');
const countEl = document.getElementById('count');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const sortBy = document.getElementById('sortBy');
const search = document.getElementById('search');

let tasks = load();
render();

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(tasks)); }

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function formatDate(d){ if(!d) return ''; const dt = new Date(d); return dt.toLocaleDateString(); }
function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function validate(){
  const err = document.getElementById('titleErr');
  if(!titleInput.value.trim()){
    err.textContent = 'Title is required';
    err.style.display = 'block';
    return false;
  }
  err.style.display = 'none';
  return true;
}

// submit
taskForm.addEventListener('submit', e =>{
  e.preventDefault();
  if(!validate()) return;

  const id = editingId.value || uid();
  const exists = tasks.find(t => t.id === id);

  const obj = {
    id,
    title: titleInput.value.trim(),
    desc: descInput.value.trim(),
    due: dueInput.value || null,
    priority: priorityInput.value,
    completed: exists ? exists.completed : false,
    createdAt: exists ? exists.createdAt : Date.now()
  };

  if(exists){
    tasks = tasks.map(t => t.id === id ? obj : t);
    flash('Task updated');
  } else {
    tasks.unshift(obj);
    flash('Task added');
  }

  save();
  render();
  resetForm();
});

// reset
function resetForm(){
  taskForm.reset();
  editingId.value = '';
  document.getElementById('titleErr').style.display = 'none';
}
document.getElementById('resetBtn').addEventListener('click', resetForm);

document.getElementById('clearAll').addEventListener('click', () =>{
  if(!confirm('Delete ALL tasks?')) return;
  tasks = [];
  save();
  render();
});

// render
function render(){
  let out = [...tasks];
  const q = search.value.toLowerCase();

  if(filterStatus.value === 'active') out = out.filter(t => !t.completed);
  if(filterStatus.value === 'completed') out = out.filter(t => t.completed);
  if(filterPriority.value !== 'all') out = out.filter(t => t.priority === filterPriority.value);
  if(q) out = out.filter(t => (t.title + ' ' + t.desc).toLowerCase().includes(q));

  if(sortBy.value === 'created_desc') out.sort((a,b)=>b.createdAt-a.createdAt);
  if(sortBy.value === 'created_asc') out.sort((a,b)=>a.createdAt-b.createdAt);
  if(sortBy.value === 'due_asc') out.sort((a,b)=> (a.due||'9999') > (b.due||'9999') ? 1 : -1);
  if(sortBy.value === 'due_desc') out.sort((a,b)=> (a.due||'') < (b.due||'') ? 1 : -1);

  taskList.innerHTML = '';

  if(out.length === 0){
    emptyEl.style.display = 'block';
    countEl.textContent = tasks.length + ' tasks';
    return;
  }

  emptyEl.style.display = 'none';

  out.forEach(t =>{
    const el = document.createElement('div');
    el.className = 'task' + (t.completed ? ' completed' : '');
    el.innerHTML = `
      <div class="left" style="background:${t.priority==='high'?'#fb7185':t.priority==='medium'?'#f59e0b':'#34d399'}"></div>
      <div class="content">
        <h3>${escapeHtml(t.title)}</h3>
        <div class="muted">${t.desc ? escapeHtml(t.desc)+' • ' : ''}${t.due ? 'Due: '+formatDate(t.due) : ''}</div>
      </div>
      <div class="controls">
        <button class="small" data-action="toggle">${t.completed ? 'Undo' : 'Done'}</button>
        <button class="small" data-action="edit">Edit</button>
        <button class="small" data-action="delete">Delete</button>
      </div>
    `;

    el.querySelector('[data-action="toggle"]').onclick = () => toggleComplete(t.id);
    el.querySelector('[data-action="edit"]').onclick = () => startEdit(t.id);
    el.querySelector('[data-action="delete"]').onclick = () => deleteTask(t.id);

    taskList.appendChild(el);
  });

  countEl.textContent = tasks.length + ' tasks';
}

function startEdit(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  editingId.value = id;
  titleInput.value = t.title;
  descInput.value = t.desc;
  dueInput.value = t.due || '';
  priorityInput.value = t.priority;
}
function deleteTask(id){
  if(!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}
function toggleComplete(id){
  tasks = tasks.map(t => t.id===id ? {...t, completed:!t.completed} : t);
  save();
  render();
}

[filterStatus, filterPriority, sortBy, search].forEach(el => el.addEventListener('input', render));

function flash(msg){
  const n = document.createElement('div');
  n.textContent = msg;
  n.style.position = 'fixed';
  n.style.bottom = '20px';
  n.style.left = '50%';
  n.style.transform = 'translateX(-50%)';
  n.style.background = 'rgba(0,0,0,0.7)';
  n.style.color = 'white';
  n.style.padding = '10px 14px';
  n.style.borderRadius = '8px';
  n.style.zIndex = 9999;
  document.body.appendChild(n);
  setTimeout(()=> n.remove(), 1400);
}