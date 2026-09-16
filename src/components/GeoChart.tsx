"use client";

/**
 * State-level place of performance. Bars, not a choropleth.
 *
 * A US map would spend most of its pixels on states with no propulsion work at all,
 * and would make Utah -- small on screen, decisive in the supply chain -- visually
 * trivial. Ranked bars put the concentration itself in the foreground.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePalette } from "@/lib/palette";
import { signals, usd, usdAxis } from "@/lib/signals";

export function GeoChart({ top = 8 }: { top?: number }) {
  const p = usePalette();
  const states = signals.geography.states.slice(0, top);

  return (
    <div style={{ height: states.length * 36 + 48 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={states}
          layout="vertical"
          margin={{ top: 4, right: 76, bottom: 4, left: 8 }}
          barCategoryGap={6}
        >
          <CartesianGrid stroke={p.border} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: p.muted, fontSize: 12 }}
            tickFormatter={(v) => usdAxis(v as number)}
            stroke={p.border}
          />
          <YAxis
            type="category"
            dataKey="state"
            tick={{ fill: p.text, fontSize: 12.5 }}
            stroke={p.border}
            width={42}
          />
          <Tooltip
            cursor={{ fill: p.primary, fillOpacity: 0.05 }}
            contentStyle={{
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: p.text,
              maxWidth: 280,
            }}
            formatter={(v, _n, item) => {
              const d = item?.payload as { name: string; note: string | null };
              return [`${usd(v as number)}${d.note ? ` — ${d.note}` : ""}`, d.name];
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {states.map((s, i) => (
              /* Only the leading state is emphasised. An earlier version highlighted
                 Utah on the assumption that the largest US motor plant would rank
                 high here; under the DoD lens it is about 1%, which is a finding in
                 its own right and is stated in the caveat rather than implied by
                 colour. */
              <Cell key={s.state} fill={i === 0 ? p.primary : p.primarySoft} />
            ))}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(v) => usd(Number(v))}
              style={{ fill: p.muted, fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
