import RegisterForm from "@/app/(auth)/register/register-form";
import React from "react";

function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/1200x/1b/88/4f/1b884feae073713f3b52b6649f53eeeb.jpg')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;
