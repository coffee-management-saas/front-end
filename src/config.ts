import z from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
});

const resolvedEndpoint =
  typeof window === "undefined"
    ? // Server-side: dùng BACKEND_INTERNAL_URL (runtime, không bake vào image)
    `${process.env.BACKEND_INTERNAL_URL || "http://localhost:8080"}/api`
    : // Client-side: chuỗi rỗng → services dùng relative path qua Route Handlers
    "";

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: resolvedEndpoint,
});

if (!configProject.success) {
  console.error("Invalid environment variables:", configProject.error.issues);
  throw new Error("Các giá trị khai báo trong file .env không hợp lệ");
}
const envConfig = configProject.data;
export default envConfig;
