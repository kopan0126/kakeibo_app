// var5-sakura.jsx — 桜と苔 (Sakura & Koke): soft pink + moss green, family.
// Aesthetic: gentle and approachable. Rounded shapes, avatars feature
// prominently, friendly numerals (Klee). Designed for shared family use.

const SAK = {
  cream:    '#FAF3EB',
  cream2:   '#F4E9DC',
  sakura:   '#E8B5B5',     // 桜
  sakuraDk: '#C97A85',
  sakuraSoft:'#F5DCDC',
  koke:     '#7A8F62',     // 苔
  kokeDk:   '#5C6E48',
  kokeSoft: '#CBD4B3',
  earth:    '#4A3D32',
  earth2:   '#736453',
  muted:    '#a39282',
  rule:     '#e0d3c0',
  font:     "'Klee One', 'Noto Serif JP', serif",
  fontAlt:  "'Shippori Mincho', 'Noto Serif JP', serif",
  sans:     "'Noto Sans JP', system-ui, sans-serif",
};

const SAK_FAMILY = [
  { name: '父',     color: '#3a4d6b', icon: '父' },
  { name: '母',     color: SAK.sakuraDk, icon: '母' },
  { name: '太郎',   color: SAK.koke, icon: '太' },
  { name: 'さくら', color: SAK.sakura, icon: '咲' },
];

function SakShell({ children, bg = SAK.cream }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 40,
      background: bg, color: SAK.earth, fontFamily: SAK.sans,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 20px 50px -22px rgba(74,61,50,0.3)',
      border: '1px solid ' + SAK.rule,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 36, padding: '12px 26px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 600, color: SAK.earth,
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 1.5 }}>●●●</span>
      </div>
      {children}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 2, background: 'rgba(74,61,50,0.5)' }} />
    </div>
  );
}

function Petal({ size = 16, color = SAK.sakura, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M12 2 C 16 6, 18 10, 12 22 C 6 10, 8 6, 12 2 Z" fill={color} transform="rotate(45 12 12)" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Screen 1 — Dashboard (family-first)
// ──────────────────────────────────────────────
function SakDashboard() {
  const s = useScale();
  return (
    <SakShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 22px 0`, overflow: 'hidden' }}>
        {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 14px' }}>
          <div>
            <div style={{ fontFamily: SAK.font, fontSize: 13, color: SAK.muted }}>11月15日（土）</div>
            <div style={{ fontFamily: SAK.font, fontSize: 18, color: SAK.earth, fontWeight: 600 }}>こんにちは、母さん 🌸</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: SAK.sakuraDk, color: SAK.cream,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SAK.fontAlt, fontSize: 14, fontWeight: 600,
          }}>母</div>
        </div>

        {/* Hero remaining card with petals */}
        <div style={{
          background: SAK.koke, color: SAK.cream, borderRadius: 24, padding: '18px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <Petal size={60} color={SAK.kokeSoft} style={{ position: 'absolute', top: -10, right: -10, opacity: 0.4 }} />
          <Petal size={36} color={SAK.kokeSoft} style={{ position: 'absolute', bottom: -8, left: -4, opacity: 0.3 }} />
          <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.kokeSoft, letterSpacing: 2 }}>11月のお小遣い のこり</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: SAK.font, fontSize: 14, color: SAK.cream }}>¥</span>
            <span style={{ fontFamily: SAK.font, fontSize: 40 * s.fs, fontWeight: 700, color: SAK.cream, letterSpacing: -0.5, lineHeight: 1 }}>92,568</span>
          </div>
          <div style={{ marginTop: 10, height: 8, background: 'rgba(250,243,235,0.2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: '67%', background: SAK.sakura, borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: SAK.kokeSoft }}>
            <span>つかった ¥187,432</span>
            <span>あと15日</span>
          </div>
        </div>

        {/* Family donut row */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: SAK.font, fontSize: 12, color: SAK.earth, fontWeight: 600 }}>家族のおさいふ</span>
            <span style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.koke }}>もっと見る →</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SAK_FAMILY.map((m, i) => (
              <div key={m.name} style={{
                flex: 1, background: SAK.cream2, borderRadius: 16,
                padding: '10px 6px', textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: m.color, color: SAK.cream,
                  fontFamily: SAK.fontAlt, fontSize: 15, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                }}>{m.icon}</div>
                <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.earth, marginTop: 4 }}>{m.name}</div>
                <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, marginTop: 1 }}>¥{(MOCK.family[i].spent/1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's activity feed */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: SAK.font, fontSize: 12, color: SAK.earth, fontWeight: 600 }}>今日の記録 ({MOCK.recent.length}件)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s.gap }}>
            {MOCK.recent.slice(0, 4).map((r, i) => {
              const member = SAK_FAMILY.find((m) => m.name === r.who) || SAK_FAMILY[0];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: `${8 * s.pad}px 12px`, background: SAK.cream2, borderRadius: 14,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: member.color, color: SAK.cream,
                    fontFamily: SAK.fontAlt, fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{member.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontFamily: SAK.font, color: SAK.earth, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.memo}</div>
                    <div style={{ fontSize: 10, color: SAK.muted }}>{r.t} · {r.cat === '食' ? '食費' : r.cat === '交' ? '交通' : r.cat === '本' ? '教養' : '衣服'}</div>
                  </div>
                  <div style={{ fontFamily: SAK.font, fontSize: 13, color: SAK.earth, fontWeight: 600 }}>¥{r.amt.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Big FAB */}
      <div style={{ position: 'absolute', right: 22, bottom: 90, zIndex: 5 }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%', background: SAK.sakuraDk, color: SAK.cream,
          fontFamily: SAK.fontAlt, fontSize: 30, fontWeight: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 26px -8px rgba(201,122,133,0.55)',
          paddingBottom: 4,
        }}>＋</div>
      </div>
      <SakTabBar active="home" />
    </SakShell>
  );
}

function SakTabBar({ active }) {
  const items = [['home', '家', 'ホーム'], ['cal', '暦', 'こよみ'], ['family', '族', '家族'], ['anal', '析', '分析']];
  return (
    <div style={{ background: SAK.cream, padding: '10px 18px 22px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid ' + SAK.rule }}>
      {items.map(([k, c, l]) => {
        const on = k === active;
        return (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 38, height: 28, margin: '0 auto', borderRadius: 14,
              background: on ? SAK.sakuraSoft : 'transparent',
              color: on ? SAK.sakuraDk : SAK.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: SAK.fontAlt, fontSize: 14, fontWeight: on ? 700 : 400,
            }}>{c}</div>
            <div style={{ fontSize: 9, fontFamily: SAK.font, color: on ? SAK.sakuraDk : SAK.muted, marginTop: 2, fontWeight: on ? 600 : 400 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 2 — Expense Input (conversational, member-first)
// ──────────────────────────────────────────────
function SakInput() {
  const s = useScale();
  return (
    <SakShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 22px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 14px' }}>
          <span style={{ fontFamily: SAK.font, fontSize: 13, color: SAK.muted }}>✕ とじる</span>
          <span style={{ fontFamily: SAK.fontAlt, fontSize: 16, color: SAK.earth, fontWeight: 600 }}>あたらしい記録</span>
          <span style={{ fontSize: 13, color: 'transparent' }}>．</span>
        </div>

        {/* Who's recording — first thing in family app */}
        <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, marginBottom: 8 }}>だれが？</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {SAK_FAMILY.map((m, i) => {
            const on = i === 1;
            return (
              <div key={m.name} style={{
                width: 56, textAlign: 'center',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: on ? m.color : SAK.cream2,
                  border: on ? 'none' : '1.5px solid ' + SAK.rule,
                  color: on ? SAK.cream : m.color,
                  fontFamily: SAK.fontAlt, fontSize: 18, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                  boxShadow: on ? '0 4px 12px -3px ' + m.color + '88' : 'none',
                }}>{m.icon}</div>
                <div style={{ fontSize: 10, fontFamily: SAK.font, marginTop: 4, color: on ? SAK.earth : SAK.muted, fontWeight: on ? 600 : 400 }}>{m.name}</div>
              </div>
            );
          })}
        </div>

        {/* Amount card */}
        <div style={{
          background: SAK.sakuraSoft, borderRadius: 20, padding: '14px 18px',
        }}>
          <div style={{ fontFamily: SAK.font, fontSize: 10, color: SAK.sakuraDk, letterSpacing: 2 }}>いくら？</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontFamily: SAK.font, fontSize: 18, color: SAK.sakuraDk }}>¥</span>
            <span style={{ fontFamily: SAK.font, fontSize: 44 * s.fs, color: SAK.earth, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5, marginLeft: 4 }}>3,840</span>
            <span style={{ marginLeft: 'auto', width: 2, height: 24, background: SAK.sakuraDk, alignSelf: 'flex-end', marginBottom: 4 }} />
          </div>
        </div>

        {/* Category chips */}
        <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, margin: '16px 0 8px' }}>なに？</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MOCK.categories.map((c, i) => {
            const on = i === 0;
            return (
              <div key={c.key} style={{
                padding: '7px 12px', borderRadius: 18,
                background: on ? SAK.koke : SAK.cream2,
                color: on ? SAK.cream : SAK.earth,
                fontFamily: SAK.font, fontSize: 12, fontWeight: on ? 700 : 500,
                border: on ? 'none' : '1px solid ' + SAK.rule,
              }}>{c.ja}</div>
            );
          })}
        </div>

        {/* Memo */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, marginBottom: 6 }}>どこ・メモ</div>
          <div style={{
            padding: '12px 14px', background: SAK.cream2, borderRadius: 14,
            fontFamily: SAK.font, fontSize: 13, color: SAK.earth, fontWeight: 500,
            border: '1px solid ' + SAK.rule,
          }}>
            スーパー成城 ／ 夕食材一式<span style={{ color: SAK.muted, marginLeft: 4 }}>|</span>
          </div>
        </div>

        {/* Receipt CTA */}
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'linear-gradient(90deg, ' + SAK.sakuraSoft + ', ' + SAK.kokeSoft + ')',
          borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 18 }}>📷</div>
          <div style={{ flex: 1, fontFamily: SAK.font, fontSize: 12, color: SAK.earth, fontWeight: 600 }}>
            レシートを撮影してAIで自動入力
          </div>
          <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.kokeDk, fontWeight: 700 }}>はい →</div>
        </div>
      </div>

      <div style={{ padding: '12px 22px 24px' }}>
        <div style={{
          background: SAK.koke, color: SAK.cream, borderRadius: 24,
          padding: '14px 0', textAlign: 'center', fontFamily: SAK.fontAlt, fontSize: 15, fontWeight: 700,
        }}>記録する 🌸</div>
      </div>
    </SakShell>
  );
}

// ──────────────────────────────────────────────
// Screen 3 — Monthly Report (calendar heatmap focus)
// ──────────────────────────────────────────────
function SakReport() {
  const s = useScale();
  // 5x7 calendar of November
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDay = 5; // Nov 1 2025 = Saturday (col 6)
  return (
    <SakShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 22px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 12px' }}>
          <span style={{ fontFamily: SAK.font, fontSize: 13, color: SAK.muted }}>← 10月</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SAK.fontAlt, fontSize: 16, color: SAK.earth, fontWeight: 700 }}>11月のまとめ</div>
            <div style={{ fontFamily: SAK.font, fontSize: 10, color: SAK.muted }}>2025年 霜月</div>
          </div>
          <span style={{ fontFamily: SAK.font, fontSize: 13, color: SAK.muted }}>12月 →</span>
        </div>

        {/* Mini summary */}
        <div style={{
          background: SAK.sakuraSoft, borderRadius: 18, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: SAK.font, fontSize: 10, color: SAK.sakuraDk, letterSpacing: 2 }}>つかった おかね</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 2 }}>
              <span style={{ fontFamily: SAK.font, fontSize: 12, color: SAK.sakuraDk }}>¥</span>
              <span style={{ fontFamily: SAK.font, fontSize: 26 * s.fs, color: SAK.earth, fontWeight: 700, lineHeight: 1 }}>187,432</span>
            </div>
          </div>
          <div style={{
            background: SAK.cream, borderRadius: 12, padding: '6px 10px',
            fontFamily: SAK.font, fontSize: 11, color: SAK.kokeDk, fontWeight: 700, textAlign: 'center',
          }}>
            前月より<br />¥8,200 ↓
          </div>
        </div>

        {/* Calendar heatmap */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, marginBottom: 6 }}>こよみ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
            {['日','月','火','水','木','金','土'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontFamily: SAK.font, fontSize: 9, color: i === 0 ? SAK.sakuraDk : i === 6 ? SAK.koke : SAK.muted }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: startDay }).map((_, i) => <div key={'p'+i} />)}
            {days.map((d) => {
              const amt = MOCK.daily[d - 1] || 0;
              const level = amt === 0 ? 0 : amt < 4000 ? 1 : amt < 8000 ? 2 : amt < 12000 ? 3 : 4;
              const bgs = [SAK.cream2, SAK.kokeSoft, '#aebd91', SAK.koke, SAK.kokeDk];
              const today = d === 15;
              return (
                <div key={d} style={{
                  aspectRatio: '1', background: bgs[level], borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SAK.font, fontSize: 9,
                  color: level >= 3 ? SAK.cream : SAK.earth2,
                  border: today ? '2px solid ' + SAK.sakuraDk : 'none',
                  fontWeight: today ? 700 : 400,
                }}>{d}</div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 8, color: SAK.muted, fontFamily: SAK.font }}>少</span>
            {[SAK.cream2, SAK.kokeSoft, '#aebd91', SAK.koke, SAK.kokeDk].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
            ))}
            <span style={{ fontSize: 8, color: SAK.muted, fontFamily: SAK.font }}>多</span>
          </div>
        </div>

        {/* Top categories — compact */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: SAK.font, fontSize: 11, color: SAK.muted, marginBottom: 6 }}>よく つかった カテゴリ</div>
          {MOCK.categories.slice(0, 3).map((c, i) => {
            const pct = c.spent / c.budget;
            const cols = [SAK.koke, SAK.sakuraDk, SAK.kokeDk];
            return (
              <div key={c.key} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: `${6 * s.pad}px 0`,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10, background: cols[i], color: SAK.cream,
                  fontFamily: SAK.fontAlt, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{c.ja[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: SAK.font, fontSize: 12, color: SAK.earth, fontWeight: 600 }}>{c.ja}</span>
                    <span style={{ fontFamily: SAK.font, fontSize: 12, color: SAK.earth, fontWeight: 600 }}>¥{c.spent.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: SAK.cream2, borderRadius: 3, marginTop: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: Math.min(pct, 1) * 100 + '%', background: cols[i], borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SakTabBar active="anal" />
    </SakShell>
  );
}

Object.assign(window, { SakDashboard, SakInput, SakReport, SAK });
