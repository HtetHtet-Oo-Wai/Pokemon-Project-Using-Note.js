// src/components/HpProgressModel.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HpEntry {
  round: number;
  p1Hp: number;
  p2Hp: number;
  p1Name: string;
  p2Name: string;
}

interface HpProgressModalProps {
  open: boolean;
  onClose: () => void;
  data: HpEntry[];
  p1Name: string;
  p2Name: string;
}

export default function HpProgressModal({
  open,
  onClose,
  data,
  p1Name,
  p2Name,
}: HpProgressModalProps) {
  const hasData = data.length > 0;

  const maxHp = hasData
    ? Math.max(...data.map((d) => Math.max(d.p1Hp, d.p2Hp)))
    : 100;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose(); // ✅ correct close handling
      }}
    >
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-primary">
            📊 HP Progress Over Rounds
          </DialogTitle>
        </DialogHeader>

        {!hasData ? (
          <p className="text-muted-foreground text-center py-8">
            No battle data yet. Play a game first!
          </p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />

                <XAxis
                  dataKey="round"
                  stroke="hsl(220, 10%, 55%)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (v === 0 ? "Start" : `R${v}`)}
                  label={{
                    value: "Round",
                    position: "insideBottom",
                    offset: -5,
                    fill: "hsl(220, 10%, 55%)",
                  }}
                />

                <YAxis
                  stroke="hsl(220, 10%, 55%)"
                  tick={{ fontSize: 12 }}
                  domain={[0, maxHp]}
                  label={{
                    value: "HP",
                    angle: -90,
                    position: "insideLeft",
                    fill: "hsl(220, 10%, 55%)",
                  }}
                />

                <Tooltip
                  formatter={(value: number) => [`${value} HP`, ""]}
                  labelFormatter={(label) => (label === 0 ? "Start" : `Round ${label}`)}
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 12%)",
                    border: "1px solid hsl(220, 15%, 20%)",
                    borderRadius: "8px",
                    color: "hsl(45, 30%, 90%)",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="p1Hp"
                  name={p1Name}
                  stroke="hsl(0, 80%, 55%)"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "hsl(0, 80%, 55%)" }}
                  activeDot={{ r: 8 }}
                />

                <Line
                  type="monotone"
                  dataKey="p2Hp"
                  name={p2Name}
                  stroke="hsl(210, 85%, 55%)"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "hsl(210, 85%, 55%)" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { HpEntry };