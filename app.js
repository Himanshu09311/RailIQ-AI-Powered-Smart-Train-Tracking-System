const nav = document.getElementById('mainNav');
const toggle = document.getElementById('menuToggle');

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function trackTrain() {
  const trainNo = document.getElementById('trainNumber').value.trim();
  const result = document.getElementById('trackResult');
  if (!/^\d{4,6}$/.test(trainNo)) return (result.textContent = 'Please enter a valid 4-6 digit train number.');

  const stations = ['New Delhi', 'Kanpur', 'Prayagraj', 'Patna', 'Howrah'];
  const current = stations[Math.floor(Math.random() * stations.length)];
  const next = stations[(stations.indexOf(current) + 1) % stations.length];
  result.innerHTML = `Train <b>${trainNo}</b> is currently near <b>${current}</b>. Next halt: <b>${next}</b>. ETA: <b>${20 + Math.floor(Math.random() * 25)} mins</b>.`;
  saveRecentTrain(trainNo);
  saveSearchToDB('train_track', trainNo);
}

function checkPNR() {
  const pnr = document.getElementById('pnrNumber').value.trim();
  const result = document.getElementById('pnrResult');
  if (!/^\d{10}$/.test(pnr)) return (result.textContent = 'PNR must be exactly 10 digits.');

  const probability = 60 + Math.floor(Math.random() * 38);
  result.innerHTML = `PNR <b>${pnr}</b>: Current status <b>WL/${Math.floor(Math.random() * 20)}</b>. AI confirmation probability: <b>${probability}%</b>. Recommendation: ${probability > 80 ? 'Likely confirm ✅' : 'Keep backup plan ⚠️'}.`;
  saveSearchToDB('pnr_check', pnr);
}

function predictDelay() {
  const weather = document.getElementById('weather').value;
  const traffic = document.getElementById('traffic').value;
  const result = document.getElementById('predictResult');

  const score =
    (weather === 'clear' ? 5 : weather === 'rain' ? 18 : 30) +
    (traffic === 'low' ? 5 : traffic === 'medium' ? 12 : 22);
  const confidence = 80 + Math.floor(Math.random() * 15);

  result.innerHTML = `Predicted delay: <b>${score} minutes</b> (confidence ${confidence}%). Suggested buffer time: <b>${Math.ceil(score * 1.25)} mins</b>.`;
  aiSmartInsights();
}

function askAssistant() {
  const input = document.getElementById('userQuery');
  const query = input.value.trim();
  if (!query) return;

  const chat = document.getElementById('chatWindow');
  const userMsg = document.createElement('div');
  userMsg.className = 'bubble user';
  userMsg.textContent = query;
  chat.appendChild(userMsg);

  const aiMsg = document.createElement('div');
  aiMsg.className = 'bubble ai';
  aiMsg.textContent = generateSmartReply(query);
  chat.appendChild(aiMsg);

  input.value = '';
  chat.scrollTop = chat.scrollHeight;
}

function generateSmartReply(query) {
  const q = query.toLowerCase();
  if (q.includes('delhi') && q.includes('lucknow')) {
    return 'For Delhi → Lucknow, prefer overnight superfast options with 2A/3A availability. Want me to rank by travel time vs punctuality?';
  }
  if (q.includes('platform')) {
    return 'Platform changes are common in peak hours. Reach 30 minutes early and enable station alert notifications.';
  }
  if (q.includes('cheap') || q.includes('budget')) {
    return 'Use flexible date search (+/- 1 day) and boarding from nearby stations to find lower fares.';
  }
  return 'I can help with route planning, train comparison, delay risk, seat chances, and journey reminders.';
}

function setAlert() {
  const train = document.getElementById('alertTrain').value.trim();
  const minutes = document.getElementById('alertMinutes').value;
  const result = document.getElementById('alertResult');
  if (!/^\d{4,6}$/.test(train)) return (result.textContent = 'Enter valid train number for alert.');

  const alert = { train, minutes, createdAt: new Date().toISOString() };
  localStorage.setItem('railiq_alert', JSON.stringify(alert));
  result.innerHTML = `Reminder set for train <b>${train}</b>, <b>${minutes} mins</b> before boarding.`;
}

function saveRecentTrain(trainNo) {
  const existing = JSON.parse(localStorage.getItem('railiq_recent') || '[]');
  const merged = [trainNo, ...existing.filter((t) => t !== trainNo)].slice(0, 5);
  localStorage.setItem('railiq_recent', JSON.stringify(merged));
  renderRecentTrains();
}

function renderRecentTrains() {
  const wrap = document.getElementById('recentSearches');
  const list = JSON.parse(localStorage.getItem('railiq_recent') || '[]');
  wrap.innerHTML = list.map((t) => `<button class="chip" onclick="prefillTrain('${t}')">${t}</button>`).join('');
}

function prefillTrain(trainNo) {
  document.getElementById('trainNumber').value = trainNo;
  trackTrain();
}

function bindEnterKey(id, handler) {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handler();
  });
}

document.getElementById('trackBtn').addEventListener('click', trackTrain);
document.getElementById('pnrBtn').addEventListener('click', checkPNR);
document.getElementById('predictBtn').addEventListener('click', predictDelay);
document.getElementById('assistantBtn').addEventListener('click', askAssistant);
document.getElementById('alertBtn').addEventListener('click', setAlert);

bindEnterKey('trainNumber', trackTrain);
bindEnterKey('pnrNumber', checkPNR);
bindEnterKey('userQuery', askAssistant);

renderRecentTrains();


async function saveSearchToDB(type, value) {
  const db = await openRailiqDB();
  const tx = db.transaction('events', 'readwrite');
  tx.objectStore('events').add({ type, value, createdAt: new Date().toISOString() });
  return tx.complete;
}

function openRailiqDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('railiq_db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function aiSmartInsights() {
  const result = document.getElementById('predictResult');
  const now = new Date().getHours();
  const rush = now >= 7 && now <= 10 || now >= 18 && now <= 21;
  const tip = rush
    ? 'Peak hour detected: choose boarding 20 mins early and prefer middle coaches.'
    : 'Non-peak window: better seat comfort expected. Monitor last-mile transit only.';
  result.innerHTML += `<br/><br/><b>AI Insight:</b> ${tip}`;
}
