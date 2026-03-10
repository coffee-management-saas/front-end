import SystemLoginForm from "@/app/(auth)/system/login/system-form";
import React from "react";

function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0a07]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "url('https://i.pinimg.com/736x/89/70/38/897038e99999173b86b8b346c694efb5.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(1.05) contrast(1.08) brightness(0.68)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_12%,rgba(245,158,11,0.26),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_50%_at_18%_28%,rgba(124,45,18,0.22),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(35%_40%_at_82%_62%,rgba(217,119,6,0.18),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/55" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <SystemLoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
