"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = {
  blue: "#2563eb",
  pale: "#93c5fd",
  green: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  grey: "#94a3b8",
};
export function ReachChart({ data }: { data: { m: string; v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 12, top: 10 }}>
        <defs>
          <linearGradient id="reach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.blue} stopOpacity={0.2} />
            <stop offset="1" stopColor={colors.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />
        <XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis axisLine={false} tickLine={false} fontSize={11} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="v"
          name="Beneficiaries"
          stroke={colors.blue}
          strokeWidth={2.5}
          fill="url(#reach)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function TargetChart({
  data,
}: {
  data: { name: string; target: number; actual: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 18 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="#e2e8f0"
        />
        <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis
          type="category"
          dataKey="name"
          width={116}
          axisLine={false}
          tickLine={false}
          fontSize={10}
        />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="target"
          name="Target"
          fill={colors.pale}
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="actual"
          name="Actual"
          fill={colors.blue}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
export function StatusChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={88}
          paddingAngle={3}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
export function ProgrammeChart({ data }: { data: { name: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ left: -18, right: 15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          fontSize={11}
        />
        <Tooltip />
        <Bar
          dataKey="score"
          name="Performance %"
          fill={colors.blue}
          radius={[6, 6, 0, 0]}
          barSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
export function DisaggregationChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ left: -18, right: 15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
        <YAxis axisLine={false} tickLine={false} fontSize={11} />
        <Tooltip />
        <Bar
          dataKey="value"
          name="Beneficiaries"
          fill={colors.pale}
          radius={[6, 6, 0, 0]}
          barSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
