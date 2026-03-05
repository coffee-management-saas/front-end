import ForgotForm from "@/app/(auth)/forgot/forgot-form";

import React from "react";

function ForgotPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#24130A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(255,214,170,0.20),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(255,214,170,0.14),transparent_58%),radial-gradient(circle_at_70%_82%,rgba(255,214,170,0.18),transparent_60%),linear-gradient(135deg,#1d0f08_0%,#3b1f0f_40%,#1d0f08_100%)]" />
      <div className="absolute inset-0 opacity-40 blur-[1px] [background-image:radial-gradient(circle_at_18%_30%,transparent_0_58%,rgba(255,255,255,0.10)_60%,transparent_62%),radial-gradient(circle_at_82%_36%,transparent_0_58%,rgba(255,255,255,0.10)_60%,transparent_62%),radial-gradient(circle_at_70%_85%,transparent_0_58%,rgba(255,255,255,0.08)_60%,transparent_62%)]" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-14">
        <ForgotForm />
      </div>
    </div>
  );
}

export default ForgotPage;
