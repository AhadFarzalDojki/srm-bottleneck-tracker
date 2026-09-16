"use client";

/**
 * The project's most persuasive single visual: three series on one axis.
 *
 *   DoD / NAICS 336415  -- the propulsion buildup (primary)
 *   NASA / NAICS 336415 -- same product code, moving the other way (control)
 *   PSC 1337            -- the SRM-specific code, flat (finding by absence)
 *
 * The control line is the point. Without it, a reader can reasonably ask whether the
 * DoD line is just a space-launch accounting artifact in a shared NAICS code. With
 * it, that reading is ruled out on the same chart.
 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePalette } from "@/lib/palette";
import { signals, usd, usdAxis } from "@/lib/signals";

const LABELS: Record<string, string> = {
  dod_336415: "DoD — NAICS 336415 (propulsion mfg)",
  nasa_336415: "NASA — NAICS 336415 (control)",
  psc1337: "PSC 1337 (solid-fuel motors)",
};

export function SurgeChart() {
  const p = usePalette();
  const { series, surge } = signals;

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={p.border} vertical={false} />
          {/* Shade the post-inflection years so the step change is legible at a glance. */}
          <ReferenceArea
            x1={surge.recent_fys[0]}
            x2={surge.recent_fys[surge.recent_fys.length - 1]}
            fill={p.primary}
            fillOpacity={0.06}
            stroke="none"
          />
          <XAxis
            dataKey="fy"
            tick={{ fill: p.muted, fontSize: 12 }}
            tickFormatter={(fy) => `FY${String(fy).slice(2)}`}
            stroke={p.border}
          />
          <YAxis
            tick={{ fill: p.muted, fontSize: 12 }}
            tickFormatter={(v) => usdAxis(v as number)}
            stroke={p.border}
            width={62}
          />
          <Tooltip
            contentStyle={{
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: p.text,
            }}
            labelFormatter={(fy) => `FY${fy}`}
            formatter={(v, name) => [usd(v as number), LABELS[name as string] ?? name]}
          />
          <Legend
            verticalAlign="top"
            height={38}
            iconType="plainline"
            wrapperStyle={{ fontSize: 12.5, color: p.muted }}
            formatter={(name) => LABELS[name as string] ?? name}
          />
          <Line
            type="monotone"
            dataKey="dod_336415"
            stroke={p.primary}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: p.primary, strokeWidth: 0 }}
            activeDot={{ r: 4.5 }}
          />
          <Line
            type="monotone"
            dataKey="nasa_336415"
            stroke={p.control}
            strokeWidth={1.75}
            strokeDasharray="5 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="psc1337"
            stroke={p.secondary}
            strokeWidth={1.75}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
