import SystemLoginForm from "@/app/(auth)/system/login/system-form";
import React from "react";

function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/88/86/4a/88864a6f409f8e837421c182a75e6197.jpg')",
          filter: "contrast(1.12) saturate(1.15) brightness(1.02) sharpen(1)",
        }}
      >
        {/* Overlay nếu cần tối nhẹ cho form dễ nhìn */}
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <SystemLoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
