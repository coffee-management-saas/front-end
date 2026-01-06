import RegisterForm from "@/app/(auth)/register/register-form";
import React from "react";

function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/d9/f8/a3/d9f8a3c4696c5d90e8d46d5e7215b246.jpg')",
        }}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/20 via-transparent to-amber-500/20" />

      {/* Floating coffee icons */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-20 left-[10%] text-4xl opacity-20 animate-float">
          ☕
        </span>
        <span
          className="absolute top-[30%] right-[15%] text-3xl opacity-15 animate-float"
          style={{ animationDelay: "1s" }}
        >
          ☕
        </span>
        <span
          className="absolute bottom-[25%] left-[20%] text-5xl opacity-10 animate-float"
          style={{ animationDelay: "2s" }}
        >
          ☕
        </span>
        <span
          className="absolute bottom-[15%] right-[25%] text-3xl opacity-20 animate-float"
          style={{ animationDelay: "0.5s" }}
        >
          ☕
        </span>
      </div>

      {/* Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;
