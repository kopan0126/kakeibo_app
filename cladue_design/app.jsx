// app.jsx — main orchestrator. Wraps everything in a DensityCtx provider
// + DesignCanvas with 5 variation sections + TweaksPanel for info density.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "frame": "phone"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <DensityCtx.Provider value={t.density}>
      <DesignCanvas>
        <DCSection id="intro" title="家計簿アプリ · 和モダン探索" subtitle="5つの方向性 × 3画面 — ダッシュボード / 記入 / 月報">
          <DCPostIt width={320} height={200}>
            <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 14, lineHeight: 1.7, color: '#5a4a2a' }}>
              <b>和モダン家計簿 — 5案</b><br />
              ①墨と朱 — 明朝・朱の差し色 / ②藍染 — 深い藍 + 真鍮<br />
              ③茶室 — 抹茶 + 余白 / ④市松 — 編集的グリッド<br />
              ⑤桜と苔 — 家族向け<br /><br />
              <span style={{ color: '#B4322A' }}>右下の Tweaks で情報密度を切替</span>
            </div>
          </DCPostIt>
        </DCSection>

        <DCSection id="v1" title="① 墨と朱 · Sumi & Shu" subtitle="ミニマル明朝 — 生成りの紙に墨と朱の差し色。書物のような静けさ。">
          <DCArtboard id="v1-home" label="ホーム" width={PHONE_W} height={PHONE_H}><SumiDashboard /></DCArtboard>
          <DCArtboard id="v1-input" label="記入" width={PHONE_W} height={PHONE_H}><SumiInput /></DCArtboard>
          <DCArtboard id="v1-report" label="月報" width={PHONE_W} height={PHONE_H}><SumiReport /></DCArtboard>
        </DCSection>

        <DCSection id="v2" title="② 藍染 · Aizome" subtitle="深い藍に和紙クリーム、真鍮（しんちゅう）の差し色。麻の葉文様を背景に。">
          <DCArtboard id="v2-home" label="ホーム" width={PHONE_W} height={PHONE_H}><AiDashboard /></DCArtboard>
          <DCArtboard id="v2-input" label="記入" width={PHONE_W} height={PHONE_H}><AiInput /></DCArtboard>
          <DCArtboard id="v2-report" label="月報" width={PHONE_W} height={PHONE_H}><AiReport /></DCArtboard>
        </DCSection>

        <DCSection id="v2-graphs" title="② 藍染 · グラフ深掘り" subtitle="ドーナツ / 折れ線 / 積層バー / カレンダーヒートマップ — 全て藍と真鍮のパレットで自前SVG。">
          <DCArtboard id="v2-donut" label="カテゴリ分析" width={PHONE_W} height={PHONE_H}><AiCategoryAnalysis /></DCArtboard>
          <DCArtboard id="v2-trend" label="支出推移" width={PHONE_W} height={PHONE_H}><AiTrend /></DCArtboard>
          <DCArtboard id="v2-family" label="家族別" width={PHONE_W} height={PHONE_H}><AiFamily /></DCArtboard>
          <DCArtboard id="v2-cal" label="カレンダー" width={PHONE_W} height={PHONE_H}><AiCalendar /></DCArtboard>
        </DCSection>

        <DCSection id="v3" title="③ 茶室 · Chashitsu" subtitle="畳のベージュに抹茶。余白多め、Klee Oneの手書き風数字で柔らかく。">
          <DCArtboard id="v3-home" label="ホーム" width={PHONE_W} height={PHONE_H}><ChaDashboard /></DCArtboard>
          <DCArtboard id="v3-input" label="記入" width={PHONE_W} height={PHONE_H}><ChaInput /></DCArtboard>
          <DCArtboard id="v3-report" label="月報" width={PHONE_W} height={PHONE_H}><ChaReport /></DCArtboard>
        </DCSection>

        <DCSection id="v4" title="④ 市松 · Ichimatsu" subtitle="市松文様のグリッドを応用した編集的レイアウト。情報密度高め、浅葱（あさぎ）の差し色。">
          <DCArtboard id="v4-home" label="ホーム" width={PHONE_W} height={PHONE_H}><IchiDashboard /></DCArtboard>
          <DCArtboard id="v4-input" label="記入" width={PHONE_W} height={PHONE_H}><IchiInput /></DCArtboard>
          <DCArtboard id="v4-report" label="月報" width={PHONE_W} height={PHONE_H}><IchiReport /></DCArtboard>
        </DCSection>

        <DCSection id="v5" title="⑤ 桜と苔 · Sakura & Koke" subtitle="桜のピンクと苔の緑。家族中心のあたたかな構成 — アバターが主役。">
          <DCArtboard id="v5-home" label="ホーム" width={PHONE_W} height={PHONE_H}><SakDashboard /></DCArtboard>
          <DCArtboard id="v5-input" label="記入" width={PHONE_W} height={PHONE_H}><SakInput /></DCArtboard>
          <DCArtboard id="v5-report" label="月報" width={PHONE_W} height={PHONE_H}><SakReport /></DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="情報密度 · Info Density" />
        <TweakRadio
          label="表示"
          value={t.density}
          options={['comfy', 'regular', 'dense']}
          onChange={(v) => setTweak('density', v)}
        />
        <div style={{ fontSize: 11, color: '#888', padding: '4px 0 6px', lineHeight: 1.5 }}>
          ゆとり / 標準 / 密 — パディング・行高・フォントスケールが連動して変化します。
        </div>
      </TweaksPanel>
    </DensityCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
