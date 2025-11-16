import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface RevenueChartData {
  date: string;
  revenue: number;
}

const RevenueChart = ({ data }: { data: RevenueChartData[] }) => {
  return (
    <div className="w-full h-80 bg-white rounded-2xl shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Revenue by Date Range</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis dataKey="revenue" />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;