import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

export default function ServiceInventory() {
  const [services, setServices] = useState([]);

  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      const res = await API.get("/sales/services");
      setServices(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((s) => (
        <div
          key={s.id}
          className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition duration-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                {s.service_name}
              </h2>

              <p className="text-xs text-gray-400 mb-1">
                Plan {s.plan_name}
              </p>

              <p className="text-blue-600 font-medium mt-2">
                {s.pricing_type === "CTC_PERCENT" &&
                  `${s.pricing_value}% of CTC`}

                {s.pricing_type === "DAYS_SALARY" &&
                  `${s.pricing_value} days salary`}

                {s.pricing_type === "FIXED" && `₹${s.pricing_value}`}
              </p>

              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <p>🔁 Replacement: {s.replacement_months} months</p>
                <p>💰 Token: ₹{s.token_amount}</p>
                <p>📅 Payment: {s.payment_terms}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/services/${s.id}`)}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
            >
              View →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}