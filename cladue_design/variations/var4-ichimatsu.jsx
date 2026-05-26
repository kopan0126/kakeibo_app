// var4-ichimatsu.jsx — 市松 (Ichimatsu): geometric checkerboard editorial.
// Aesthetic: dense info, modern editorial grid, sharp angles, ichimatsu
// pattern motif in subtle blocks. 浅葱 (asagi) teal accent.

const ICHI = {
  paper:    '#FAF7F0',
  paper2:   '#F2EDE0',
  paperDk:  '#E5DDC8',
  ink:      '#1F1B17',
  ink2:     '#403933',
  muted:    '#8a8175',
  asagi:    '#3A7E85',     // 浅葱
  asagiDk:  '#2A5C61',
  asagiSoft:'#A6C5C9',
  shu:      '#B4322A',
  rule:     '#d8cfb8',
  font:     "'Shippori Mincho', 'Noto Serif JP', serif",
  sans:     "'Noto Sans JP', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

function IchiShell({ children }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 32,
      background: ICHI.paper, color: ICHI.ink, fontFamily: ICHI.sans,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 18px 44px -22px rgba(31,27,23,0.3)',
      border: '1px solid ' + ICHI.rule,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 36, padding: '12px 22px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 700, color: ICHI.ink, fontFamily: ICHI.mono,
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 1 }}>●●●</span>
      </div>
      {children}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 2, background: 'rgba(31,27,23,0.5)' }} />
    </div>
  );
}

// Ichimatsu checkerboard mini-pattern, drawn as inline svg block
function IchiPattern({ size = 28, color = ICHI.ink, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 4 4" style={{ display: 'block', opacity }}>
      <rect x="0" y="0" width="2" height="2" fill={color} />
      <rect x="2" y="2" width="2" height="2" fill={color} />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Screen 1 — Dashboard (dense editorial grid)
// ──────────────────────────────────────────────
function IchiDashboard() {
  const s = useScale();
  return (
    <IchiShell>
      <div style={{ flex: 1, padding: `${6 * s.pad}px 18px 0`, overflow: 'hidden' }}>
        {/* Masthead with ichimatsu pattern + month */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4, paddingBottom: 10, borderBottom: '2px solid ' + ICHI.ink }}>
          <IchiPattern size={22} color={ICHI.ink} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ICHI.mono, fontSize: 9, letterSpacing: 2, color: ICHI.muted }}>VOL.11 · 2025</div>
            <div style={{ fontFamily: ICHI.font, fontSize: 19, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>家計簿 — 霜月号</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: ICHI.ink, color: ICHI.paper, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ICHI.font }}>父</div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: ICHI.asagi, color: ICHI.paper, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ICHI.font }}>母</div>
          </div>
        </div>

        {/* Top hero grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0, borderBottom: '1px solid ' + ICHI.rule, paddingBottom: 12 }}>
          <div style={{ padding: '12px 12px 0 4px' }}>
            <div style={{ fontFamily: ICHI.mono, fontSize: 8, letterSpacing: 2, color: ICHI.muted }}>BALANCE · 残額</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span style={{ fontFamily: ICHI.font, fontSize: 14, color: ICHI.asagi }}>¥</span>
              <span style={{ fontFamily: ICHI.font, fontSize: 30 * s.fs, fontWeight: 600, lineHeight: 1, letterSpacing: -0.5 }}>92,568</span>
            </div>
            <div style={{ marginTop: 8, fontFamily: ICHI.mono, fontSize: 9, color: ICHI.muted }}>USED 67% · 15d LEFT</div>
            {/* 10-segment progress */}
            <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, background: i < 7 ? ICHI.ink : ICHI.paperDk,
                }} />
              ))}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid ' + ICHI.rule, paddingLeft: 12, paddingTop: 12, paddingRight: 4 }}>
            <div style={{ fontFamily: ICHI.mono, fontSize: 8, letterSpacing: 2, color: ICHI.muted }}>TODAY · 11.15</div>
            <div style={{ fontFamily: ICHI.font, fontSize: 22 * s.fs, fontWeight: 600, marginTop: 4, lineHeight: 1 }}>¥5,247</div>
            <div style={{ fontFamily: ICHI.mono, fontSize: 9, color: ICHI.muted, marginTop: 6 }}>AVG ¥12,495/d</div>
            <div style={{ fontFamily: ICHI.mono, fontSize: 9, color: ICHI.asagi, marginTop: 2 }}>↓ 58% vs avg</div>
          </div>
        </div>

        {/* Category grid 3x3 — ichimatsu of stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid ' + ICHI.rule }}>
          {MOCK.categories.slice(0, 9).map((c, i) => {
            const dark = (Math.floor(i / 3) + i) % 2 === 0;
            const pct = c.spent / c.budget;
            const over = pct >= 1;
            return (
              <div key={c.key} style={{
                padding: `${10 * s.pad}px 8px`,
                background: dark ? ICHI.paper2 : ICHI.paper,
                borderRight: (i % 3 < 2) ? '1px solid ' + ICHI.rule : 'none',
                borderTop: (i >= 3) ? '1px solid ' + ICHI.rule : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: ICHI.font, fontSize: 11, color: ICHI.ink2 }}>{c.ja}</span>
                  <span style={{ fontFamily: ICHI.mono, fontSize: 9, color: over ? ICHI.shu : ICHI.muted }}>{Math.round(pct * 100)}%</span>
                </div>
                <div style={{ fontFamily: ICHI.font, fontSize: 14 * s.fs, fontWeight: 600, marginTop: 2, color: over ? ICHI.shu : ICHI.ink }}>
                  ¥{(c.spent/1000).toFixed(1)}k
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent transactions — compact list */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontFamily: ICHI.mono, fontSize: 9, letterSpacing: 2, color: ICHI.muted }}>RECENT · 今日</span>
            <span style={{ fontFamily: ICHI.mono, fontSize: 9, color: ICHI.asagi }}>VIEW ALL →</span>
          </div>
          {MOCK.recent.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: `${5 * s.pad}px 0`, borderBottom: '1px dotted ' + ICHI.rule, gap: 8 }}>
              <span style={{ fontFamily: ICHI.mono, fontSize: 10, color: ICHI.muted, width: 36 }}>{r.t}</span>
              <span style={{
                width: 18, height: 18, background: ICHI.ink, color: ICHI.paper,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: ICHI.font, fontSize: 10,
              }}>{r.cat}</span>
              <span style={{ flex: 1, fontSize: 11, fontFamily: ICHI.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.memo}</span>
              <span style={{ fontFamily: ICHI.mono, fontSize: 11, fontWeight: 600 }}>¥{r.amt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <IchiTabBar active="home" />
    </IchiShell>
  );
}

function IchiTabBar({ active }) {
  const items = [
    ['home', '家'], ['log', '記'], ['cal', '暦'], ['anal', '析'], ['set', '⚙'],
  ];
  return (
    <div style={{ borderTop: '2px solid ' + ICHI.ink, padding: '8px 8px 22px', display: 'flex', justifyContent: 'space-between', background: ICHI.paper }}>
      {items.map(([k, c]) => {
        const on = k === active;
        return (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 36, height: 32, margin: '0 auto', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: on ? ICHI.ink : 'transparent',
              color: on ? ICHI.paper : ICHI.ink2,
              fontFamily: ICHI.font, fontSize: 16, fontWeight: on ? 700 : 400,
            }}>{c}</div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 2 — Expense Input (editorial form)
// ──────────────────────────────────────────────
function IchiInput() {
  const s = useScale();
  return (
    <IchiShell>
      <div style={{ flex: 1, padding: `${6 * s.pad}px 18px 0`, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', borderBottom: '2px solid ' + ICHI.ink }}>
          <span style={{ fontFamily: ICHI.mono, fontSize: 11, color: ICHI.ink }}>← BACK</span>
          <span style={{ fontFamily: ICHI.font, fontSize: 14, fontWeight: 700, letterSpacing: 4 }}>記 入</span>
          <span style={{ fontFamily: ICHI.mono, fontSize: 11, color: ICHI.asagi, fontWeight: 600 }}>SAVE ✓</span>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid ' + ICHI.rule }}>
          {['支出 EXPENSE', '収入 INCOME'].map((m, i) => (
            <div key={m} style={{
              padding: '10px 0', textAlign: 'center',
              fontFamily: ICHI.font, fontSize: 12, fontWeight: 600,
              background: i === 0 ? ICHI.ink : 'transparent',
              color: i === 0 ? ICHI.paper : ICHI.muted,
            }}>{m}</div>
          ))}
        </div>

        {/* Amount editorial */}
        <div style={{ padding: '16px 0 14px', borderBottom: '1px solid ' + ICHI.rule }}>
          <div style={{ fontFamily: ICHI.mono, fontSize: 9, letterSpacing: 2, color: ICHI.muted }}>AMOUNT · 金額</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <span style={{ fontFamily: ICHI.font, fontSize: 18, color: ICHI.muted }}>¥</span>
            <span style={{ fontFamily: ICHI.font, fontSize: 48 * s.fs, fontWeight: 600, lineHeight: 1, letterSpacing: -1 }}>3,840</span>
            <span style={{ marginLeft: 'auto', fontFamily: ICHI.mono, fontSize: 10, color: ICHI.asagi, alignSelf: 'flex-end', paddingBottom: 4 }}>JPY</span>
          </div>
        </div>

        {/* Form rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['CATEGORY · 分類', '食費', true],
            ['DATE · 日付', '2025.11.15 土', false],
            ['MEMBER · 記入者', '母', false],
            ['STORE · 店舗', 'スーパー成城', false],
            ['MEMO · 備考', '夕食材一式', false],
          ].map(([k, v, accent], i, a) => (
            <div key={k} style={{ padding: `${10 * s.pad}px 0`, borderBottom: i < a.length - 1 ? '1px dotted ' + ICHI.rule : 'none' }}>
              <div style={{ fontFamily: ICHI.mono, fontSize: 8.5, letterSpacing: 2, color: ICHI.muted }}>{k}</div>
              <div style={{
                fontFamily: ICHI.font, fontSize: 14, marginTop: 2,
                color: accent ? ICHI.asagi : ICHI.ink, fontWeight: accent ? 600 : 400,
              }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Categories grid */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: ICHI.mono, fontSize: 8.5, letterSpacing: 2, color: ICHI.muted, marginBottom: 6 }}>QUICK PICK</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: '1px solid ' + ICHI.rule }}>
            {MOCK.categories.map((c, i) => {
              const on = i === 0;
              return (
                <div key={c.key} style={{
                  padding: '8px 0', textAlign: 'center',
                  borderRight: (i % 5 < 4) ? '1px solid ' + ICHI.rule : 'none',
                  borderTop: i >= 5 ? '1px solid ' + ICHI.rule : 'none',
                  background: on ? ICHI.asagi : (Math.floor(i/5) + i) % 2 === 0 ? ICHI.paper2 : ICHI.paper,
                  color: on ? ICHI.paper : ICHI.ink,
                  fontFamily: ICHI.font, fontSize: 11, fontWeight: on ? 700 : 400,
                }}>{c.ja}</div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 18px 22px', borderTop: '2px solid ' + ICHI.ink, display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '12px 0', textAlign: 'center', border: '1.5px solid ' + ICHI.ink,
          fontFamily: ICHI.font, fontSize: 13, fontWeight: 600,
        }}>📷 撮影</div>
        <div style={{
          flex: 2, padding: '12px 0', textAlign: 'center', background: ICHI.ink, color: ICHI.paper,
          fontFamily: ICHI.font, fontSize: 13, fontWeight: 700, letterSpacing: 2,
        }}>記 録 す る</div>
      </div>
    </IchiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 3 — Monthly Report
// ──────────────────────────────────────────────
function IchiReport() {
  const s = useScale();
  return (
    <IchiShell>
      <div style={{ flex: 1, padding: `${6 * s.pad}px 18px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0 8px', borderBottom: '2px solid ' + ICHI.ink }}>
          <span style={{ fontFamily: ICHI.mono, fontSize: 10, color: ICHI.muted }}>‹ 10</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: ICHI.font, fontSize: 18, fontWeight: 700 }}>霜月 報告</div>
            <div style={{ fontFamily: ICHI.mono, fontSize: 9, color: ICHI.muted, letterSpacing: 2 }}>NOV 2025 · REPORT</div>
          </div>
          <span style={{ fontFamily: ICHI.mono, fontSize: 10, color: ICHI.muted }}>12 ›</span>
        </div>

        {/* 4-tile stat block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid ' + ICHI.rule }}>
          {[
            ['SPENT · 支出', '¥187,432', ICHI.ink, ICHI.paper2],
            ['BUDGET · 予算', '¥280,000', ICHI.ink2, ICHI.paper],
            ['LEFT · 残', '¥92,568', ICHI.asagi, ICHI.paper],
            ['DAILY · 平均', '¥12,495', ICHI.ink2, ICHI.paper2],
          ].map(([k, v, col, bg], i) => (
            <div key={k} style={{
              padding: `${10 * s.pad}px 12px`, background: bg,
              borderRight: i % 2 === 0 ? '1px solid ' + ICHI.rule : 'none',
              borderTop: i >= 2 ? '1px solid ' + ICHI.rule : 'none',
            }}>
              <div style={{ fontFamily: ICHI.mono, fontSize: 8.5, letterSpacing: 2, color: ICHI.muted }}>{k}</div>
              <div style={{ fontFamily: ICHI.font, fontSize: 18 * s.fs, fontWeight: 600, color: col, marginTop: 2, letterSpacing: -0.5 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div style={{ paddingTop: 10 }}>
          <div style={{ fontFamily: ICHI.mono, fontSize: 9, letterSpacing: 2, color: ICHI.muted, marginBottom: 4 }}>BY CATEGORY · 分類別</div>
          {MOCK.categories.slice(0, 7).map((c, i) => {
            const pct = c.spent / c.budget;
            const over = pct >= 1;
            return (
              <div key={c.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: `${5 * s.pad}px 0`, borderBottom: '1px dotted ' + ICHI.rule,
              }}>
                <span style={{ fontFamily: ICHI.mono, fontSize: 9, width: 18, color: ICHI.muted }}>0{i+1}</span>
                <span style={{ fontFamily: ICHI.font, fontSize: 12, width: 38 }}>{c.ja}</span>
                <div style={{ flex: 1, height: 10, background: ICHI.paperDk, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: Math.min(pct, 1) * 100 + '%', background: over ? ICHI.shu : ICHI.ink }} />
                  {pct >= 1 && (
                    <div style={{ position: 'absolute', inset: 0, width: (pct - 1) * 100 + '%', background: ICHI.shu, left: '100%', opacity: 0.5 }} />
                  )}
                </div>
                <span style={{ fontFamily: ICHI.mono, fontSize: 10, fontWeight: 600, width: 50, textAlign: 'right', color: over ? ICHI.shu : ICHI.ink }}>
                  {Math.round(pct * 100)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Day heatmap */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: ICHI.mono, fontSize: 9, letterSpacing: 2, color: ICHI.muted, marginBottom: 6 }}>DAILY · 日別</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 2 }}>
            {MOCK.daily.map((d, i) => {
              const level = d === 0 ? 0 : d < 4000 ? 1 : d < 8000 ? 2 : d < 12000 ? 3 : 4;
              const colors = [ICHI.paperDk, ICHI.asagiSoft, '#7aa9af', ICHI.asagi, ICHI.asagiDk];
              return <div key={i} style={{ aspectRatio: '1', background: colors[level] }} />;
            })}
          </div>
        </div>
      </div>
      <IchiTabBar active="anal" />
    </IchiShell>
  );
}

Object.assign(window, { IchiDashboard, IchiInput, IchiReport, ICHI });
