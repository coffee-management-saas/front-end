import SystemRegisterForm from "@/app/(auth)/system/register/system-form";
import React from "react";

function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/30/27/ef/3027efad065c22a31944b6d2969962de.jpg')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <SystemRegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;
