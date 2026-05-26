// var3-chashitsu.jsx — 茶室 (Chashitsu): tatami beige, matcha green, wabi-sabi.
// Aesthetic: warm and calm. Maximum whitespace, asymmetric layouts,
// Klee One handwritten numerals for warmth. The most "slow" variation.

const CHA = {
  tatami:   '#E8DCC0',
  paper:    '#F5EBD4',
  paper2:   '#EFE3C7',
  matcha:   '#6B7F4A',
  matcha2:  '#8a9d6a',
  matchaSoft:'#cdd6b6',
  earth:    '#3D352A',
  earth2:   '#5E5343',
  muted:    '#9b8d75',
  rust:     '#B45A3D',     // 弁柄 accent
  rule:     '#d4c5a3',
  font:     "'Klee One', 'Noto Serif JP', serif",
  fontAlt:  "'Shippori Mincho', 'Noto Serif JP', serif",
  sans:     "'Noto Sans JP', system-ui, sans-serif",
};

function ChaShell({ children }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 40,
      background: CHA.paper, color: CHA.earth, fontFamily: CHA.sans,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 20px 50px -25px rgba(61,53,42,0.35)',
      border: '1px solid #ddc99e',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 36, padding: '12px 26px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 600, color: CHA.earth,
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 1.5 }}>●●●</span>
      </div>
      {children}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 2, background: 'rgba(61,53,42,0.5)' }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 1 — Dashboard (lots of whitespace, single hero number)
// ──────────────────────────────────────────────
function ChaDashboard() {
  const s = useScale();
  return (
    <ChaShell>
      <div style={{ flex: 1, padding: `${16 * s.pad}px 28px 0`, overflow: 'hidden', position: 'relative' }}>
        {/* Tiny header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.muted }}>霜月十五日 · 土</div>
            <div style={{ fontFamily: CHA.font, fontSize: 14, color: CHA.earth, marginTop: 2 }}>こんにちは、お母さん</div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', border: '1.5px solid ' + CHA.matcha,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: CHA.font, fontSize: 14, color: CHA.matcha,
          }}>母</div>
        </div>

        {/* Single, dominant remaining number — asymmetric */}
        <div style={{ marginTop: 48 * s.pad, marginBottom: 12, paddingLeft: 6 }}>
          <div style={{ fontFamily: CHA.fontAlt, fontSize: 11, color: CHA.muted, letterSpacing: 4 }}>のこり</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: CHA.font, fontSize: 62 * s.fs, color: CHA.matcha, lineHeight: 0.9, fontWeight: 600 }}>92,568</span>
            <span style={{ fontFamily: CHA.font, fontSize: 18, color: CHA.matcha2, marginBottom: 8 }}>円</span>
          </div>
          {/* Hand-drawn-feeling underline */}
          <svg width="240" height="8" style={{ marginTop: 4, marginLeft: -2 }}>
            <path d="M2 4 Q60 2, 120 5 T238 4" stroke={CHA.matcha} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.earth2, marginTop: 10 }}>
            <span style={{ color: CHA.matcha, fontWeight: 600 }}>あと15日</span>、ゆとりがあります
          </div>
        </div>

        {/* Subtle four-bucket strip — only if density allows */}
        {!s.hide.includes('secondary') && (
          <div style={{ marginTop: 32 * s.pad }}>
            <div style={{ fontFamily: CHA.fontAlt, fontSize: 10, color: CHA.muted, letterSpacing: 3, marginBottom: 12 }}>四つの暮らし</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 * s.gap }}>
              {MOCK.kakeibo.map((k) => {
                const pct = k.spent / k.budget;
                return (
                  <div key={k.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: '1px solid ' + CHA.rule, background: CHA.paper2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      position: 'relative',
                    }}>
                      <svg width="36" height="36" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={CHA.matchaSoft} strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke={pct > 0.9 ? CHA.rust : CHA.matcha} strokeWidth="2.5"
                          strokeDasharray={`${pct * 87.96} 87.96`} strokeLinecap="round" />
                      </svg>
                      <span style={{ fontFamily: CHA.fontAlt, fontSize: 12, color: CHA.earth, position: 'relative' }}>{k.ja[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: CHA.fontAlt, fontSize: 14, color: CHA.earth }}>{k.ja}</span>
                        <span style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.earth }}>¥{(k.budget - k.spent).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 10, color: CHA.muted, marginTop: 1 }}>{k.sub} ／ あと {Math.round((1-pct)*100)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Big calligraphic ＋ FAB */}
      <div style={{ position: 'absolute', right: 24, bottom: 96, zIndex: 5 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: CHA.matcha, color: CHA.paper,
          fontFamily: CHA.fontAlt, fontSize: 32, fontWeight: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px -8px rgba(107,127,74,0.6)',
          paddingBottom: 4,
        }}>＋</div>
      </div>

      <ChaTabBar active="home" />
    </ChaShell>
  );
}

function ChaTabBar({ active }) {
  const items = [['home', 'ホーム'], ['cal', 'こよみ'], ['anal', '分析'], ['set', '設定']];
  return (
    <div style={{ padding: '14px 26px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid ' + CHA.rule }}>
      {items.map(([k, l]) => {
        const on = k === active;
        return (
          <div key={k} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
            <div style={{ fontFamily: CHA.font, fontSize: 12, color: on ? CHA.matcha : CHA.muted, fontWeight: on ? 600 : 400 }}>{l}</div>
            {on && <div style={{ width: 16, height: 2, background: CHA.matcha, borderRadius: 1, margin: '4px auto 0' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 2 — Expense Input (warm, conversational)
// ──────────────────────────────────────────────
function ChaInput() {
  const s = useScale();
  return (
    <ChaShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 28px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 16px' }}>
          <span style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.muted }}>← 戻る</span>
          <span style={{ fontFamily: CHA.font, fontSize: 14, color: CHA.earth, fontWeight: 600 }}>きょうの記録</span>
          <span style={{ fontSize: 13, color: 'transparent' }}>．</span>
        </div>

        {/* Welcoming question */}
        <div style={{ fontFamily: CHA.font, fontSize: 17 * s.fs, color: CHA.earth, lineHeight: 1.5, marginTop: 8 }}>
          きょうは何を<br />お買い物しましたか？
        </div>

        {/* Amount with handwritten feel */}
        <div style={{
          marginTop: 24,
          padding: '20px 0 14px',
          borderBottom: '1.5px solid ' + CHA.matcha,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: CHA.font, fontSize: 18, color: CHA.muted }}>¥</span>
            <span style={{ fontFamily: CHA.font, fontSize: 50 * s.fs, color: CHA.earth, lineHeight: 1, fontWeight: 600 }}>3,840</span>
            <span style={{ fontFamily: CHA.font, fontSize: 14, color: CHA.muted, marginLeft: 'auto' }}>夕食材</span>
          </div>
        </div>

        {/* Soft category bubbles */}
        <div style={{ fontFamily: CHA.fontAlt, fontSize: 10, color: CHA.muted, letterSpacing: 3, marginTop: 22, marginBottom: 10 }}>なんの ？</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MOCK.categories.slice(0, 8).map((c, i) => {
            const on = i === 0;
            return (
              <div key={c.key} style={{
                padding: '8px 14px', borderRadius: 24,
                background: on ? CHA.matcha : CHA.paper2,
                border: '1px solid ' + (on ? CHA.matcha : CHA.rule),
                color: on ? CHA.paper : CHA.earth,
                fontFamily: CHA.font, fontSize: 13, fontWeight: 500,
              }}>{c.ja}</div>
            );
          })}
        </div>

        {/* Meta rows */}
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[['いつ', '今日'], ['どこで', 'スーパー成城'], ['だれが', '母']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + CHA.rule }}>
              <span style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.muted }}>{k}</span>
              <span style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.earth, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Receipt invite */}
        <div style={{
          marginTop: 18, padding: '12px 14px', background: CHA.paper2, borderRadius: 14,
          border: '1px dashed ' + CHA.matcha,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 20 }}>📷</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: CHA.font, fontSize: 12, color: CHA.earth, fontWeight: 600 }}>レシートで一発入力</div>
            <div style={{ fontSize: 10, color: CHA.muted, marginTop: 1 }}>AIが自動で読みとります</div>
          </div>
          <div style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.matcha }}>→</div>
        </div>
      </div>

      <div style={{ padding: '14px 28px 26px' }}>
        <div style={{
          background: CHA.matcha, color: CHA.paper, borderRadius: 30,
          padding: '14px 0', textAlign: 'center', fontFamily: CHA.font, fontSize: 15, fontWeight: 600,
        }}>記録する</div>
      </div>
    </ChaShell>
  );
}

// ──────────────────────────────────────────────
// Screen 3 — Monthly Report (calm, narrative)
// ──────────────────────────────────────────────
function ChaReport() {
  const s = useScale();
  return (
    <ChaShell>
      <div style={{ flex: 1, padding: `${14 * s.pad}px 28px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 18px' }}>
          <span style={{ fontFamily: CHA.font, fontSize: 14, color: CHA.muted }}>← 神無月</span>
          <span style={{ fontFamily: CHA.fontAlt, fontSize: 17, color: CHA.earth, fontWeight: 600 }}>霜月の<span style={{ color: CHA.matcha }}>記</span></span>
          <span style={{ fontFamily: CHA.font, fontSize: 14, color: CHA.muted }}>師走 →</span>
        </div>

        {/* Big two-stat hero */}
        <div style={{ paddingTop: 6 }}>
          <div style={{ fontFamily: CHA.fontAlt, fontSize: 10, color: CHA.muted, letterSpacing: 3 }}>つかった おかね</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span style={{ fontFamily: CHA.font, fontSize: 52 * s.fs, color: CHA.earth, lineHeight: 0.95, fontWeight: 600 }}>187,432</span>
            <span style={{ fontFamily: CHA.font, fontSize: 18, color: CHA.muted, marginLeft: 4 }}>円</span>
          </div>
          <div style={{ marginTop: 10, fontFamily: CHA.font, fontSize: 13, color: CHA.earth2 }}>
            先月より <span style={{ color: CHA.matcha, fontWeight: 600 }}>¥8,200 すくない</span>。
          </div>
        </div>

        {/* AI insight card */}
        <div style={{
          marginTop: 20, padding: '14px 16px', background: CHA.matchaSoft, borderRadius: 18,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: -8, left: 14, background: CHA.matcha, color: CHA.paper,
            fontFamily: CHA.fontAlt, fontSize: 10, padding: '2px 10px', borderRadius: 10, letterSpacing: 2 }}>AI</div>
          <div style={{ fontFamily: CHA.font, fontSize: 13, color: CHA.earth, lineHeight: 1.6, marginTop: 4 }}>
            外食が前月より <b>−¥4,800</b>、お家ご飯が増えたようですね。<br />
            <span style={{ color: CHA.earth2 }}>素敵な傾向です。</span>
          </div>
        </div>

        {/* Categories — top 5, vertical hand-drawn bars */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: CHA.fontAlt, fontSize: 10, color: CHA.muted, letterSpacing: 3, marginBottom: 16 }}>分類別</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 * s.gap, height: 140, paddingBottom: 28 }}>
            {MOCK.categories.slice(0, 6).map((c) => {
              const max = 75000;
              const h = (c.spent / max) * 110;
              return (
                <div key={c.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{ fontFamily: CHA.font, fontSize: 9, color: CHA.earth, marginBottom: 4 }}>{(c.spent/1000).toFixed(0)}k</div>
                  <div style={{
                    width: '70%', height: h, background: c.spent >= c.budget ? CHA.rust : CHA.matcha,
                    borderRadius: '4px 4px 0 0',
                  }} />
                  <div style={{
                    fontFamily: CHA.fontAlt, fontSize: 11, color: CHA.earth, marginTop: 6, position: 'absolute', bottom: -20,
                  }}>{c.ja}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ChaTabBar active="anal" />
    </ChaShell>
  );
}

Object.assign(window, { ChaDashboard, ChaInput, ChaReport, CHA });
