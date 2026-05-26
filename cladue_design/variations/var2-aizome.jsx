// var2-aizome.jsx — 藍染 (Aizome): deep indigo on washi cream, brass accent.
// Aesthetic: dark indigo card stacks, asanoha pattern background hints,
// tategaki (vertical) text accents, brass numerals.

const AI = {
  indigo:    '#15243F',    // 藍 deep
  indigo2:   '#1f3358',    // 紺青
  indigoSoft:'#384d75',
  washi:     '#F1E8D3',    // washi cream
  washi2:    '#E8DCC0',
  ink:       '#0E1729',
  text:      '#15243F',
  textSoft:  '#5a6378',
  brass:     '#C9A55C',
  brassSoft: '#D9BC85',
  rule:      '#cdb98e',
  font:      "'Noto Serif JP', 'Shippori Mincho', serif",
  sans:      "'Noto Sans JP', system-ui, sans-serif",
  mono:      "'JetBrains Mono', monospace",
};

const ASANOHA_BG = "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23c9a55c' stroke-opacity='0.18' fill='none' stroke-width='0.5'%3E%3Cpath d='M0 20 L20 0 L40 20 L20 40 Z'/%3E%3Cpath d='M0 20 L20 20 L20 0 M20 20 L40 20 M20 20 L20 40'/%3E%3C/g%3E%3C/svg%3E\")";

function AiShell({ children, bg = AI.washi, statusDark = false }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 36,
      background: bg, color: AI.text, fontFamily: AI.sans,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 20px 50px -25px rgba(21,36,63,0.4)',
      border: '1px solid #d4c39e',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 36, padding: '12px 24px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 700, fontFamily: AI.mono,
        color: statusDark ? AI.washi : AI.indigo,
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 2 }}>●●●</span>
      </div>
      {children}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 2,
        background: statusDark ? 'rgba(241,232,211,0.7)' : 'rgba(21,36,63,0.5)' }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 1 — Dashboard (dark indigo hero card)
// ──────────────────────────────────────────────
function AiDashboard() {
  const s = useScale();
  return (
    <AiShell>
      <div style={{ flex: 1, padding: `${8 * s.pad}px 18px 0`, overflow: 'hidden' }}>
        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 12px' }}>
          <div>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>11.15 · 土</div>
            <div style={{ fontFamily: AI.font, fontSize: 18, color: AI.indigo, fontWeight: 600 }}>おかえりなさい</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MOCK.family.map((m, i) => (
              <div key={m.name} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? AI.indigo : AI.washi2,
                border: i === 0 ? '1.5px solid ' + AI.brass : '1px solid ' + AI.rule,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: AI.font, fontSize: 11, color: i === 0 ? AI.washi : AI.indigo,
              }}>{m.name[0]}</div>
            ))}
          </div>
        </div>

        {/* Hero card — deep indigo with asanoha */}
        <div style={{
          background: AI.indigo, color: AI.washi, borderRadius: 18,
          padding: `${18 * s.pad}px 22px`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.6, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: AI.font, fontSize: 11, color: AI.brass, letterSpacing: 4 }}>霜月の残額</div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8, gap: 3 }}>
                  <span style={{ fontFamily: AI.font, fontSize: 16, color: AI.brass }}>¥</span>
                  <span style={{ fontFamily: AI.font, fontSize: 42 * s.fs, fontWeight: 500, color: AI.washi, letterSpacing: -0.5, lineHeight: 1 }}>92,568</span>
                </div>
              </div>
              <div style={{ writingMode: 'vertical-rl', fontFamily: AI.font, fontSize: 10, color: AI.brassSoft, letterSpacing: 4, opacity: 0.8 }}>余 十五日</div>
            </div>
            {/* Two-state progress: brass over indigo */}
            <div style={{ marginTop: 16, height: 4, borderRadius: 2, background: 'rgba(241,232,211,0.15)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: '67%', background: AI.brass, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'rgba(241,232,211,0.7)' }}>
              <span>使 ¥187,432</span>
              <span>予算 ¥280,000</span>
            </div>
          </div>
        </div>

        {/* Today */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ background: AI.washi2, border: '1px solid ' + AI.rule, borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: AI.textSoft, letterSpacing: 2 }}>本日 支出</div>
            <div style={{ fontFamily: AI.font, fontSize: 20 * s.fs, color: AI.indigo, marginTop: 4 }}>¥5,247</div>
          </div>
          <div style={{ background: AI.washi2, border: '1px solid ' + AI.rule, borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: AI.textSoft, letterSpacing: 2 }}>一日 平均</div>
            <div style={{ fontFamily: AI.font, fontSize: 20 * s.fs, color: AI.indigo, marginTop: 4 }}>¥12,495</div>
          </div>
        </div>

        {/* Recent */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>今日の記録</div>
            <div style={{ fontSize: 10, color: AI.brass }}>すべて →</div>
          </div>
          <div style={{ background: AI.washi2, border: '1px solid ' + AI.rule, borderRadius: 12, overflow: 'hidden' }}>
            {MOCK.recent.slice(0, 4).map((r, i, a) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: `${9 * s.pad}px 12px`,
                borderBottom: i < a.length - 1 ? '1px solid ' + AI.rule : 'none',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, background: AI.indigo, color: AI.washi,
                  fontFamily: AI.font, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10,
                }}>{r.cat}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: AI.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.memo}</div>
                  <div style={{ fontSize: 9.5, color: AI.textSoft, marginTop: 1 }}>{r.t} · {r.who}</div>
                </div>
                <div style={{ fontFamily: AI.font, fontSize: 14, color: AI.indigo, fontWeight: 500 }}>¥{r.amt.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiTabBar active="home" />
    </AiShell>
  );
}

function AiTabBar({ active }) {
  const items = [
    ['home', '家', 'ホーム'], ['log', '記', '記入'], ['cal', '暦', '暦'],
    ['anal', '析', '分析'], ['set', '設', '設定'],
  ];
  return (
    <div style={{ borderTop: '1px solid ' + AI.rule, padding: '8px 14px 22px', display: 'flex', justifyContent: 'space-between', background: AI.washi }}>
      {items.map(([k, c, l]) => {
        const on = k === active;
        return (
          <div key={k} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto', borderRadius: 8,
              background: on ? AI.indigo : 'transparent',
              color: on ? AI.brass : AI.indigo2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: AI.font, fontSize: 15,
            }}>{c}</div>
            <div style={{ fontSize: 9, color: on ? AI.indigo : AI.textSoft, marginTop: 2 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 2 — Expense Input (keypad)
// ──────────────────────────────────────────────
function AiInput() {
  const s = useScale();
  return (
    <AiShell bg={AI.indigo} statusDark={true}>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden', color: AI.washi, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 14px' }}>
            <span style={{ fontSize: 13, color: AI.brassSoft }}>← 戻る</span>
            <span style={{ fontFamily: AI.font, fontSize: 14, color: AI.brass, letterSpacing: 2 }}>記 入</span>
            <span style={{ fontSize: 13, color: AI.washi, fontWeight: 600 }}>保存</span>
          </div>

          {/* Amount display */}
          <div style={{
            background: 'rgba(241,232,211,0.06)', borderRadius: 18, padding: '18px 18px 14px',
            border: '1px solid rgba(201,165,92,0.3)', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: AI.brassSoft, letterSpacing: 2 }}>
              <span>支出</span>
              <span>11.15 · 母</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8, gap: 4 }}>
              <span style={{ fontFamily: AI.font, fontSize: 22, color: AI.brass }}>¥</span>
              <span style={{ fontFamily: AI.font, fontSize: 46 * s.fs, color: AI.washi, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>3,840</span>
              <span style={{ fontFamily: AI.mono, fontSize: 22, color: AI.washi, marginLeft: 'auto', opacity: 0.4 }}>|</span>
            </div>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflow: 'hidden' }}>
            {['食 食費', '楽 娯楽', '住 住居', '交 交通'].map((c, i) => (
              <div key={c} style={{
                padding: '6px 10px', borderRadius: 18,
                background: i === 0 ? AI.brass : 'rgba(241,232,211,0.08)',
                color: i === 0 ? AI.indigo : AI.washi,
                fontFamily: AI.font, fontSize: 11, fontWeight: 600,
                border: i === 0 ? 'none' : '1px solid rgba(241,232,211,0.2)',
                whiteSpace: 'nowrap',
              }}>{c}</div>
            ))}
          </div>

          {/* Memo + receipt row */}
          <div style={{
            background: 'rgba(241,232,211,0.05)', borderRadius: 12, padding: '10px 14px',
            border: '1px solid rgba(201,165,92,0.2)', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16, color: AI.brass }}>📷</span>
            <span style={{ fontFamily: AI.font, fontSize: 12, color: AI.brassSoft, flex: 1 }}>領収書から自動入力</span>
            <span style={{ fontSize: 10, color: AI.brass, border: '1px solid ' + AI.brass, borderRadius: 10, padding: '2px 8px' }}>AI</span>
          </div>

          {/* Numpad — indigo on indigo with brass numerals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['1','2','3','4','5','6','7','8','9','000','0','⌫'].map((n, i) => (
              <div key={i} style={{
                height: 46 * s.rowH, borderRadius: 12,
                background: 'rgba(241,232,211,0.08)',
                border: '1px solid rgba(201,165,92,0.18)',
                color: i === 11 ? AI.brass : AI.washi,
                fontFamily: AI.font, fontSize: 22 * s.fs, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{n}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 18px 26px', background: AI.indigo }}>
        <div style={{
          background: AI.brass, color: AI.indigo, borderRadius: 14,
          padding: '12px 0', textAlign: 'center', fontFamily: AI.font, fontSize: 15, fontWeight: 700,
        }}>記す ✓</div>
      </div>
    </AiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 3 — Monthly Report
// ──────────────────────────────────────────────
function AiReport() {
  const s = useScale();
  return (
    <AiShell>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 12px' }}>
          <span style={{ fontSize: 18, color: AI.indigo }}>←</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>MONTHLY</div>
            <div style={{ fontFamily: AI.font, fontSize: 16, color: AI.indigo, fontWeight: 600 }}>霜月 · 月報</div>
          </div>
          <span style={{ fontSize: 18, color: AI.indigo }}>⋯</span>
        </div>

        {/* Hero summary card */}
        <div style={{ background: AI.indigo, color: AI.washi, borderRadius: 16, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.5 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, color: AI.brass, letterSpacing: 3 }}>当月 総支出</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: AI.font, fontSize: 14, color: AI.brass }}>¥</span>
              <span style={{ fontFamily: AI.font, fontSize: 36 * s.fs, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>187,432</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(201,165,92,0.25)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: AI.brassSoft, letterSpacing: 2 }}>前月比</div>
                <div style={{ fontFamily: AI.font, fontSize: 14, color: AI.washi, marginTop: 2 }}>−¥8,200</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: AI.brassSoft, letterSpacing: 2 }}>予算残</div>
                <div style={{ fontFamily: AI.font, fontSize: 14, color: AI.brass, marginTop: 2 }}>¥92,568</div>
              </div>
            </div>
          </div>
        </div>

        {/* Family breakdown */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3, marginBottom: 6 }}>家族別 支出</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOCK.family.map((m) => {
              const pct = m.spent / 187432;
              return (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: AI.indigo, color: AI.washi,
                    fontFamily: AI.font, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{m.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: AI.text }}>{m.name}</span>
                      <span style={{ fontFamily: AI.font, color: AI.indigo, fontWeight: 600 }}>¥{m.spent.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 3, background: AI.washi2, borderRadius: 2, marginTop: 3, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, width: pct * 100 + '%', background: AI.brass }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category list */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3, marginBottom: 6 }}>分類別 上位</div>
          <div style={{ background: AI.washi2, borderRadius: 12, border: '1px solid ' + AI.rule, overflow: 'hidden' }}>
            {MOCK.categories.slice(0, 5).map((c, i, a) => (
              <div key={c.key} style={{
                display: 'flex', alignItems: 'center', padding: `${8 * s.pad}px 14px`,
                borderBottom: i < a.length - 1 ? '1px solid ' + AI.rule : 'none',
              }}>
                <span style={{ fontFamily: AI.font, fontSize: 14, color: AI.indigo, width: 56 }}>{c.ja}</span>
                <div style={{ flex: 1, height: 2, background: AI.washi, position: 'relative', borderRadius: 1, margin: '0 10px' }}>
                  <div style={{ position: 'absolute', inset: 0, width: (c.spent / c.budget * 100) + '%', background: c.spent >= c.budget ? '#a44231' : AI.indigo, borderRadius: 1 }} />
                </div>
                <span style={{ fontFamily: AI.font, fontSize: 12, color: AI.indigo, fontWeight: 600 }}>¥{(c.spent/1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiTabBar active="anal" />
    </AiShell>
  );
}

Object.assign(window, { AiDashboard, AiInput, AiReport, AI });
