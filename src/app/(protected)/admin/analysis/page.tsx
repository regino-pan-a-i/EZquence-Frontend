import ScoreCard from "@/components/scorecard/ScoreCard"
import { FaDollarSign, FaReceipt, FaUser } from "react-icons/fa"

export default function AnalysisPage() {

    return (
        // Simple usage
        <>
            <div className="w-full">
                <ScoreCard
                    title="Business Overview"
                    data={[
                        { value: '1,234', label: 'Customers', icon: <FaUser /> },
                        { value: '456', label: 'Orders', color: 'yellow', icon: <FaReceipt /> },
                        { value: '$89', label: 'Revenue', color: 'red', icon: <FaDollarSign /> }
                    ]}
                />
            </div>
            


        </>
    )
}