"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext({
  sessionToken: "",
  setSessionToken: (sessionToken: string) => {},
});
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
export default function AppProvider({
  children,
  initialAccessToken = "",
}: {
  children: React.ReactNode;
  initialAccessToken?: string;
}) {
  const [sessionToken, setSessionToken] = useState(initialAccessToken);
  return (
    <AppContext.Provider value={{ sessionToken, setSessionToken }}>
      {children}
    </AppContext.Provider>
  );
}
