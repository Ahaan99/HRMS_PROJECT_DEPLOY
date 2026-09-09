import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";

export default function KPICards({ data, activeView, setActiveView }) {

  const cards = [
    {
      key: "revenue",
      title: "Total Revenue",
      value: data.revenue,
      icon: <IndianRupee size={20} />,
      color: "bg-green-500",
    },
    {
      key: "expenses",
      title: "Total Expenses",
      value: data.expenses,
      icon: <TrendingDown size={20} />,
      color: "bg-red-500",
    },
    {
      key: "profit",
      title: "Net Profit",
      value: data.profit,
      icon: <TrendingUp size={20} />,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-6">
      {cards.map((card) => (

        <div
          key={card.key}
          onClick={() => setActiveView(card.key)}
          className={`cursor-pointer bg-white shadow rounded-xl p-5 flex items-center justify-between border 
          ${activeView === card.key ? "border-black" : "border-transparent"}`}
        >

          <div>
            <p className="text-sm text-gray-500">{card.title}</p>
            <h3 className="text-xl font-bold">
              ₹{Number(card.value).toLocaleString()}
            </h3>
          </div>

          <div className={`${card.color} text-white p-3 rounded-lg`}>
            {card.icon}
          </div>

        </div>

      ))}
    </div>
  );
}