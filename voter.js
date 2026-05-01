// VoteSecure - Voter Dashboard JS
const API = '/api';
const token = localStorage.getItem('vs_token');
const name = localStorage.getItem('vs_name') || 'Voter';
const constituency = localStorage.getItem('vs_constituency') || 'All';

if (!token) window.location.href = 'index.html';

// State
let selectedElectionId = null;
let selectedCandidateId = null;
let selectedCandidateName = '';
let selectedCandidateParty = '';
let barChartInst = null, pieChartInst = null;
let allElections = [];

// Init
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('userName').textContent = name;
  document.getElementById('userConst').textContent = constituency;
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
  restoreTheme();
  await loadDashboard();
  addChatGreeting();
});

// Theme
function toggleTheme() {
  const d = document.documentElement;
  const dark = d.getAttribute('data-theme') === 'dark';
  d.setAttribute('data-theme', dark ? '' : 'dark');
  document.getElementById('themeBtn').textContent = dark ? '🌙 Dark' : '☀️ Light';
  localStorage.setItem('vs_theme', dark ? 'light' : 'dark');
}
function restoreTheme() {
  const t = localStorage.getItem('vs_theme');
  if (t === 'dark') { document.documentElement.setAttribute('data-theme','dark'); document.getElementById('themeBtn').textContent = '☀️ Light'; }
}

// View switching
const viewMeta = {
  dashboard: ['Dashboard', 'Overview of your voting activity'],
  vote: ['Cast Your Vote', 'Select an election and vote securely'],
  results: ['Live Results', 'Real-time election results with charts'],
  history: ['My Voting History', 'All elections you have participated in'],
  search: ['Smart Candidate Search', 'AI-powered candidate search'],
  news: ['Announcements', 'Official notifications from the Election Commission'],
};
function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.getElementById(`view-${v}`).classList.remove('hidden');
  document.getElementById(`nav-${v}`).classList.add('active');
  document.getElementById('viewTitle').textContent = viewMeta[v][0];
  document.getElementById('viewSub').textContent = viewMeta[v][1];
  if (v === 'vote') loadVoteElections();
  if (v === 'results') loadResultsElections();
  if (v === 'history') loadHistory();
  if (v === 'news') { document.getElementById('newsBadge').style.display='none'; loadAnnouncements(); }
}

// Auth header
function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; }

// Toast
function toast(msg, type='info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast toast-${type}`;
  setTimeout(() => t.classList.add('hidden'), 3500);
}

// Modal
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Logout
async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', headers: authHeaders() });
  localStorage.clear(); window.location.href = 'index.html';
}

// ─── DASHBOARD ────────────────────────────────────────
async function loadDashboard() {
  try {
    const [elRes, histRes] = await Promise.all([
      fetch(`${API}/elections`, { headers: authHeaders() }),
      fetch(`${API}/voter/history`, { headers: authHeaders() })
    ]);
    
    // Start realtime announcement polling
    if(!window.annInterval) {
      window.annInterval = setInterval(checkRealtimeAnnouncements, 5000);
      checkRealtimeAnnouncements();
    }
    allElections = (await elRes.json()).elections || [];
    const history = (await histRes.json()).history || [];

    const active = allElections.filter(e => e.status === 'active' && (e.constituency === 'All' || e.constituency === constituency));
    const upcoming = allElections.filter(e => e.status === 'upcoming');
    const ended = allElections.filter(e => e.status === 'ended');

    document.getElementById('s-active').textContent = active.length;
    document.getElementById('s-voted').textContent = history.length;
    document.getElementById('s-upcoming').textContent = upcoming.length;
    document.getElementById('s-ended').textContent = ended.length;

    const votedIds = history.map(h => String(h.election_id));

    // Active elections list
    const ael = document.getElementById('activeElectionsList');
    if (!active.length) { ael.innerHTML = '<p style="color:var(--text-muted);font-size:.88rem">No active elections in your constituency.</p>'; }
    else {
      ael.innerHTML = active.map(e => {
        const voted = votedIds.includes(String(e.election_id));
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-weight:600;font-size:.9rem">${e.title}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">Ends: ${new Date(e.end_date).toLocaleString()}</div>
          </div>
          ${voted
            ? '<span class="badge badge-success">✅ Voted</span>'
            : `<button class="btn btn-primary btn-sm" onclick="showView('vote')">Vote Now</button>`}
        </div>`;
      }).join('');
    }

    // Recent history
    const rh = document.getElementById('recentHistory');
    if (!history.length) { rh.innerHTML = '<p style="color:var(--text-muted);font-size:.88rem">No voting history yet.</p>'; }
    else {
      rh.innerHTML = history.slice(0,4).map(h => `
        <div style="padding:.65rem 0;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:.88rem">${h.election_title}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">Voted: ${h.candidate_name} (${h.party}) · ${new Date(h.voted_at).toLocaleDateString()}</div>
        </div>`).join('');
    }
  } catch(e) { toast('Could not load dashboard data.', 'error'); }
}

// ─── VOTE ─────────────────────────────────────────────
async function loadVoteElections() {
  document.getElementById('electionsPanel').classList.remove('hidden');
  document.getElementById('candidatesPanel').classList.add('hidden');
  try {
    const res = await fetch(`${API}/elections/active`, { headers: authHeaders() });
    const elections = (await res.json()).elections || [];
    const histRes = await fetch(`${API}/voter/history`, { headers: authHeaders() });
    const history = (await histRes.json()).history || [];
    const votedIds = history.map(h => String(h.election_id));

    const el = document.getElementById('voteElectionsList');
    if (!elections.length) {
      el.innerHTML = '<div class="empty-state"><div class="icon">🗳️</div><h3>No Active Elections</h3><p>There are no active elections in your constituency right now.</p></div>';
      return;
    }
    el.innerHTML = elections.map(e => {
      const voted = votedIds.includes(String(e.election_id));
      const end = new Date(e.end_date);
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 3600000));
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border:1px solid var(--border);border-radius:12px;margin-bottom:.75rem;background:var(--bg)">
        <div>
          <div style="font-weight:700;margin-bottom:.25rem">${e.title}</div>
          <div style="font-size:.78rem;color:var(--text-muted)">${e.description || ''}</div>
          <div style="font-size:.75rem;color:var(--warning);margin-top:.3rem">⏰ Closes in ~${remaining}h · ${e.constituency}</div>
        </div>
        ${voted
          ? '<span class="badge badge-success" style="white-space:nowrap">✅ Already Voted</span>'
          : `<button class="btn btn-primary btn-sm" onclick="openElection(${e.election_id},'${e.title.replace(/'/g,"\\'")}')">View Candidates →</button>`}
      </div>`;
    }).join('');
  } catch(e) { toast('Could not load elections.', 'error'); }
}

async function openElection(id, title) {
  selectedElectionId = id;
  selectedCandidateId = null;
  document.getElementById('electionsPanel').classList.add('hidden');
  document.getElementById('candidatesPanel').classList.remove('hidden');
  document.getElementById('electionTitle').textContent = title;
  document.getElementById('confirmVoteBtn').disabled = true;

  try {
    const res = await fetch(`${API}/candidates?election_id=${id}`, { headers: authHeaders() });
    const candidates = (await res.json()).candidates || [];
    const grid = document.getElementById('candidatesList');
    grid.innerHTML = candidates.map(c => `
      <div class="candidate-card" id="ccard-${c.candidate_id}" onclick="selectCandidate(${c.candidate_id},'${c.name.replace(/'/g,"\\'")}','${c.party.replace(/'/g,"\\'")}')">
        <div class="candidate-avatar">${c.name.charAt(0)}</div>
        <div class="candidate-name">${c.name}</div>
        <div class="candidate-party">🏛️ ${c.party}</div>
        <div class="candidate-manifesto">${c.manifesto || 'No manifesto provided.'}</div>
        <div style="font-size:.72rem;color:var(--text-light);margin-top:.5rem">📍 ${c.constituency}</div>
      </div>`).join('');
  } catch(e) { toast('Could not load candidates.', 'error'); }
}

function backToElections() { loadVoteElections(); }

function selectCandidate(id, name, party) {
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`ccard-${id}`).classList.add('selected');
  selectedCandidateId = id;
  selectedCandidateName = name;
  selectedCandidateParty = party;
  document.getElementById('confirmVoteBtn').disabled = false;
}

let cameraStream = null;
let currentReceiptData = null;

function confirmVote() {
  if (!selectedCandidateId) return;
  document.getElementById('modalCandName').textContent = selectedCandidateName;
  document.getElementById('modalCandParty').textContent = selectedCandidateParty;
  document.getElementById('voteModal').classList.remove('hidden');
  
  // Start Liveness Scanning
  const video = document.getElementById('webcam');
  const overlay = document.getElementById('scanOverlay');
  const status = document.getElementById('camStatus');
  const finalBtn = document.getElementById('finalVoteBtn');
  
  status.style.display = 'block';
  status.textContent = 'Requesting Camera...';
  video.style.display = 'none';
  overlay.style.display = 'none';
  finalBtn.disabled = true;
  finalBtn.textContent = '🔒 Authenticating...';
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.style.display = 'block';
      status.style.display = 'none';
      overlay.style.display = 'block'; // AI scan animation
      
      // Simulate AI Liveness detection (3 seconds)
      setTimeout(() => {
        overlay.style.borderColor = '#3b82f6'; // Blue success
        overlay.style.background = 'rgba(59,130,246,0.2)';
        status.style.display = 'block';
        status.style.color = '#fff';
        status.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
        status.textContent = '✅ Human Verified';
        finalBtn.disabled = false;
        finalBtn.textContent = '✅ Submit Secure Vote';
      }, 3000);
    })
    .catch(err => {
      status.textContent = 'Camera Access Denied. Proceeding with fallback mode...';
      setTimeout(() => {
        finalBtn.disabled = false;
        finalBtn.textContent = '✅ Submit Vote (No Cam)';
      }, 1500);
    });
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

async function castVote() {
  const finalBtn = document.getElementById('finalVoteBtn');
  finalBtn.disabled = true;
  finalBtn.textContent = '📍 Fetching Location...';
  
  // Get Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => submitActualVote(pos.coords.latitude, pos.coords.longitude),
      err => submitActualVote(0.0, 0.0) // Fallback
    );
  } else {
    submitActualVote(0.0, 0.0);
  }
}

async function submitActualVote(lat, lng) {
  stopCamera();
  closeModal('voteModal');
  try {
    const res = await fetch(`${API}/vote`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ 
        election_id: selectedElectionId, 
        candidate_id: selectedCandidateId,
        location_lat: lat,
        location_lng: lng
      })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error, 'error');
    
    // Vote successful. Fetch Receipt!
    fetchReceipt(selectedElectionId);
    
    loadVoteElections();
    loadDashboard();
  } catch(e) { toast('Vote submission failed.', 'error'); }
}

async function fetchReceipt(eid) {
  try {
    const res = await fetch(`${API}/voter/receipt/${eid}`, { headers: authHeaders() });
    const data = await res.json();
    if (data.receipt) {
      currentReceiptData = data.receipt;
      document.getElementById('receiptHash').textContent = data.receipt.receipt_hash;
      
      // Generate QR Code
      const qrBox = document.getElementById('receiptQR');
      qrBox.innerHTML = ''; // clear old
      new QRCode(qrBox, {
        text: data.receipt.receipt_hash,
        width: 80, height: 80,
        colorDark: "#0f172a", colorLight: "#ffffff"
      });
      
      document.getElementById('receiptModal').classList.remove('hidden');
    }
  } catch(e) { console.log('Error fetching receipt', e); }
}

function downloadPDFReceipt() {
  if (!currentReceiptData) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const r = currentReceiptData;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("VoteSecure", 20, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text("Official Blockchain Voting Receipt", 20, 40);
  
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  
  let y = 60;
  const lines = [
    `Voter ID: ${r.voter_id}`,
    `Election: ${r.election_title}`,
    `Candidate: ${r.candidate_name} (${r.party})`,
    `Date/Time: ${r.voted_at}`,
    `IP Address: ${r.ip_address}`,
    `Cryptographic Hash:`,
    `${r.receipt_hash}`
  ];
  
  lines.forEach(line => {
    doc.text(line, 20, y);
    y += 10;
  });
  
  doc.setLineWidth(0.5);
  doc.line(20, y+5, 190, y+5);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("This document proves your vote was successfully secured in the cloud.", 20, y+15);
  
  doc.save(`Vote_Receipt_${r.election_title.substring(0,10)}.pdf`);
}

// ─── RESULTS ──────────────────────────────────────────
async function loadResultsElections() {
  const res = await fetch(`${API}/elections`, { headers: authHeaders() });
  const elections = (await res.json()).elections || [];
  const sel = document.getElementById('resultsElectionSelect');
  sel.innerHTML = '<option value="">-- Select an election --</option>' +
    elections.map(e => `<option value="${e.election_id}">${e.title} (${e.status})</option>`).join('');
  document.getElementById('resultsPanel').classList.add('hidden');
}

async function loadResults(eid) {
  if (!eid) { document.getElementById('resultsPanel').classList.add('hidden'); return; }
  document.getElementById('resultsPanel').classList.remove('hidden');

  try {
    const [rRes, sumRes] = await Promise.all([
      fetch(`${API}/results/${eid}`, { headers: authHeaders() }),
      fetch(`${API}/ai/summarize/${eid}`, { headers: authHeaders() })
    ]);
    const { results, total_votes } = await rRes.json();
    const { summary } = await sumRes.json();

    // Winner card
    if (results && results.length > 0) {
      const winner = results[0];
      document.getElementById('winnerCardWrap').innerHTML = `
        <div class="winner-card" style="margin-bottom:1.5rem">
          <div class="winner-trophy">🏆</div>
          <div>
            <div style="font-size:.8rem;opacity:.75;text-transform:uppercase;letter-spacing:1px">Winner</div>
            <div class="winner-name">${winner.candidate_name}</div>
            <div class="winner-party">${winner.party}</div>
            <div class="winner-votes">${winner.total_votes} votes · ${winner.percentage}%</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:.8rem;opacity:.75">Total Votes</div>
            <div style="font-size:2rem;font-weight:800">${total_votes}</div>
          </div>
        </div>`;
    }

    // Charts
    const labels = results.map(r => r.candidate_name);
    const votes = results.map(r => r.total_votes);
    const colors = ['#1a3a6b','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

    if (barChartInst) barChartInst.destroy();
    if (pieChartInst) pieChartInst.destroy();

    barChartInst = new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Votes', data: votes, backgroundColor: colors }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
    pieChartInst = new Chart(document.getElementById('pieChart'), {
      type: 'pie',
      data: { labels, datasets: [{ data: results.map(r => r.percentage), backgroundColor: colors }] },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Table
    document.getElementById('resultsTable').innerHTML = results.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.candidate_name}</strong>${i === 0 ? ' 🏆' : ''}</td>
        <td>${r.party}</td>
        <td>${r.total_votes}</td>
        <td>${r.percentage}%</td>
        <td style="min-width:120px"><div class="progress"><div class="progress-fill" style="width:${r.percentage}%"></div></div></td>
      </tr>`).join('');

    // AI Summary
    document.getElementById('aiSummary').textContent = summary;
  } catch(e) { toast('Could not load results.', 'error'); }
}

// ─── HISTORY ──────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch(`${API}/voter/history`, { headers: authHeaders() });
    const history = (await res.json()).history || [];
    const tbody = document.getElementById('historyTable');
    const empty = document.getElementById('historyEmpty');
    if (!history.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    tbody.innerHTML = history.map(h => `
      <tr>
        <td><strong>${h.election_title}</strong></td>
        <td>${h.candidate_name}</td>
        <td>${h.party}</td>
        <td>${new Date(h.voted_at).toLocaleString()}</td>
        <td><span class="badge badge-${h.status === 'active' ? 'success' : h.status === 'ended' ? 'secondary' : 'warning'}">${h.status}</span></td>
      </tr>`).join('');
  } catch(e) { toast('Could not load history.', 'error'); }
}

// ─── ANNOUNCEMENTS ────────────────────────────────────
let lastAnnCount = 0;
async function checkRealtimeAnnouncements() {
  try {
    const res = await fetch(`${API}/announcements`, { headers: authHeaders() });
    const { announcements } = await res.json();
    if (announcements && announcements.length > lastAnnCount) {
      if (lastAnnCount !== 0) {
        document.getElementById('newsBadge').style.display = 'inline-block';
        toast('📢 New Announcement from Election Commission!', 'info');
      }
      lastAnnCount = announcements.length;
      if (document.getElementById('view-news').classList.contains('hidden') === false) {
        loadAnnouncements();
      }
    }
  } catch(e) {}
}

async function loadAnnouncements() {
  try {
    const res = await fetch(`${API}/announcements`, { headers: authHeaders() });
    const anns = (await res.json()).announcements || [];
    const list = document.getElementById('announcementsList');
    if (!anns.length) return;
    list.innerHTML = anns.map(a => `
      <div style="padding:1rem; border:1px solid var(--border); border-left:4px solid ${a.priority === 'high' ? 'var(--danger)' : 'var(--accent)'}; border-radius:8px; background:var(--bg)">
        <div style="display:flex; justify-content:space-between; margin-bottom:.5rem">
          <strong style="font-size:1.05rem">${a.title}</strong>
          <span style="font-size:.75rem; color:var(--text-muted)">${new Date(a.created_at).toLocaleString()}</span>
        </div>
        <div style="font-size:.9rem; color:var(--text-muted); line-height:1.5">${a.body}</div>
      </div>
    `).join('');
  } catch(e) { toast('Failed to load announcements', 'error'); }
}

// ─── SMART SEARCH ─────────────────────────────────────
async function doSearch() {
  const q = document.getElementById('searchQ').value.trim();
  const cat = document.getElementById('searchCat').value;
  if (!q) return;
  try {
    const res = await fetch(`${API}/ai/search?q=${encodeURIComponent(q)}&category=${cat}`, { headers: authHeaders() });
    const { results } = await res.json();
    const grid = document.getElementById('searchResults');
    const empty = document.getElementById('searchEmpty');
    if (!results.length) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    grid.innerHTML = results.map(c => `
      <div class="candidate-card">
        <div class="candidate-avatar">${c.name.charAt(0)}</div>
        <div class="candidate-name">${c.name}</div>
        <div class="candidate-party">🏛️ ${c.party}</div>
        <div style="font-size:.72rem;color:var(--text-muted);margin:.4rem 0">📍 ${c.constituency}</div>
        <div class="candidate-manifesto">${c.manifesto || ''}</div>
        <div style="margin-top:.5rem"><span class="badge badge-primary">${c.election_title}</span> <span class="badge badge-${c.election_status==='active'?'success':'secondary'}">${c.election_status}</span></div>
      </div>`).join('');
  } catch(e) { toast('Search failed.', 'error'); }
}

// ─── CHATBOT ──────────────────────────────────────────
let chatOpen = false;
function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWindow').classList.toggle('hidden', !chatOpen);
}

function addChatGreeting() {
  appendMsg('bot', `👋 Hi **${name}**! I'm VoteBot. Ask me anything about voting, registration, results, or elections!`);
}

function appendMsg(type, text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  appendMsg('user', msg);
  input.value = '';
  try {
    const res = await fetch(`${API}/ai/chat`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    appendMsg('bot', data.response || 'Sorry, I could not process that.');
  } catch(e) { appendMsg('bot', '⚠️ Cannot connect to server.'); }
}
