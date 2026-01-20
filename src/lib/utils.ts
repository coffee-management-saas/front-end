import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export class ApiError<T = unknown> extends Error {
  status: number;
  payload?: T;

  constructor(message: string, status: number, payload?: T) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}
