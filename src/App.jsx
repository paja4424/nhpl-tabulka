import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyAZ0L2rpMT_M0IFs9qPdtiURftVaY5VruI",
  authDomain: "://firebaseapp.com",
  projectId: "nhpl-tabulka",
  storageBucket: "nhpl-tabulka.firebasestorage.app",
  messagingSenderId: "642569198112",
  appId: "1:642569198112:web:db41d557e23128e25e3a45",
  measurementId: "G-J8RYMZCM0C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const leagueDocRef = doc(db, 'nhpl', 'tabulka');

const INIT_TEAMS = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1, name: `Tým ${i + 1}`, gp: 0, w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, pts: 0, form: []
}));

const INIT_SLOTS = {
  ub1a: '', ub1b: '', ub2a: '', ub2b: '', ub3a: '', ub3b: '', ub4a: '', ub4b: '',
  ubs1a: '', ubs1b: '', ubs2a: '', ubs2b: '',
  ubfa: '', ubfb: '',
  gfa: '', gfb: '', win: '',
  lb1a: '', lb1b: '', lb2a: '', lb2b: '',
  lb21a: '', lb21b: '', lb22a: '', lb22b: '',
  lb3a: '', lb3b: '',
  lbfa: '', lbfb: ''
};

export default function App() {
  const [teams, setTeams] = useState(INIT_TEAMS);
  const [slots, setSlots] = useState(INIT_SLOTS);
  const [discord, setDiscord] = useState('https://discord.com');
  const [tab, setTab] = useState('table');
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [login, setLogin] = useState(false);
  const [pw, setPw] = useState('');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(leagueDocRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.teams) setTeams(d.teams);
        if (d.slots) setSlots({ ...INIT_SLOTS, ...d.slots });
        if (d.discord) setDiscord(d.discord);
      } else {
        setDoc(leagueDocRef, { teams: INIT_TEAMS, slots: INIT_SLOTS, discord: 'https://discord.com' });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveAll = async (t = teams, s = slots, dc = discord) => {
    setTeams(t); setSlots(s); setDiscord(dc);
    await setDoc(leagueDocRef, { teams: t, slots: s, discord: dc });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === 'Admin1977') { setAdmin(true); setLogin(false); setPw(''); }
    else alert('Špatné heslo!');
  };

  const edit = (id, key, val) => saveAll(teams.map(t => t.id === id ? { ...t, [key]: val } : t));
  const add = (id, key, d) => saveAll(teams.map(t => t.id === id ? { ...t, [key]: Math.max(0, t[key] + d) } : t));
  const setSlot = (key, val) => saveAll(teams, { ...slots, [key]: val });

  const match = (id, type) => saveAll(teams.map(t => {
    if (t.id !== id) return t;
    const f = [...(t.form || []), type].slice(-5);
    if (type === 'W') return { ...t, gp: t.gp + 1, w: t.w + 1, pts: t.pts + 3, form: f };
    if (type === 'OTW') return { ...t, gp: t.gp + 1, otw: t.otw + 1, pts: t.pts + 2, form: f };
    if (type === 'OTL') return { ...t, gp: t.gp + 1, otl: t.otl + 1, pts: t.pts + 1, form: f };
    return { ...t, gp: t.gp + 1, l: t.l + 1, form: f };
  }));

  const addTeam = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    saveAll([...teams, { id: Date.now(), name: newName.trim(), gp: 0, w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]);
    setNewName('');
  };

  const sorted = [...teams].sort((a, b) => b.pts - a.pts || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const ranked = sorted.map((t, idx) => ({ ...t, rank: idx + 1 }));
  const visible = ranked.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const Box = ({ title, k1, k2 }) => (
    <div className="m-card">
      <div className="m-lbl">{title}</div>
      <div className="m-slot">
        {admin ? <input className="br-in" placeholder="Tým 1..." value={slots[k1] || ''} onChange={e => setSlot(k1, e.target.value)} /> : <span>{slots[k1] || 'TBD'}</span>}
      </div>
      <div className="m-slot">
        {admin ? <input className="br-in" placeholder="Tým 2..." value={slots[k2] || ''} onChange={e => setSlot(k2, e.target.value)} /> : <span>{slots[k2] || 'TBD'}</span>}
      </div>
    </div>
  );

  if (loading) return <div className="wrap"><h2>Načítám NHPL...</h2></div>;

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="logo">🏒</div>
          <div><h1>NHPL <span>LEAGUE</span></h1><p className="sub">Oficiální liga • Puck • Postupuje TOP 8</p></div>
        </div>
        <div className="top-r">
          <button className={tab === 'table' ? 'btn-red' : 'btn'} onClick={() => setTab('table')}>📊 Tabulka</button>
          <button className={tab === 'playoff' ? 'btn-red' : 'btn'} onClick={() => setTab('playoff')}>🏆 Play-off</button>
          <a href={discord} target="_blank" rel="noreferrer" className="btn-dc">Discord</a>
          {!admin ? <button className="btn" onClick={() => setLogin(!login)}>🔒 Správce</button> : <button className="btn-red" onClick={() => setAdmin(false)}>✓ Hotovo</button>}
        </div>
      </header>

      {login && !admin && (
        <form className="bar" onSubmit={handleLogin}>
          <input type="password" placeholder="Heslo (Zadej tajný kód správce)" value={pw} onChange={e => setPw(e.target.value)} autoFocus />
          <button className="btn-red" type="submit">Odemknout</button>
        </form>
      )}

      {admin && (
        <div className="bar">
          <form onSubmit={addTeam}>
            <input placeholder="Nový tým..." value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="btn-red" type="submit">+ Tým</button>
          </form>
          <div className="dc-edit"><span>Discord:</span><input value={discord} onChange={e => saveAll(teams, slots, e.target.value)} /></div>
          <button className="btn" onClick={() => window.confirm('Resetovat celou ligu?') && saveAll(INIT_TEAMS, INIT_SLOTS)}>Reset</button>
        </div>
      )}

      {tab === 'table' ? (
        <section className="sec">
          <div className="sec-head">
            <h2>NHPL TABULKA</h2>
            <div className="head-tools">
              <input className="search" placeholder="🔍 Hledat tým..." value={search} onChange={e => setSearch(e.target.value)} />
              <span className="badge-top">Postupuje TOP 8</span>
            </div>
          </div>
          <div className="tbl-box">
            <table>
              <thead>
                <tr>
                  <th>#</th><th className="left">Tým</th><th>Z</th><th>V</th><th>VP</th><th>PP</th><th>P</th><th>Skóre</th><th>+/-</th><th>Forma</th><th>BODY</th>
                  {admin && <th>Zápas</th>}{admin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const i = t.rank - 1, diff = t.gf - t.ga;
                  return (
                    <tr key={t.id} className={`${i < 8 ? 'po' : ''} ${i === 0 ? 'first' : ''} ${i === 7 && !search ? 'cut' : ''}`}>
                      <td><span className="rk">{t.rank}</span></td>
                      <td className="left">
                        {admin ? <input value={t.name} onChange={e => edit(t.id, 'name', e.target.value)} /> : (
                          <div className="t-cell"><span>{i === 0 && '👑 '}{t.name}</span>{i < 8 && <small className="tag">PLAY-OFF</small>}</div>
                        )}
                      </td>
                      {['gp', 'w', 'otw', 'otl', 'l'].map(k => (
                        <td key={k}>{admin ? <><button onClick={() => add(t.id, k, -1)}>-</button> {t[k]} <button onClick={() => add(t.id, k, 1)}>+</button></> : t[k]}</td>
                      ))}
                      <td>{admin ? <><button onClick={() => add(t.id, 'gf', -1)}>-</button>{t.gf}<button onClick={() => add(t.id, 'gf', 1)}>+</button>:<button onClick={() => add(t.id, 'ga', -1)}>-</button>{t.ga}<button onClick={() => add(t.id, 'ga', 1)}>+</button></> : `${t.gf}:${t.ga}`}</td>
                      <td className={diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'dim'}>{diff > 0 ? `+${diff}` : diff}</td>
                      <td>
                        <div className="form-dots">
                          {(t.form || []).length === 0 ? <span className="dim">-</span> : (t.form || []).map((f, idx) => (
                            <span key={idx} className={`dot-f f-${f}`}>{f === 'W' ? 'V' : f === 'OTW' ? 'VP' : f === 'OTL' ? 'PP' : 'P'}</span>
                          ))}
                        </div>
                      </td>
                      <td className="pts">{admin ? <><button onClick={() => add(t.id, 'pts', -1)}>-</button> {t.pts} <button onClick={() => add(t.id, 'pts', 1)}>+</button></> : t.pts}</td>
                      {admin && (
                        <td className="q">
                          <button className="w" onClick={() => match(t.id, 'W')}>+3</button>
                          <button className="ow" onClick={() => match(t.id, 'OTW')}>+2</button>
                          <button className="ol" onClick={() => match(t.id, 'OTL')}>+1</button>
                          <button className="l" onClick={() => match(t.id, 'L')}>0</button>
                        </td>
                      )}
                      {admin && <td><button onClick={() => window.confirm('Smazat?') && saveAll(teams.filter(x => x.id !== t.id))}>🗑️</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bracket-wrap">
          <div className="br-head">
            <div><h2>PLAY-OFF PAVOUK • TOP 8</h2><p className="sub">{admin ? 'Napiš postupující týmy přímo do kolonek v pavouku' : 'Upper & Lower Bracket NHPL'}</p></div>
            {admin && <button className="btn" onClick={() => saveAll(teams, INIT_SLOTS)}>Vyčistit pavouka</button>}
          </div>
          <div className="br-section-title">UPPER BRACKET</div>
          <div className="br-grid">
            <div className="br-col"><Box title="UPPER ROUND 1 - 1" k1="ub1a" k2="ub1b" /><Box title="UPPER ROUND 1 - 2" k1="ub2a" k2="ub2b" /><Box title="UPPER ROUND 1 - 3" k1="ub3a" k2="ub3b" /><Box title="UPPER ROUND 1 - 4" k1="ub4a" k2="ub4b" /></div>
            <div className="br-col"><Box title="UPPER SEMI 1" k1="ubs1a" k2="ubs1b" /><Box title="UPPER SEMI 2" k1="ubs2a" k2="ubs2b" /></div>
            <div className="br-col"><Box title="UPPER FINAL" k1="ubfa" k2="ubfb" /></div>
            <div className="br-col"><Box title="GRAND FINAL" k1="gfa" k2="gfb" /></div>
            <div className="br-col">
              <div className="winner-box">
                <div className="m-lbl">🏆 NHPL WINNER</div>
                <div className="win-name">{admin ? <input className="br-in win-in" placeholder="Vítěz ligy..." value={slots.win || ''} onChange={e => setSlot('win', e.target.value)} /> : (slots.win || 'TBD')}</div>
              </div>
            </div>
          </div>
          <div className="br-section-title lower-t">LOWER BRACKET</div>
          <div className="br-grid">
            <div className="br-col"><Box title="LOWER ROUND 1 - 1" k1="lb1a" k2="lb1b" /><Box title="LOWER ROUND 1 - 2" k1="lb2a" k2="lb2b" /></div>
            <div className="br-col"><Box title="LOWER ROUND 2 - 1" k1="lb21a" k2="lb21b" /><Box title="LOWER ROUND 2 - 2" k1="lb22a" k2="lb22b" /></div>
            <div className="br-col"><Box title="LOWER ROUND 3" k1="lb3a" k2="lb3b" /></div>
            <div className="br-col"><Box title="LOWER FINAL" k1="lbfa" k2="lbfb" /></div>
          </div>
        </section>
      )}
    </div>
  );
}
