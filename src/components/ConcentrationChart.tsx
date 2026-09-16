"use client";

/**
 * Owner-group shares of propulsion-coded DoD obligations, FY20-25.
 *
 * Horizontal bars because the labels are company names, and because the reader's
 * question is "how long is the first bar compared to everything else" -- which a
 * horizontal layout answers without a legend.
 *
 * Bars are rolled up to owner groups (see scripts/build_parents.py). Rendering raw
 * recipient rows here would show the leader at 39.6% instead of 78.0%.
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
import { pct, signals, usd } from "@/lib/signals";

export function ConcentrationChart({ top = 8 }: { top?: number }) {
  const p = usePalette();
  const groups = signals.concentration.groups.slice(0, top);

  return (
    <div style={{ height: groups.length * 40 + 48 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={groups}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
          barCategoryGap={8}
        >
          <CartesianGrid stroke={p.border} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: p.muted, fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
            stroke={p.border}
          />
          <YAxis
            type="category"
            dataKey="group"
            tick={{ fill: p.text, fontSize: 12.5 }}
            stroke={p.border}
            width={132}
          />
          <Tooltip
            cursor={{ fill: p.primary, fillOpacity: 0.05 }}
            contentStyle={{
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: p.text,
            }}
            formatter={(v, _n, item) => {
              const d = item?.payload as { amount: number; entities: number };
              return [
                `${pct(v as number)} — ${usd(d.amount)} across ${d.entities} registered ${
                  d.entities === 1 ? "entity" : "entities"
                }`,
                "Share of window obligations",
              ];
            }}
          />
          <Bar dataKey="share" radius={[0, 4, 4, 0]}>
            {groups.map((g, i) => (
              <Cell key={g.group} fill={i === 0 ? p.primary : p.primarySoft} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v) => pct(Number(v))}
              style={{ fill: p.muted, fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
