import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ProductSalesData {
  productName: string;
  orderCount: number;
  totalRevenue: number;
  unitsSold: number;
}

interface ProductSalesChartProps {
  data: ProductSalesData[];
  metric?: 'orderCount' | 'totalRevenue' | 'unitsSold';
  title?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];

const ProductSalesChart = ({ 
  data, 
  metric = 'orderCount',
  title = 'Top Products by Orders'
}: ProductSalesChartProps) => {
  // Sort data by the selected metric in descending order and take top 10
  const sortedData = [...data]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 10);

  const getMetricLabel = () => {
    switch (metric) {
      case 'orderCount':
        return 'Number of Orders';
      case 'totalRevenue':
        return 'Revenue ($)';
      case 'unitsSold':
        return 'Units Sold';
      default:
        return 'Value';
    }
  };

  const formatValue = (value: number) => {
    if (metric === 'totalRevenue') {
      return `$${value.toFixed(2)}`;
    }
    return value.toString();
  };

  return (
    <div className="w-full h-96 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      {sortedData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No product data available for the selected period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="productName" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => formatValue(value)}
              labelStyle={{ color: '#1f2937' }}
            />
            <Bar dataKey={metric} name={getMetricLabel()} radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProductSalesChart;
