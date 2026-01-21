"use client";
import React, { createContext, useContext, useState } from "react";

type Tokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

type AppContextType = {
  tokens: Tokens;
  setTokens: React.Dispatch<React.SetStateAction<Tokens>>;

  // (tuỳ chọn) giữ lại API cũ cho tiện dùng
  accessToken: string;
  setAccessToken: (token: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

export default function AppProvider({
  children,
  initialTokens,
}: {
  children: React.ReactNode;
  initialTokens?: Tokens;
}) {
  const [tokens, setTokens] = useState<Tokens>(
    initialTokens ?? { accessToken: "", refreshToken: "", expiresAt: "" },
  );

  // giữ tương thích code cũ (setAccessToken)
  const setAccessToken = (token: string) => {
    setTokens((prev) => ({ ...prev, accessToken: token }));
  };

  return (
    <AppContext.Provider
      value={{
        tokens,
        setTokens,
        accessToken: tokens.accessToken,
        setAccessToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
