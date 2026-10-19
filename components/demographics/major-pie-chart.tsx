"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type MajorData = {
    name: string;
    value: number;
};

type MajorPieChartProps = {
    data: MajorData[];
};

const COLORS = ['#0055a4', '#89abe3', '#ffc000', '#ffd966', '#a5c05b', '#e6e6e6', '#c4c4c4', '#666666'];

export default function MajorPieChart({ data }: MajorPieChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No major data available.</div>;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [`${value} members`, 'Count']}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
