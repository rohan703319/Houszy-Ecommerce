"use client";

import { Briefcase, Rocket } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">

      {/* HERO */}
      <div className="bg-[#445D41] text-white py-2 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Careers at Direct Care
        </h1>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-start justify-center px-4 pt-20">
        <div className="bg-white border rounded-xl shadow-sm p-8 max-w-xl w-full text-center">

          <Briefcase className="mx-auto text-[#445D41] mb-4" size={40} />

          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            Careers Page Coming Soon
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed">
            We are currently working on building our careers section.
            Opportunities to join Direct Care will be available soon.
          </p>


        </div>
      </div>

   

    </div>
  );
}