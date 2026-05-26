// var2-aizome-graphs.jsx — additional Aizome screens with charts.
// All charts hand-rolled in SVG using the indigo / brass / washi palette
// so they sit comfortably alongside the existing screens. No libraries.

// Helper: arc path for donut segments
function arcPath(cx, cy, rOuter, rInner, startA, endA) {
  const a1 = (startA - 90) * Math.PI / 180;
  const a2 = (endA - 90) * Math.PI / 180;
  const large = endA - startA > 180 ? 1 : 0;
  const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
  const x2 = cx + rOuter * Math.cos(a2), y2 = cy + rOuter * Math.sin(a2);
  const x3 = cx + rInner * Math.cos(a2), y3 = cy + rInner * Math.sin(a2);
  const x4 = cx + rInner * Math.cos(a1), y4 = cy + rInner * Math.sin(a1);
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

// ──────────────────────────────────────────────
// Screen 4 — カテゴリ分析 (donut + ranked list)
// ──────────────────────────────────────────────
function AiCategoryAnalysis() {
  const s = useScale();
  const cats = MOCK.categories.slice(0, 7);
  const total = cats.reduce((a, c) => a + c.spent, 0);
  // Brass-toned segment palette — varies in lightness only, no rainbow
  const palette = [
    AI.brass, '#D9BC85', '#A8845A', '#8a9d6a',
    '#7e8aa3', '#5a6b87', '#384d75',
  ];
  let acc = 0;
  const segments = cats.map((c, i) => {
    const start = (acc / total) * 360;
    acc += c.spent;
    const end = (acc / total) * 360;
    return { start, end, color: palette[i], cat: c };
  });

  return (
    <AiShell>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 10px' }}>
          <span style={{ fontSize: 16, color: AI.indigo }}>←</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>BY CATEGORY</div>
            <div style={{ fontFamily: AI.font, fontSize: 15, color: AI.indigo, fontWeight: 600 }}>分類別 内訳</div>
          </div>
          <span style={{ fontSize: 14, color: AI.indigo }}>⋯</span>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 0 12px' }}>
          {['今週', '今月', '3ヶ月', '今年'].map((p, i) => (
            <div key={p} style={{
              flex: 1, padding: '6px 0', textAlign: 'center',
              background: i === 1 ? AI.indigo : 'transparent',
              color: i === 1 ? AI.brass : AI.textSoft,
              border: '1px solid ' + (i === 1 ? AI.indigo : AI.rule),
              borderRadius: 8, fontSize: 11, fontWeight: 600,
              fontFamily: AI.font,
            }}>{p}</div>
          ))}
        </div>

        {/* Donut */}
        <div style={{
          background: AI.indigo, borderRadius: 18, padding: '18px 0 14px',
          position: 'relative', overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              {segments.map((seg, i) => (
                <path key={i} d={arcPath(90, 90, 78, 52, seg.start, seg.end)}
                  fill={seg.color} stroke={AI.indigo} strokeWidth="1.5" />
              ))}
              {/* Center label */}
              <text x="90" y="80" textAnchor="middle" fontFamily={AI.font}
                fontSize="9" fill={AI.brassSoft} letterSpacing="2">TOTAL</text>
              <text x="90" y="102" textAnchor="middle" fontFamily={AI.font}
                fontSize={22 * s.fs} fill={AI.washi} fontWeight="600" letterSpacing="-0.5">
                ¥187k
              </text>
              <text x="90" y="118" textAnchor="middle" fontFamily={AI.font}
                fontSize="9" fill={AI.brassSoft}>七分類</text>
            </svg>
          </div>
        </div>

        {/* Ranked list */}
        <div style={{ marginTop: 12 }}>
          {segments.slice(0, 5).map((seg, i) => {
            const pct = seg.cat.spent / total * 100;
            return (
              <div key={seg.cat.key} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: `${7 * s.pad}px 0`, borderBottom: '1px solid ' + AI.rule,
              }}>
                <span style={{ fontFamily: AI.mono, fontSize: 10, color: AI.textSoft, width: 16 }}>0{i+1}</span>
                <div style={{ width: 10, height: 10, background: seg.color, borderRadius: 2 }} />
                <span style={{ fontFamily: AI.font, fontSize: 13, flex: 1, color: AI.indigo }}>{seg.cat.ja}</span>
                <span style={{ fontFamily: AI.font, fontSize: 13, color: AI.indigo, fontWeight: 600 }}>¥{seg.cat.spent.toLocaleString()}</span>
                <span style={{ fontFamily: AI.mono, fontSize: 10, color: AI.brass, width: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <AiTabBar active="anal" />
    </AiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 5 — 支出推移 (daily line chart + prev month comparison)
// ──────────────────────────────────────────────
function AiTrend() {
  const s = useScale();
  // Daily cumulative spending for current month
  const cur = MOCK.daily.slice(0, 15);
  const prev = [4200, 8800, 14200, 22300, 28100, 34800, 41200, 52900, 60100, 67400, 75800, 84200, 92100, 98800, 107500];
  let acc = 0;
  const curCum = cur.map((d) => (acc += d));
  // 30 days projection: extend curve to budget at day 30
  const W = 264, H = 130, PAD = 6;
  const maxY = 280000;
  const xAt = (i, total = 30) => PAD + (i / (total - 1)) * (W - PAD * 2);
  const yAt = (v) => H - PAD - (v / maxY) * (H - PAD * 2);

  // Build paths
  const prevPath = prev.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ');
  const curPath = curCum.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ');
  // Budget line at 280k
  const budgetY = yAt(280000);

  return (
    <AiShell>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 10px' }}>
          <span style={{ fontSize: 16, color: AI.indigo }}>←</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>TREND</div>
            <div style={{ fontFamily: AI.font, fontSize: 15, color: AI.indigo, fontWeight: 600 }}>支出 推移</div>
          </div>
          <span style={{ fontSize: 14, color: AI.indigo }}>⋯</span>
        </div>

        {/* Chart card */}
        <div style={{
          background: AI.indigo, borderRadius: 18, padding: '16px 14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.35 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, color: AI.brassSoft, letterSpacing: 3 }}>累計支出 · 15日時点</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span style={{ fontFamily: AI.font, fontSize: 14, color: AI.brass }}>¥</span>
                  <span style={{ fontFamily: AI.font, fontSize: 30 * s.fs, color: AI.washi, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>187,432</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: AI.mono, fontSize: 10, color: AI.brass }}>−¥8,200</div>
                <div style={{ fontSize: 9, color: AI.brassSoft }}>前月比 ↓</div>
              </div>
            </div>

            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10, display: 'block' }}>
              {/* gridlines */}
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={PAD} x2={W - PAD} y1={yAt(maxY * f)} y2={yAt(maxY * f)}
                  stroke="rgba(241,232,211,0.1)" strokeWidth="0.5" />
              ))}
              {/* Budget line */}
              <line x1={PAD} x2={W - PAD} y1={budgetY} y2={budgetY}
                stroke={AI.brass} strokeWidth="1" strokeDasharray="3 3" />
              <text x={W - PAD} y={budgetY - 4} textAnchor="end"
                fontFamily={AI.mono} fontSize="9" fill={AI.brass}>予算 ¥280k</text>
              {/* Previous month */}
              <path d={prevPath} stroke="rgba(241,232,211,0.35)" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
              {/* Current */}
              <path d={`${curPath} L ${xAt(14)} ${H - PAD} L ${PAD} ${H - PAD} Z`} fill={AI.brass} fillOpacity="0.12" />
              <path d={curPath} stroke={AI.brass} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* Last point dot */}
              <circle cx={xAt(14)} cy={yAt(curCum[14])} r="4" fill={AI.brass} />
              <circle cx={xAt(14)} cy={yAt(curCum[14])} r="2" fill={AI.indigo} />
              {/* X labels */}
              {[1, 8, 15, 22, 30].map((d) => (
                <text key={d} x={xAt(d - 1)} y={H - 1} textAnchor="middle"
                  fontFamily={AI.mono} fontSize="8.5" fill={AI.brassSoft}>{d}</text>
              ))}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 9.5, fontFamily: AI.mono }}>
              <span style={{ color: AI.brass, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 2, background: AI.brass, display: 'inline-block' }} /> 今月
              </span>
              <span style={{ color: AI.brassSoft, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 1, background: AI.brassSoft, display: 'inline-block', borderTop: '1px dashed ' + AI.brassSoft }} /> 前月
              </span>
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12, gap: 0, background: AI.washi2, borderRadius: 12, border: '1px solid ' + AI.rule, padding: '12px 0' }}>
          {[
            ['日 平均', '¥12,495'],
            ['最大日', '¥14,800'],
            ['記録日', '14日'],
          ].map(([k, v], i) => (
            <div key={k} style={{
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid ' + AI.rule : 'none',
            }}>
              <div style={{ fontSize: 9, color: AI.textSoft, letterSpacing: 2 }}>{k}</div>
              <div style={{ fontFamily: AI.font, fontSize: 15 * s.fs, color: AI.indigo, marginTop: 2, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Pace insight */}
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 12,
          background: AI.washi2, border: '1px solid ' + AI.rule,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: AI.brass, color: AI.indigo,
            fontFamily: AI.font, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>AI</div>
          <div style={{ flex: 1, fontFamily: AI.font, fontSize: 11.5, color: AI.text, lineHeight: 1.5 }}>
            このペースなら月末 <b style={{ color: AI.indigo }}>¥249,900</b>、予算内に収まります。
          </div>
        </div>
      </div>
      <AiTabBar active="anal" />
    </AiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 6 — 家族別 (stacked horizontal bars)
// ──────────────────────────────────────────────
function AiFamily() {
  const s = useScale();
  // Member × top categories matrix (mocked breakdown)
  const matrix = [
    { who: '父',     food: 18200, transit: 6400, leisure: 8800, culture: 4200, etc: 40820 },
    { who: '母',     food: 24500, transit: 1200, leisure: 3400, culture: 2200, etc: 33510 },
    { who: '太郎',   food: 4200,  transit: 1800, leisure: 1800, culture:  400, etc: 20440 },
    { who: 'さくら', food: 1330,  transit:  440, leisure:  200, culture:    0, etc: 13592 },
  ];
  const palette = ['#C9A55C', '#D9BC85', '#8a9d6a', '#7e8aa3', '#5a6b87'];
  const labels = ['食費', '交通', '娯楽', '教養', 'その他'];
  const totalAll = matrix.reduce((a, m) => a + m.food + m.transit + m.leisure + m.culture + m.etc, 0);

  return (
    <AiShell>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 10px' }}>
          <span style={{ fontSize: 16, color: AI.indigo }}>←</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>BY MEMBER</div>
            <div style={{ fontFamily: AI.font, fontSize: 15, color: AI.indigo, fontWeight: 600 }}>家族別 内訳</div>
          </div>
          <span style={{ fontSize: 14, color: AI.indigo }}>⋯</span>
        </div>

        {/* Hero total */}
        <div style={{
          background: AI.indigo, color: AI.washi, borderRadius: 16, padding: '14px 16px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.4 }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, color: AI.brassSoft, letterSpacing: 3 }}>家族合計</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
                <span style={{ fontFamily: AI.font, fontSize: 12, color: AI.brass }}>¥</span>
                <span style={{ fontFamily: AI.font, fontSize: 26 * s.fs, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1 }}>187,432</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {MOCK.family.map((m, i) => (
                <div key={m.name} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: AI.washi2, color: AI.indigo,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: AI.font, fontSize: 12, fontWeight: 600,
                  border: '1.5px solid ' + AI.brass,
                  marginLeft: i > 0 ? -10 : 0,
                }}>{m.name[0]}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked bars */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 * s.gap }}>
          {matrix.map((m, idx) => {
            const segs = ['food', 'transit', 'leisure', 'culture', 'etc'].map((k) => m[k]);
            const total = segs.reduce((a, b) => a + b, 0);
            // bar width proportional to total spend, max value is largest member total
            const max = Math.max(...matrix.map((mm) => mm.food + mm.transit + mm.leisure + mm.culture + mm.etc));
            const barW = (total / max) * 100;
            return (
              <div key={m.who}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: AI.indigo, color: AI.washi,
                    fontFamily: AI.font, fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{m.who[0]}</div>
                  <span style={{ fontFamily: AI.font, fontSize: 13, color: AI.indigo, flex: 1, fontWeight: 600 }}>{m.who}</span>
                  <span style={{ fontFamily: AI.font, fontSize: 13, color: AI.indigo, fontWeight: 600 }}>¥{total.toLocaleString()}</span>
                  <span style={{ fontFamily: AI.mono, fontSize: 10, color: AI.brass, width: 36, textAlign: 'right' }}>{(total/totalAll*100).toFixed(0)}%</span>
                </div>
                <div style={{
                  height: 14, display: 'flex', borderRadius: 4, overflow: 'hidden',
                  background: AI.washi2, width: barW + '%',
                  border: '1px solid ' + AI.rule, minWidth: 30,
                }}>
                  {segs.map((v, i) => (
                    <div key={i} style={{ flex: v, background: palette[i] }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: 16, padding: '10px 12px', background: AI.washi2, borderRadius: 10,
          border: '1px solid ' + AI.rule, display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          {labels.map((l, i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, background: palette[i], borderRadius: 2 }} />
              <span style={{ fontFamily: AI.font, fontSize: 11, color: AI.text }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <AiTabBar active="anal" />
    </AiShell>
  );
}

// ──────────────────────────────────────────────
// Screen 7 — カレンダー (heatmap in indigo)
// ──────────────────────────────────────────────
function AiCalendar() {
  const s = useScale();
  const startDay = 5; // Nov 1 2025 = Saturday (col 6 / index 5 in Sun-start)
  const daily = [
    8200, 4100,  6300, 12400, 5800,  3200, 14800,
    6100, 2800, 11200,  4400, 7900,  5100,  8800,
    5247, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const dayHover = 14; // index 14 = day 15

  return (
    <AiShell>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 10px' }}>
          <span style={{ fontSize: 16, color: AI.indigo }}>← 10月</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: AI.textSoft, letterSpacing: 3 }}>NOV 2025</div>
            <div style={{ fontFamily: AI.font, fontSize: 15, color: AI.indigo, fontWeight: 600 }}>霜月 暦</div>
          </div>
          <span style={{ fontSize: 14, color: AI.indigo }}>12月 →</span>
        </div>

        {/* Day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['日','月','火','水','木','金','土'].map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontFamily: AI.font, fontSize: 10,
              color: i === 0 ? '#a44231' : i === 6 ? AI.indigo : AI.textSoft,
              padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: startDay }).map((_, i) => <div key={'p'+i} />)}
          {daily.map((amt, i) => {
            const day = i + 1;
            const level = amt === 0 ? 0 : amt < 4000 ? 1 : amt < 7000 ? 2 : amt < 11000 ? 3 : 4;
            const bgs = [AI.washi2, 'rgba(56,77,117,0.25)', 'rgba(56,77,117,0.5)', AI.indigo2, AI.indigo];
            const isSelected = day === 15;
            const future = day > 15;
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 6, position: 'relative',
                background: future ? 'transparent' : bgs[level],
                border: isSelected ? '2px solid ' + AI.brass : '1px solid ' + (future ? AI.rule : 'transparent'),
                display: 'flex', flexDirection: 'column',
                padding: '3px 5px 2px',
                color: level >= 3 ? AI.washi : (future ? AI.textSoft : AI.text),
                opacity: future ? 0.5 : 1,
              }}>
                <span style={{ fontFamily: AI.font, fontSize: 11, fontWeight: isSelected ? 700 : 500 }}>{day}</span>
                {amt > 0 && !future && (
                  <span style={{
                    fontFamily: AI.mono, fontSize: 7.5, fontWeight: 600,
                    color: level >= 3 ? AI.brass : AI.indigo,
                    marginTop: 'auto',
                  }}>
                    {amt >= 10000 ? (amt/1000).toFixed(0) + 'k' : amt}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 9, color: AI.textSoft, fontFamily: AI.mono }}>少</span>
          {[AI.washi2, 'rgba(56,77,117,0.25)', 'rgba(56,77,117,0.5)', AI.indigo2, AI.indigo].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, background: c, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }} />
          ))}
          <span style={{ fontSize: 9, color: AI.textSoft, fontFamily: AI.mono }}>多</span>
        </div>

        {/* Selected day detail card */}
        <div style={{
          marginTop: 14, background: AI.indigo, color: AI.washi, borderRadius: 14, padding: '12px 14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: ASANOHA_BG, opacity: 0.35 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 10, color: AI.brass, letterSpacing: 2 }}>11月15日（土）</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
                  <span style={{ fontFamily: AI.font, fontSize: 12, color: AI.brass }}>¥</span>
                  <span style={{ fontFamily: AI.font, fontSize: 22 * s.fs, fontWeight: 600, lineHeight: 1 }}>5,247</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: AI.brassSoft, textAlign: 'right' }}>4件の記録</div>
            </div>
            <div style={{ height: 1, background: 'rgba(201,165,92,0.25)', margin: '10px 0 8px' }} />
            {MOCK.recent.slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                <span style={{ color: AI.brassSoft }}>{r.t} · {r.who}</span>
                <span style={{ color: AI.washi, flex: 1, marginLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.memo}</span>
                <span style={{ fontFamily: AI.font, fontWeight: 600 }}>¥{r.amt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiTabBar active="cal" />
    </AiShell>
  );
}

Object.assign(window, { AiCategoryAnalysis, AiTrend, AiFamily, AiCalendar });
