'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartProps {
  userRegistrationsOverTime: { date: string; value: number }[];
  activeSessionsOverTime: { date: string; value: number }[];
}

export function AnalyticsCharts({ userRegistrationsOverTime, activeSessionsOverTime }: ChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userRegistrationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>User activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeSessionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 