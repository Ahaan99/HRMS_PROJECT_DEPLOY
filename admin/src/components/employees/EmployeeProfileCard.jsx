import React from "react";

const EmployeeProfileCard = ({ employee }) => {
  const name = employee?.name || "-";
  const code = employee?.employeeCode || "-";
  const email = employee?.email || "-";
  const dob = employee?.dob
    ? new Date(employee.dob).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const avatarLetter = name?.charAt(0)?.toUpperCase();

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl border border-white/30">
      {/* gradient background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 opacity-90" />

      {/* glass layer */}
      <div className="relative px-8 pt-10 pb-12 flex flex-col items-center text-center text-white">
        {/* avatar */}
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 flex items-center justify-center text-3xl font-bold shadow-xl overflow-hidden">
          {employee?.profile_image ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}/uploads/joining/${employee.profile_image}`}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            avatarLetter
          )}
        </div>

        {/* name */}
        <h2 className="mt-4 text-2xl font-semibold tracking-wide">{name}</h2>

        {/* emp code */}
        <p className="text-sm opacity-90 mt-1">{code}</p>

        {/* DOB */}
        <p className="text-sm opacity-90 mt-1">{dob}</p>

        {/* email */}
        <p className="text-sm opacity-80 mt-1 break-all">{email}</p>
      </div>
    </div>
  );
};

export default EmployeeProfileCard;
