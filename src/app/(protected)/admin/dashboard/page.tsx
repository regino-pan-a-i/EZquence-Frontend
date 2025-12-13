'use client';
import ScoreCard from '@/components/scorecard/ScoreCard';
import ProductionGoalsManager from '@/components/admin/ProductionGoalsManager';
import { FaDollarSign, FaReceipt, FaTachometerAlt, FaExclamationTriangle, FaBoxes, FaClock, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import { getApiBaseUrl } from '@/utils/apiConfig';
import DateFilter from '@/components/filters/DateFilter';
import { useQuery } from '@tanstack/react-query';
import { Order, OrdersByDateRangeResponse, OrderStatus, InventoryResponse, InventoryNeedResponse, InventoryItem, InventoryNeed, ApiResponse, materialTransactionResponse } from '@/utils/supabase/schema';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import RevenueChart from '@/components/charts/RevenueChart';
import { useRole } from '@/hooks/useAuth';
import { UserRole } from '@/utils/supabase/schema';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const role = useRole();
  const router = useRouter();
  
  const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1); // Set to the 1st day of the month
    return date.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    start: getFirstDayOfMonth(), // First day of current month
    end: new Date().toISOString().split('T')[0], // Today's date by default
  });

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const { data: orders, isLoading: loadingOrders } = useQuery<OrdersByDateRangeResponse>({
    queryKey: ['orders', dateRange.start, dateRange.end],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `${getApiBaseUrl()}/order/daterange?start=${dateRange.start}&end=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) console.log('Failed to fetch orders', res);
      return res.json();
    },
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: loadingInventory } = useQuery<InventoryResponse>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${getApiBaseUrl()}/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
  });

  // Fetch inventory needs
  const { data: inventoryNeeds, isLoading: loadingNeeds } = useQuery<InventoryNeedResponse>({
    queryKey: ['inventory-needs'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${getApiBaseUrl()}/inventory/needs/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch inventory needs');
      return res.json();
    },
  });

  // Fetch material transactions for expense tracking
  const { data: materialTransactions, isLoading: loadingTransactions } = useQuery<ApiResponse<materialTransactionResponse[]>>({
    queryKey: ['materialTransactions', dateRange.start, dateRange.end],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${getApiBaseUrl()}/materialTransaction/dateRange?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch material transactions');
      return res.json();
    },
  });

  const OrdersTotal = (orderList: OrdersByDateRangeResponse) => {
    return orderList.data.length;
  };

  const RevenueByDateRange = (orderList: OrdersByDateRangeResponse) => {
    if (orders) {
      const orderData = orderList.data;

      const revenueData = orderData
        .map((order: Order) => {
          return {
            date: new Date(order.dateCreated).toISOString().split('T')[0],
            revenue: order.status === OrderStatus.COMPLETED ? order.orderTotal : 0,
          };
        })
        .reduce((acc: Record<string, number>, curr) => {
          acc[curr.date] = (acc[curr.date] || 0) + curr.revenue;
          return acc;
        }, {});

      return Object.entries(revenueData).map(([date, revenue]) => ({
        date,
        revenue,
      }));
    }
    return [];
  };

  const TotalRevenue = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    return orderData.reduce((sum, order) => sum + order.orderTotal, 0);
  };

  const AvgOrderValue = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    const total = orderData
      .map((order: Order) => {
        return order.orderTotal;
      })
      .reduce((a, b) => a + b, 0);
    return total / orderData.length;
  };

  const PendingOrders = (orderList: OrdersByDateRangeResponse) => {
    const orderData = orderList.data;
    const data = orderData.filter((order: Order) => {
      return (
        order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DELAYED ||
        (order.status === OrderStatus.RECEIVED && order.paid == true)
      );
    });
    return data.length;
  };

  const TotalExpenses = (transactions: ApiResponse<materialTransactionResponse[]>) => {
    if (!transactions?.data) return 0;
    return transactions.data.reduce((sum, txn) => sum + txn.cost, 0);
  };

  const TotalProfit = (revenue: number, expenses: number) => {
    return revenue - expenses;
  };

  // Helper function to calculate stock status (same logic as MaterialsInventory)
  const getStockStatus = (material: InventoryItem, needs: InventoryNeed[]) => {
    console.log('quantityNeeded');
    const quantityNeeded = needs.find(
      (need) => need.materialId === material.materialId
    )?.quantityNeeded || 0;
    console.log(quantityNeeded);
    if (quantityNeeded === 0) return 'in-stock'; // No need for this material today

    const ratio = material.quantityInStock / quantityNeeded;
    if (ratio >= 1) return 'in-stock';
    if (ratio >= 0.5) return 'low-stock';
    return 'out-of-stock';
  };

  // Calculate low stock materials
  const getLowStockMaterials = () => {
    console.log(inventoryData);
    console.log('Getting stock status on this material');
    if (!inventoryData?.data || !inventoryNeeds?.data) return [];

    
    return inventoryData.data.filter((material) => {
      console.log('Getting stock status on this material');
      console.log(material);
      const status = getStockStatus(material, inventoryNeeds.data);
      return status === 'low-stock' || status === 'out-of-stock';
    });
  };

  // Calculate delayed orders
  const getDelayedOrders = () => {
    if (!orders?.data) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.data.filter((order) => {
      // Order is marked as delayed
      if (order.status === OrderStatus.DELAYED) return true;
      
      // Order delivery date has passed and it's not completed
      if (order.dateDelivered) {
        const deliveryDate = new Date(order.dateDelivered);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate < today && order.status !== OrderStatus.COMPLETED;
      }
      
      return false;
    });
  };

  const lowStockMaterials = getLowStockMaterials();
  console.log(lowStockMaterials);
  const delayedOrders = getDelayedOrders();

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center m-4 gap-4">
        <div className="flex items-center gap-3">
          <FaTachometerAlt className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <DateFilter
          type="range"
          label="Filter By Date"
          onDateRangeChange={handleDateRangeChange}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
          defaultPreset="custom"
        />
      </div>



      {/* Notification Alerts Section */}
      <div className="w-full mt-6">
        {(loadingInventory || loadingNeeds || loadingOrders) && (
          <ScoreCard
            title="Alerts & Notifications"
            data={[]}
            isLoading={true}
            skeletonCount={2}
          />
        )}
        {!loadingInventory && !loadingNeeds && !loadingOrders && (
          <ScoreCard
            title="Alerts & Notifications"
            data={[
              {
                value: `${lowStockMaterials.length}`,
                label: 'Low Stock Materials',
                color: lowStockMaterials.length === 0 ? 'green' : lowStockMaterials.filter(m => getStockStatus(m, inventoryNeeds?.data || []) === 'out-of-stock').length > 0 ? 'red' : 'yellow',
                icon: <FaBoxes />,
              },
              {
                value: `${delayedOrders.length}`,
                label: 'Delayed Orders',
                color: delayedOrders.length === 0 ? 'green' : 'red',
                icon: <FaClock />,
              },
            ]}
          />
        )}
      </div>

      {/* Low Stock Materials Section */}
      {lowStockMaterials.length > 0 && (
        <div className="mt-6 mx-4">
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationTriangle className="text-yellow-600 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">
              Low Stock Materials ({lowStockMaterials.length})
            </h2>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Needed Today
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockMaterials.map((material) => {
                    const need = inventoryNeeds?.data.find(n => n.materialId === material.materialId);
                    const status = getStockStatus(material, inventoryNeeds?.data || []);
                    const statusColor = status === 'out-of-stock' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    const statusText = status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock';
                    
                    return (
                      <tr 
                        key={material.materialId} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push('/admin/inventory')}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {material.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.quantityInStock} {material.units}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {need?.quantityNeeded || 0} {material.units}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin/inventory')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Inventory →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delayed Orders Section */}
      {delayedOrders.length > 0 && (
        <div className="mt-6 mx-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">
              Delayed Orders ({delayedOrders.length})
            </h2>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {delayedOrders.map((order) => {
                    const today = new Date();
                    const deliveryDate = new Date(order.dateDelivered);
                    const daysOverdue = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr 
                        key={order.orderId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push('/admin/orders')}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.orderTotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border bg-red-100 text-red-800 border-red-200">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.dateDelivered).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {daysOverdue > 0 ? `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : 'Today'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin/orders')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Orders →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {(loadingOrders || loadingTransactions) && (
          <ScoreCard
            title="Key Primary Indicators"
            data={[]}
            isLoading={true}
            skeletonCount={6}
          />
        )}
        {orders && materialTransactions && (
          <ScoreCard
            title="Key Primary Indicators"
            data={[
              {
                value: `$${TotalRevenue(orders).toFixed(2)}`,
                label: 'Total Revenue',
                color: 'green',
                icon: <FaDollarSign />,
              },
              {
                value: `$${TotalExpenses(materialTransactions).toFixed(2)}`,
                label: 'Total Expenses',
                color: 'red',
                icon: <FaMoneyBillWave />,
              },
              {
                value: `$${TotalProfit(TotalRevenue(orders), TotalExpenses(materialTransactions)).toFixed(2)}`,
                label: 'Net Profit',
                color: TotalProfit(TotalRevenue(orders), TotalExpenses(materialTransactions)) >= 0 ? 'green' : 'red',
                icon: <FaChartLine />,
              },
              {
                value: `${OrdersTotal(orders)}`,
                label: 'Orders',
                color: 'yellow',
                icon: <FaReceipt />,
              },
              {
                value: `$${AvgOrderValue(orders).toFixed(2) || '0.00'}`,
                label: 'Avg Order Value',
                color: 'blue',
                icon: <FaDollarSign />,
              },
              {
                value: `${PendingOrders(orders)}`,
                label: 'Pending Orders',
                color: 'purple',
                icon: <FaClock />,
              },
            ]}
            isLoading={loadingOrders || loadingTransactions}
            skeletonCount={6}
          />
        )}
      </div>

      <div className="w-full">{orders && <RevenueChart data={RevenueByDateRange(orders)} />}</div>

      {/* Production Goals Management - Admin Only */}
      {role === UserRole.ADMIN && (
        <div className="my-6">
          <ProductionGoalsManager />
        </div>
      )}

    </>
  );
}
