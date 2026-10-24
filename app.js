// 抽奖网页演示版：纯前端逻辑，数据只存本机 localStorage，仅用于演示流程。
// 正式版切记：抽奖随机、库存扣减、次数校验必须移到后端云函数，否则前端可作弊。
const PRIZES = [
  { key: 'first', name: '一等奖', total: 1, weight: 1 },
  { key: 'second', name: '二等奖', total: 3, weight: 5 },
  { key: 'third', name: '三等奖', total: 10, weight: 20 },
];
const THANKS_WEIGHT = 74;
const DAILY_LIMIT = 3; // 演示版每天 3 次，方便测试；正式版建议每天 1 次
const LS = 'lottery-demo-v1';

function today() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
function load() {
  try { return JSON.parse(localStorage.getItem(LS)) || null; } catch (e) { return null; }
}
function defaultState() {
  return { date: today(), used: 0, stock: Object.fromEntries(PRIZES.map(p => [p.key, p.total])), wins: [] };
}
let state = load();
if (!state || state.date !== today()) state = defaultState();
function save() { localStorage.setItem(LS, JSON.stringify(state)); }
function maskPhone(p) { return p.slice(0, 3) + '****' + p.slice(7); }

function render() {
  document.getElementById('prizeList').innerHTML = PRIZES.map(p =>
    `<li><span>${p.name}</span><span>剩余 ${state.stock[p.key]} / ${p.total} 份</span></li>`).join('');
  const left = DAILY_LIMIT - state.used;
  document.getElementById('leftCount').textContent = left;
  const btn = document.getElementById('drawBtn');
  btn.disabled = left <= 0;
  btn.textContent = left <= 0 ? '今日次数已用完' : '开始抽奖';
  const list = document.getElementById('myList');
  document.getElementById('emptyTip').style.display = state.wins.length ? 'none' : 'block';
  list.innerHTML = state.wins.map(w => {
    const addr = w.address
      ? `<br>收件：${w.address.name} ${maskPhone(w.address.phone)} ${w.address.zip} ${w.address.addr}`
      : '<br>未填邮寄信息';
    return `<li>🎁 ${w.prize}（${w.time}）· 状态：${w.address ? '待邮寄' : '待填地址'}${addr}</li>`;
  }).join('');
}

let pendingWin = null;
document.getElementById('drawBtn').addEventListener('click', () => {
  if (DAILY_LIMIT - state.used <= 0) return;
  state.used += 1;
  const available = PRIZES.filter(p => state.stock[p.key] > 0);
  let total = THANKS_WEIGHT;
  available.forEach(p => total += p.weight);
  let r = Math.random() * total, hit = null;
  for (const p of available) { r -= p.weight; if (r < 0) { hit = p; break; } }
  const resEl = document.getElementById('drawResult');
  const addrCard = document.getElementById('addressCard');
  if (hit) {
    state.stock[hit.key] -= 1;
    pendingWin = { prize: hit.name, time: new Date().toLocaleString('zh-CN'), address: null };
    resEl.textContent = `🎉 恭喜！抽中${hit.name}！`;
    resEl.className = 'result win';
    document.getElementById('winPrize').textContent = hit.name;
    addrCard.classList.remove('hidden');
    addrCard.scrollIntoView({ behavior: 'smooth' });
  } else {
    resEl.textContent = '谢谢参与，再接再厉！';
    resEl.className = 'result';
    addrCard.classList.add('hidden');
    pendingWin = null;
  }
  save(); render();
});

document.getElementById('submitBtn').addEventListener('click', () => {
  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const zip = document.getElementById('fZip').value.trim();
  const addr = document.getElementById('fAddr').value.trim();
  const err = document.getElementById('formErr');
  if (!name) err.textContent = '请填写联系人';
  else if (!/^1[3-9]\d{9}$/.test(phone)) err.textContent = '手机号格式不对，应为 11 位';
  else if (!/^\d{6}$/.test(zip)) err.textContent = '邮编格式不对，应为 6 位数字';
  else if (!addr) err.textContent = '请填写邮寄地址';
  else if (!pendingWin) err.textContent = '没有待填写的中奖记录';
  else {
    err.textContent = '';
    pendingWin.address = { name, phone, zip, addr };
    state.wins.unshift(pendingWin);
    pendingWin = null;
    document.getElementById('addressCard').classList.add('hidden');
    ['fName', 'fPhone', 'fZip', 'fAddr'].forEach(id => document.getElementById(id).value = '');
    save(); render();
    alert('提交成功！奖品状态：待邮寄。');
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('确定清空演示数据吗？')) return;
  state = defaultState(); pendingWin = null; save(); render();
  document.getElementById('drawResult').textContent = '';
  document.getElementById('addressCard').classList.add('hidden');
});

render();
