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

const INIT_BRACKET = {
  ub1: ['TBD', 'TBD'], ub2: ['TBD', 'TBD'], ub3: ['TBD', 'TBD'], ub4: ['TBD', 'TBD'],
  ubSemi1: ['TBD', 'TBD'], ubSemi2: ['TBD', 'TBD'], ubFinal: ['TBD', 'TBD'],
  lb1: ['TBD', 'TBD'], lb2: ['TBD', 'TBD'],
  lb2_1: ['TBD', 'TBD'], lb2_2: ['TBD', 'TBD'],
  lb3: ['TBD', 'TBD'], lbFinal: ['TBD', 'TBD'],
  grand: ['TBD', 'TBD'], winner: 'TBD'
};

export default function App() {
  const [teams, setTeams] = useState(INIT_TEAMS);
  const [bracket, setBracket] = useState(INIT_BRACKET);
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
        if (d.bracket) setBracket({ ...INIT_BRACKET, ...d.bracket });
        if (d.discord) setDiscord(d.discord);
      } else {
        setDoc(leagueDocRef, { teams: INIT_TEAMS, bracket: INIT_BRACKET, discord: 'https://discord.com' });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveAll = async (t = teams, b = bracket, dc = discord) => {
    setTeams(t); setBracket(b); setDiscord(dc);
    await setDoc(leagueDocRef, { teams: t, bracket: b, discord: dc });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === 'Admin1977') { setAdmin(true); setLogin(false); setPw(''); }
    else alert('Špatné heslo!');
  };

  const edit = (id, key, val) => saveAll(teams.map(t => t.id === id ? { ...t, [key]: val } : t));
  const add = (id, key, d) => saveAll(teams.map(t => t.id === id ? { ...t, [key]: Math.max(0, t[key] + d) } : t));

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

  const seedTop8 = () => {
    if (ranked.length < 8) return alert('Potřebuješ alespoň 8 týmů!');
    const nb = {
      ...INIT_BRACKET,
      ub1: [ranked.at(0).name, ranked.at(7).name],
      ub2: [ranked.at(3).name, ranked.at(4).name],
      ub3: [ranked.at(1).name, ranked.at(6).name],
      ub4: [ranked.at(2).name, ranked.at(5).name],
    };
    saveAll(teams, nb);
  };
  const pickWin = (mKey, idx) => {
    if (!admin) return;
    const winT = bracket[mKey][idx];
    const loseT = bracket[mKey][idx === 0 ? 1 : 0];
    if (!winT || winT === 'TBD') return;
    const nb = { ...bracket };
    const setSlot = (k, s, val) => { nb[k] = [...nb[k]]; nb[k][s] = val; };

    if (mKey === 'ub1') { setSlot('ubSemi1', 0, winT); setSlot('lb1', 0, loseT); }
    if (mKey === 'ub2') { setSlot('ubSemi1', 1, winT); setSlot('lb1', 1, loseT); }
    if (mKey === 'ub3') { setSlot('ubSemi2', 0, winT); setSlot('lb2', 0, loseT); }
    if (mKey === 'ub4') { setSlot('ubSemi2', 1, winT); setSlot('lb2', 1, loseT); }
    if (mKey === 'ubSemi1') { setSlot('ubFinal', 0, winT); setSlot('lb2_2', 0, loseT); }
    if (mKey === 'ubSemi2') { setSlot('ubFinal', 1, winT); setSlot('lb2_1', 0, loseT); }
    if (mKey === 'ubFinal') { setSlot('grand', 0, winT); setSlot('lbFinal', 0, loseT); }
    if (mKey === 'lb1') setSlot('lb2_1', 1, winT);
    if (mKey === 'lb2') setSlot('lb2_2', 1, winT);
    if (mKey === 'lb2_1') setSlot('lb3', 0, winT);
    if (mKey === 'lb2_2') setSlot('lb3', 1, winT);
    if (mKey === 'lb3') setSlot('lbFinal', 1, winT);
    if (mKey === 'lbFinal') setSlot('grand', 1, winT);
    if (mKey === 'grand') nb.winner = winT;
    saveAll(teams, nb);
  };

  const MatchBox = ({ label, mKey }) => (
    <div className="m-card">
      <div className="m-lbl">{label}</div>
      {map(idx => (
        <div key={idx} className={`m-slot ${admin ? 'clk' : ''}`} onClick={() => pickWin(mKey, idx)}>
          <span>{bracket[mKey]?.[idx] || 'TBD'}</span>
          {admin && bracket[mKey]?.[idx] !== 'TBD' && <small>✓</small>}
        </div>
      ))}
    </div>
  );

  if (loading) return <div className="wrap"><h2>Načítám NHPL...</h2></div>;

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="logo">🏒</div>
          <div>
            <h1>NHPL <span>LEAGUE</span></h1>
            <p className="sub">Oficiální liga • Puck • Postupuje TOP 8</p>
          </div>
        </div>
        <div className="top-r">
          <button className={tab === 'table' ? 'btn-red' : 'btn'} onClick={() => setTab('table')}>📊 Tabulka</button>
          <button className={tab === 'playoff' ? 'btn-red' : 'btn'} onClick={() => setTab('playoff')}>🏆 Play-off</button>
          <a href={discord} target="_blank" rel="noreferrer" className="btn-dc">Discord</a>
          {!admin ? (
            <button className="btn" onClick={() => setLogin(!login)}>🔒 Správce</button>
          ) : (
            <button className="btn-red" onClick={() => setAdmin(false)}>✓ Hotovo</button>
          )}
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
          <div className="dc-edit">
            <span>Discord URL:</span>
            <input value={discord} onChange={e => saveAll(teams, bracket, e.target.value)} />
          </div>
          <button className="btn" onClick={() => window.confirm('Resetovat ligu?') && saveAll(INIT_TEAMS, INIT_BRACKET)}>Reset</button>
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
                  <th>#</th><th className="left">Tým</th>
                  <th>Z</th><th>V</th><th>VP</th><th>PP</th><th>P</th><th>Skóre</th><th>+/-</th><th>Forma</th><th>BODY</th>
                  {admin && <th>Zápas</th>}{admin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const i = t.rank - 1;
                  const diff = t.gf - t.ga;
                  return (
                    <tr key={t.id} className={`${i < 8 ? 'po' : ''} ${i === 0 ? 'first' : ''} ${i === 7 && !search ? 'cut' : ''}`}>
                      <td><span className="rk">{t.rank}</span></td>
                      <td className="left">
                        {admin ? <input value={t.name} onChange={e => edit(t.id, 'name', e.target.value)} /> : (
                          <div className="t-cell">
                            <span>{i === 0 && '👑 '}{t.name}</span>
                            {i < 8 && <small className="tag">PLAY-OFF</small>}
                          </div>
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
            <div>
              <h2>BRACKET STAGE • TOP 8 PLAY-OFF</h2>
              <p className="sub">{admin ? 'Klikni na tým v zápase pro postup vítěze do dalšího kola' : 'Vyřazovací část NHPL (Upper & Lower Bracket)'}</p>
            </div>
            {admin && (
              <div className="top-r">
                <button className="btn-red" onClick={seedTop8}>⚡ Načíst TOP 8 z tabulky</button>
                <button className="btn" onClick={() => saveAll(teams, INIT_BRACKET)}>Vyčistit pavouka</button>
              </div>
            )}
          </div>

          <div className="br-section-title">UPPER BRACKET</div>
          <div className="br-grid">
            <div className="br-col">
              <MatchBox label="UPPER ROUND 1 - 1 (1. vs 8.)" mKey="ub1" />
              <MatchBox label="UPPER ROUND 1 - 2 (4. vs 5.)" mKey="ub2" />
              <MatchBox label="UPPER ROUND 1 - 3 (2. vs 7.)" mKey="ub3" />
              <MatchBox label="UPPER ROUND 1 - 4 (3. vs 6.)" mKey="ub4" />
            </div>
            <div className="br-col">
              <MatchBox label="UPPER ROUND 2 - 1" mKey="ubSemi1" />
              <MatchBox label="UPPER ROUND 2 - 2" mKey="ubSemi2" />
            </div>
            <div className="br-col">
              <MatchBox label="UPPER FINAL" mKey="ubFinal" />
            </div>
            <div className="br-col">
              <MatchBox label="GRAND FINAL" mKey="grand" />
            </div>
            <div className="br-col">
              <div className="winner-box">
                <div className="m-lbl">🏆 NHPL WINNER</div>
                <div className="win-name">{bracket.winner}</div>
              </div>
            </div>
          </div>

          <div className="br-section-title lower-t">LOWER BRACKET</div>
          <div className="br-grid">
            <div className="br-col">
              <MatchBox label="LOWER ROUND 1 - 1" mKey="lb1" />
              <MatchBox label="LOWER ROUND 1 - 2" mKey="lb2" />
            </div>
            <div className="br-col">
              <MatchBox label="LOWER ROUND 2 - 1" mKey="lb2_1" />
              <MatchBox label="LOWER ROUND 2 - 2" mKey="lb2_2" />
            </div>
            <div className="br-col">
              <MatchBox label="LOWER ROUND 3" mKey="lb3" />
            </div>
            <div className="br-col">
              <MatchBox label="LOWER FINAL" mKey="lbFinal" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
