import ScoreCard from '@/components/scorecard/ScoreCard'
import { FaDollarSign, FaReceipt, FaUser } from "react-icons/fa"
import { DateFilter } from '@/components/filters';



export default function DashboardPage() {


  const TotalRevenue = () => {
    
  }
  
  const Orders = ()=> {

  }

  const AvgOrderValue = () => {
  
  }

  const PendingOrders = () => {

  }

  return (
    <>
      <div className="flex flex-row m-4 justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <DateFilter 
          type="range"
        />


      </div>   
      <div className="w-full">
        <ScoreCard
            title="Key Primary Indicators"
            data={[
              { value: '$1,234', label: 'Total Revenue', color: 'green', icon: <FaDollarSign /> },
              { value: '456', label: 'Orders', color: 'yellow', icon: <FaReceipt /> },
              { value: '$1,234', label: 'Avg Order Value', color: 'green', icon: <FaReceipt /> },
              { value: '456', label: 'Pending Orders', color: 'green', icon: <FaReceipt /> }
            ]}
        />
      </div>
    </>
  )
}