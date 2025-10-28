// ======= Money/Credits =======
let credits = 0;
let inventoryCount = 0;

const screenMsg = document.getElementById('screen-msg');
const creditsEl = document.getElementById('credits');
const inventoryCountEl = document.getElementById('inventoryCount');
const trayEl = document.getElementById('tray');
const moneySlotEl = document.getElementById('moneySlot');
const refundBtn = document.getElementById('refundBtn');
const miniDisplay = document.getElementById('miniDisplay');

function setMsg(msg){ screenMsg.textContent = msg; }
function setCredits(v){ credits = v; creditsEl.textContent = credits; }
function addCredits(v){
  setCredits(credits + v);
  setMsg(`+ $${v}. Choose an item.`);
  // mini screen flashes green
  miniDisplay.textContent = `+$${v}`;
  miniDisplay.style.background = 'linear-gradient(180deg, #00ff85, #00b86b)';
  miniDisplay.style.color = '#002b1a';
  setTimeout(()=>{
    miniDisplay.textContent = 'INSERT COIN';
    miniDisplay.style.background = 'linear-gradient(180deg, #00e1ff, #0092a8)';
    miniDisplay.style.color = '#012730';
  },800);
}

refundBtn.addEventListener('click', ()=>{
  if(credits <= 0){ setMsg('No credits to return.'); return; }
  setMsg(`Returned $${credits}.`);
  setCredits(0);
});

// ======= Shelf / Items =======
const ITEMS = [
  // y=4 (top row)
  { name:'🥤', type:'can',    price:50, x:1, y:4 }, // a can of coke
  { name:'🫘', type:'can',    price:50, x:2, y:4 }, // a can of beans
  { name:'🍫🥛', type:'can',  price:50, x:3, y:4 }, // a can of ovaltine
  { name:'🥛', type:'can',    price:50, x:4, y:3 }, // a can of milk
  { name:'🔫', type:'odd',    price:999,x:4, y:4 }, // a gun

  // y=3
  { name:'💧', type:'bottle', price:40, x:1, y:3 }, // water bottle
  { name:'🧈', type:'box',    price:45, x:2, y:3 }, // stick of butter
  { name:'🧪', type:'bottle', price:35, x:3, y:3 }, // weird liquid
  { name:'🍼', type:'box',    price:80, x:4, y:2 }, // baby formula

  // y=2
  { name:'🍫', type:'box',    price:50, x:1, y:2 }, // chocolate
  { name:'🍵', type:'box',    price:50, x:2, y:2 }, // neste (tea)
  { name:'🍎', type:'can',    price:55, x:3, y:2 }, // can of apples

  // y=1 (bottom row)
  { name:'☕', type:'bottle', price:35, x:1, y:1 }, // a cup of black
  { name:'👶', type:'odd',    price:999,x:2, y:1 }, // a baby
  { name:'🍔', type:'box',    price:60, x:3, y:1 }, // burger
  { name:'🌭', type:'box',    price:55, x:4, y:1 }, // hotdog
];


// Build grid
const shelfGrid = document.getElementById('shelfGrid');
const COLS = 4, ROWS = 4;
const map = new Map();
ITEMS.forEach(it=>{
  const key = `${it.x},${it.y}`;
  if(!map.has(key)) map.set(key, []);
  map.get(key).push(it);
});

for(let y=ROWS; y>=1; y--){
  for(let x=1; x<=COLS; x++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.x = x;
    cell.dataset.y = y;

    const label = document.createElement('div');
    const rowLetter = String.fromCharCode(64 + (ROWS - y + 1));
    label.className = 'cell-label';
    label.textContent = `${rowLetter}${x}`;
    cell.appendChild(label);

    const key = `${x},${y}`;
    const list = map.get(key) || [];
    list.forEach((it, idx)=>{
      const el = document.createElement('div');
      el.className = `item ${it.type}`;
      el.textContent = `${it.name}\n$${it.price}`;
      el.style.left = `calc(50% + ${idx*16 - 8}px)`;
      cell.appendChild(el);
    });

    cell.addEventListener('click', ()=>onCellClick(x,y));
    shelfGrid.appendChild(cell);
  }
}

// ======= Item Choosing / Purchase =======
const picker = document.getElementById('picker');
const pickerList = document.getElementById('pickerList');
const pickerClose = document.getElementById('pickerClose');
let currentChooseList = null;

function onCellClick(x,y){
  const key = `${x},${y}`;
  const list = map.get(key) || [];
  if(list.length === 0){ setMsg('Empty slot.'); return; }
  if(list.length === 1){ purchase(list[0]); return; }

  currentChooseList = list;
  pickerList.innerHTML = '';
  list.forEach((it)=>{
    const row = document.createElement('div');
    row.className = 'picker-item';
    row.innerHTML = `<span>${it.name}</span><span class="pprice">$${it.price}</span>`;
    row.addEventListener('click', ()=>{
      picker.classList.add('hidden');
      purchase(it);
    });
    pickerList.appendChild(row);
  });
  picker.classList.remove('hidden');
}
pickerClose.addEventListener('click', ()=>picker.classList.add('hidden'));

function purchase(item){
  if(credits < item.price){
    const shortage = item.price - credits;
    miniDisplay.textContent = `+$${shortage}`;
    miniDisplay.style.background = 'linear-gradient(180deg, #ff6b6b, #c92a2a)';
    miniDisplay.style.color = '#fff';
    miniDisplay.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
      { duration: 600 }
    );
    setTimeout(()=>{
      miniDisplay.textContent = 'INSERT COIN';
      miniDisplay.style.background = 'linear-gradient(180deg, #00e1ff, #0092a8)';
      miniDisplay.style.color = '#012730';
    }, 1500);
    return;
  }

  setCredits(credits - item.price);
  setMsg(`Dispensing ${item.name}...`);

  const cell = [...document.querySelectorAll('.cell')]
    .find(c => +c.dataset.x === item.x && +c.dataset.y === item.y);

  const ghost = document.createElement('div');
  ghost.className = `item ${item.type} falling`;
  ghost.style.left = '50%';
  ghost.style.top = '12px';
  ghost.textContent = item.name;
  cell.appendChild(ghost);

  // Fall to tray animation
  const trayRect = trayEl.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const dx = trayRect.left - cellRect.left + 120; // adjust X center
  const dy = trayRect.top - cellRect.top - 20;

  ghost.animate(
    [
      { transform: 'translate(-50%, 0)' },
      { transform: `translate(${dx}px, ${dy}px)` }
    ],
    { duration: 1000, easing: 'ease-in', fill: 'forwards' }
  );

  setTimeout(()=>{
    ghost.remove();
    spawnInTray(item);
    setMsg(`${item.name} is ready. Pick it up!`);
  }, 1000);
}

function spawnInTray(item){
  // Limit how many items can appear in tray visually
  const MAX_ITEMS = 5;

  // Create the new dispensed item
  const el = document.createElement('div');
  el.className = `item ${item.type} pickup`;
  el.style.position = 'absolute';
  el.style.bottom = '10px';
  el.style.width = '58px';
  el.style.height = '78px';
  el.textContent = item.name;

  // Calculate slot position based on how many items are already in tray
  const existing = trayEl.children.length;
  const spacing = 70; // horizontal distance between each item
  el.style.left = `${30 + existing * spacing}px`;

  // Add slight bounce animation
  el.animate(
    [
      { transform: 'translateY(-50px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    { duration: 400, easing: 'ease-out' }
  );

  // Click to pick up item
  el.addEventListener('click', () => {
    el.remove();
    inventoryCount++;
    inventoryCountEl.textContent = inventoryCount;
    setMsg(`Picked up ${item.name}. Enjoy!`);
  });

  // Append to tray
  trayEl.appendChild(el);

  // Keep tray clean if too many items
  if (trayEl.children.length > MAX_ITEMS) {
    trayEl.removeChild(trayEl.firstChild);
  }
}


// ======= Money: DRAG ONLY =======
document.querySelectorAll('.money').forEach(m=>{
  m.style.cursor = 'grab';
  m.addEventListener('dragstart', (e)=>{
    e.dataTransfer.setData('text/plain', m.dataset.value);
    m.style.opacity = '0.6';
  });
  m.addEventListener('dragend', ()=> m.style.opacity = '1');
});

moneySlotEl.addEventListener('dragenter', () => moneySlotEl.classList.add('highlight'));
moneySlotEl.addEventListener('dragleave', () => moneySlotEl.classList.remove('highlight'));
moneySlotEl.addEventListener('dragover', (e)=> e.preventDefault());
moneySlotEl.addEventListener('drop', (e)=>{
  e.preventDefault();
  moneySlotEl.classList.remove('highlight');
  const val = parseInt(e.dataTransfer.getData('text/plain') || '0', 10);
  if(!val) return;

  const slotRect = moneySlotEl.getBoundingClientRect();
  const targetX = slotRect.left + slotRect.width / 2;
  const targetY = slotRect.top + slotRect.height / 2;

  const ghost = document.createElement('div');
  ghost.className = 'money coin';
  ghost.dataset.value = val;
  ghost.textContent = val;
  ghost.style.position = 'fixed';
  ghost.style.left = `${e.clientX - 29}px`;
  ghost.style.top = `${e.clientY - 29}px`;
  ghost.style.zIndex = '1000';
  document.body.appendChild(ghost);

  const dx = targetX - e.clientX;
  const dy = targetY - e.clientY;

  ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotateY(0deg)' },
      { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(0.8) rotateY(70deg)` },
      { transform: `translate(${dx}px, ${dy}px) scale(0.4) rotateY(90deg)`, opacity: 0 }
    ],
    { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
  );

  setTimeout(()=> ghost.remove(), 620);
  setTimeout(()=> addCredits(val), 600);
});

// ======= Initial Hint =======
setTimeout(()=> setMsg('Drag money → into the slot to insert.'), 600);
