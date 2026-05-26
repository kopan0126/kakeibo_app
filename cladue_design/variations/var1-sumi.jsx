// var1-sumi.jsx — 墨と朱 (Sumi & Shu): ink-on-paper, vermillion accent.
// Aesthetic: extreme minimalism, big mincho numbers, hairline rules, deep
// red single-stroke accents. Editorial book feel.

const SUMI = {
  bg:     '#F2EDE3',  // 生成り (kinari)
  paper:  '#FBF7EE',  // brighter washi
  ink:    '#1A1612',  // 墨
  ink2:   '#3a332b',
  muted:  '#8a847b',
  rule:   '#cfc6b3',
  shu:    '#B4322A',  // 朱
  shuSoft:'#d97a6c',
  font:   "'Shippori Mincho', 'Noto Serif JP', serif",
  sans:   "'Noto Sans JP', system-ui, sans-serif",
  mono:   "'JetBrains Mono', 'Shippori Mincho', monospace",
};

function SumiShell({ children, dark = false, statusDark = false }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 36,
      background: dark ? SUMI.ink : SUMI.bg,
      color: dark ? SUMI.bg : SUMI.ink,
      fontFamily: SUMI.sans, overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 20px 40px -20px rgba(40,30,20,0.18)',
      border: '1px solid ' + (dark ? '#0a0806' : '#e6dfd0'),
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 36, padding: '12px 24px 0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 600,
        color: statusDark || dark ? '#fff' : SUMI.ink, fontFamily: SUMI.sans,
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 1 }}>● ● ●</span>
      </div>
      {children}
      {/* Home indicator */}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 2,
        background: dark ? 'rgba(255,255,255,0.6)' : 'rgba(26,22,18,0.5)' }} />
    </div>
  );
}

function SumiHairline({ vertical = false, color = SUMI.rule, style = {} }) {
  return <div style={{
    background: color,
    width: vertical ? 1 : '100%',
    height: vertical ? '100%' : 1,
    ...style,
  }} />;
}

// ──────────────────────────────────────────────
// Screen 1 — Dashboard
// ──────────────────────────────────────────────
function SumiDashboard() {
  const s = useScale();
  return (
    <SumiShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 26px 0`, overflow: 'hidden', position: 'relative' }}>
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 6 }}>
          <div>
            <div style={{ fontFamily: SUMI.font, fontSize: 11, color: SUMI.muted, letterSpacing: 4 }}>KAKEIBO  NOV  2025</div>
            <div style={{ fontFamily: SUMI.font, fontSize: 44 * s.fs, lineHeight: 1, marginTop: 4, color: SUMI.ink, fontWeight: 500 }}>
              霜月<span style={{ fontSize: 14, color: SUMI.shu, marginLeft: 8, verticalAlign: 'top', fontWeight: 400 }}>第十五日</span>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid ' + SUMI.rule, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SUMI.font, fontSize: 16 }}>家</div>
        </div>
        <SumiHairline style={{ margin: '14px 0 16px' }} />

        {/* Hero — remaining */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, fontFamily: SUMI.font }}>本月 残り</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span style={{ fontFamily: SUMI.font, fontSize: 13, color: SUMI.shu }}>¥</span>
            <span style={{ fontFamily: SUMI.font, fontSize: 52 * s.fs, lineHeight: 1, color: SUMI.ink, fontWeight: 500, letterSpacing: -1 }}>92,568</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: SUMI.muted }}>
            <span>使用 ¥187,432 / ¥280,000</span>
            <span style={{ fontFamily: SUMI.font }}>余十五日</span>
          </div>
          {/* progress as single thin rule */}
          <div style={{ marginTop: 10, height: 2, background: SUMI.rule, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: '67%', background: SUMI.shu }} />
            <div style={{ position: 'absolute', top: -3, left: '67%', width: 1, height: 8, background: SUMI.shu }} />
          </div>
        </div>

        <SumiHairline style={{ margin: '20px 0 14px' }} />

        {/* Traditional four buckets */}
        <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, marginBottom: 8, fontFamily: SUMI.font }}>四つの財布 · FOUR PURSES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 * s.gap }}>
          {MOCK.kakeibo.map((k) => {
            const pct = Math.round((k.spent / k.budget) * 100);
            const over = pct >= 100;
            return (
              <div key={k.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: SUMI.font, fontSize: 15, color: SUMI.ink }}>{k.ja}</span>
                  <span style={{ fontFamily: SUMI.font, fontSize: 14, color: SUMI.ink2 }}>
                    {yen(k.spent)}<span style={{ color: SUMI.muted, fontSize: 11 }}> / {yen(k.budget)}</span>
                  </span>
                </div>
                <div style={{ marginTop: 4, height: 1, background: SUMI.rule, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: Math.min(pct, 100) + '%', background: over ? SUMI.shu : SUMI.ink, height: 2, marginTop: -0.5 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <SumiTabBar active="家" />
    </SumiShell>
  );
}

function SumiTabBar({ active }) {
  const items = [['家', 'ホーム'], ['入', '記入'], ['暦', '暦'], ['析', '分析'], ['設', '設定']];
  return (
    <div style={{ borderTop: '1px solid ' + SUMI.rule, padding: '10px 18px 22px', display: 'flex', justifyContent: 'space-between' }}>
      {items.map(([k, l]) => {
        const on = k === active;
        return (
          <div key={k} style={{ textAlign: 'center', width: 48 }}>
            <div style={{ fontFamily: SUMI.font, fontSize: 18, color: on ? SUMI.shu : SUMI.ink2 }}>{k}</div>
            <div style={{ fontSize: 9, color: on ? SUMI.shu : SUMI.muted, marginTop: 2, letterSpacing: 1 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Screen 2 — Expense Input
// ──────────────────────────────────────────────
function SumiInput() {
  const s = useScale();
  return (
    <SumiShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 26px 0`, overflow: 'hidden' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <span style={{ fontSize: 13, color: SUMI.muted }}>← 戻る</span>
          <span style={{ fontFamily: SUMI.font, fontSize: 15 }}>記入</span>
          <span style={{ fontSize: 13, color: SUMI.shu, fontWeight: 600 }}>記す</span>
        </div>

        <SumiHairline style={{ margin: '14px 0 24px' }} />

        {/* Amount hero */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, fontFamily: SUMI.font }}>金 額</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, paddingBottom: 6 }}>
          <span style={{ fontFamily: SUMI.font, fontSize: 18, color: SUMI.shu }}>¥</span>
          <span style={{ fontFamily: SUMI.font, fontSize: 56 * s.fs, lineHeight: 1, color: SUMI.ink, fontWeight: 500 }}>3,840</span>
        </div>
        <div style={{ height: 1.5, background: SUMI.shu, width: '70%', margin: '4px auto 0' }} />

        <SumiHairline style={{ margin: '20px 0' }} />

        {/* Category */}
        <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, marginBottom: 10, fontFamily: SUMI.font }}>分類 · CATEGORY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 * s.gap, marginBottom: 16 }}>
          {MOCK.categories.slice(0, 10).map((c, i) => {
            const on = i === 0;
            return (
              <div key={c.key} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1px solid ' + (on ? SUMI.shu : SUMI.rule),
                background: on ? SUMI.shu : 'transparent',
                color: on ? SUMI.paper : SUMI.ink,
                borderRadius: 2,
              }}>
                <span style={{ fontFamily: SUMI.font, fontSize: 16, lineHeight: 1 }}>{c.ja[0]}</span>
              </div>
            );
          })}
        </div>

        <SumiHairline style={{ margin: '14px 0' }} />

        {/* Rows */}
        {[
          ['日付', '令和七年 霜月十五日 土'],
          ['記入者', '母'],
          ['店舗', 'スーパー成城'],
          ['備考', '夕食材一式'],
        ].map(([k, v], i, arr) => (
          <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${10 * s.pad}px 0` }}>
              <span style={{ fontFamily: SUMI.font, fontSize: 13, color: SUMI.muted }}>{k}</span>
              <span style={{ fontSize: 13, color: SUMI.ink, fontFamily: SUMI.font }}>{v}</span>
            </div>
            {i < arr.length - 1 && <SumiHairline />}
          </div>
        ))}
      </div>

      {/* Bottom: receipt option */}
      <div style={{ padding: '12px 26px 30px', borderTop: '1px solid ' + SUMI.rule, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: SUMI.font, fontSize: 12, color: SUMI.ink2 }}>📷  領収書から読取</span>
        <span style={{ fontFamily: SUMI.font, fontSize: 12, color: SUMI.shu }}>AI 補助 →</span>
      </div>
    </SumiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 3 — Monthly Report
// ──────────────────────────────────────────────
function SumiReport() {
  const s = useScale();
  const totalBudget = MOCK.categories.reduce((a, c) => a + c.budget, 0);
  return (
    <SumiShell>
      <div style={{ flex: 1, padding: `${10 * s.pad}px 26px 0`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, fontFamily: SUMI.font }}>MONTHLY REPORT</div>
            <div style={{ fontFamily: SUMI.font, fontSize: 28 * s.fs, marginTop: 2, fontWeight: 500 }}>月　報</div>
          </div>
          <div style={{ fontFamily: SUMI.font, fontSize: 12, color: SUMI.muted }}>{'<'} 霜月 {'>'}</div>
        </div>

        <SumiHairline style={{ margin: '12px 0 16px' }} />

        {/* Trio summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0, paddingBottom: 4 }}>
          {[
            ['予算', '280,000'],
            ['支出', '187,432'],
            ['残額', '92,568'],
          ].map(([k, v], i) => (
            <React.Fragment key={k}>
              <div style={{ textAlign: 'center', padding: '0 4px' }}>
                <div style={{ fontSize: 9, color: SUMI.muted, letterSpacing: 3, fontFamily: SUMI.font }}>{k}</div>
                <div style={{ fontFamily: SUMI.font, fontSize: 17 * s.fs, marginTop: 4, color: i === 2 ? SUMI.shu : SUMI.ink }}>¥{v}</div>
              </div>
              {i < 2 && <div style={{ background: SUMI.rule }} />}
            </React.Fragment>
          ))}
        </div>

        <SumiHairline style={{ margin: '14px 0 12px' }} />

        {/* Category breakdown */}
        <div style={{ fontSize: 10, color: SUMI.muted, letterSpacing: 3, marginBottom: 8, fontFamily: SUMI.font }}>分類別 内訳</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 * s.gap }}>
          {MOCK.categories.slice(0, 8).map((c) => {
            const pct = c.spent / c.budget;
            return (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: SUMI.font, fontSize: 13 }}>{c.ja}</span>
                  <span style={{ fontFamily: SUMI.font, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {yen(c.spent)}
                    <span style={{ color: SUMI.muted, fontSize: 10 }}> ({Math.round(pct * 100)}%)</span>
                  </span>
                </div>
                <div style={{ marginTop: 3, height: 1, background: SUMI.rule, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: Math.min(pct, 1) * 100 + '%', background: pct >= 1 ? SUMI.shu : SUMI.ink, height: pct >= 1 ? 2 : 1 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SumiTabBar active="析" />
    </SumiShell>
  );
}

Object.assign(window, { SumiDashboard, SumiInput, SumiReport, SUMI });
