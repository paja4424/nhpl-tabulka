import React, { useState, useEffect } from 'react';
import './App.css';

const INIT = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1, name: `Tým ${i + 1}`, gp: 0, w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, pts: 0, form: []
}));

export default function App() {
  const [teams, setTeams] = useState(() => JSON.parse(localStorage.getItem('nhpl_10')) || INIT);
  const [admin, setAdmin] = useState(false);
  const [login, setLogin] = useState(false);
  const [pw, setPw] = useState('');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => localStorage.setItem('nhpl_10', JSON.stringify(teams)), [teams]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === 'admin') { setAdmin(true); setLogin(false); setPw(''); }
    else alert('Špatné heslo!');
  };

  const edit = (id, key, val) => setTeams(teams.map(t => t.id === id ? { ...t, [key]: val } : t));
  const add = (id, key, d) => setTeams(teams.map(t => t.id === id ? { ...t, [key]: Math.max(0, t[key] + d) } : t));

  const match = (id, type) => setTeams(teams.map(t => {
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
    setTeams([...teams, { id: Date.now(), name: newName.trim(), gp: 0, w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]);
    setNewName('');
  };

  const sorted = [...teams].sort((a, b) => b.pts - a.pts || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const ranked = sorted.map((t, idx) => ({ ...t, rank: idx + 1 }));
  const visible = ranked.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const leader = ranked[0];
  const topAttack = [...teams].sort((a, b) => b.gf - a.gf)[0];
  const totalGoals = teams.reduce((s, t) => s + t.gf, 0);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="logo">🏒</div>
          <div>
            <h1>NHPL <span>LEAGUE</span></h1>
            <p className="sub">Oficiální tabulka • Puck • Sezóna 2026</p>
          </div>
        </div>
        <div className="top-r">
          {!admin ? (
            <button className="btn" onClick={() => setLogin(!login)}>🔒 Správce</button>
          ) : (
            <button className="btn-red" onClick={() => setAdmin(false)}>✓ Uložit a zavřít</button>
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
            <input placeholder="Název nového týmu..." value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="btn-red" type="submit">+ Přidat tým</button>
          </form>
          <button className="btn" onClick={() => window.confirm('Resetovat na 14 týmů?') && setTeams(INIT)}>Reset 14 týmů</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="sc-lbl">👑 LÍDR TABULKY</span>
          <strong className="sc-val">{leader?.name || '-'}</strong>
          <small>{leader?.pts || 0} bodů</small>
        </div>
        <div className="stat-card">
          <span className="sc-lbl">🔥 NEJLEPŠÍ ÚTOK</span>
          <strong className="sc-val">{topAttack?.name || '-'}</strong>
          <small>{topAttack?.gf || 0} vstřelených gólů</small>
        </div>
        <div className="stat-card">
          <span className="sc-lbl">🎯 CELKEM V LIZE</span>
          <strong className="sc-val">{totalGoals} gólů</strong>
          <small>{teams.length} aktivních týmů</small>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head">
          <h2>NHPL</h2>
          <div className="head-tools">
            <input className="search" placeholder="🔍 Hledat tým..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="badge-top">Postupuje TOP 6</span>
          </div>
        </div>

        <div className="tbl-box">
          <table>
            <thead>
              <tr>
                <th>#</th><th className="left">Tým</th>
                <th>Z</th><th>V</th><th>VP</th><th>PP</th><th>P</th><th>Skóre</th><th>+/-</th><th>ÚSP</th><th>Forma</th><th>BODY</th>
                {admin && <th>Zápas</th>}{admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const i = t.rank - 1;
                const diff = t.gf - t.ga;
                const pct = t.gp > 0 ? Math.round((t.pts / (t.gp * 3)) * 100) : 0;
                return (
                  <tr key={t.id} className={`${i < 6 ? 'po' : ''} ${i === 0 ? 'first' : ''} ${i === 5 && !search ? 'cut' : ''}`}>
                    <td><span className="rk">{t.rank}</span></td>
                    <td className="left">
                      {admin ? <input value={t.name} onChange={e => edit(t.id, 'name', e.target.value)} /> : (
                        <div className="t-cell">
                          <span>{i === 0 && '👑 '}{t.name}</span>
                          {i < 6 && <small className="tag">PLAY-OFF</small>}
                        </div>
                      )}
                    </td>
                    {['gp', 'w', 'otw', 'otl', 'l'].map(k => (
                      <td key={k}>{admin ? <><button onClick={() => add(t.id, k, -1)}>-</button> {t[k]} <button onClick={() => add(t.id, k, 1)}>+</button></> : t[k]}</td>
                    ))}
                    <td>{admin ? <><button onClick={() => add(t.id, 'gf', -1)}>-</button>{t.gf}<button onClick={() => add(t.id, 'gf', 1)}>+</button>:<button onClick={() => add(t.id, 'ga', -1)}>-</button>{t.ga}<button onClick={() => add(t.id, 'ga', 1)}>+</button></> : `${t.gf}:${t.ga}`}</td>
                    <td className={diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'dim'}>{diff > 0 ? `+${diff}` : diff}</td>
                    <td className="dim">{pct}%</td>
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
                    {admin && <td><button onClick={() => window.confirm('Smazat?') && setTeams(teams.filter(x => x.id !== t.id))}>🗑️</button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
