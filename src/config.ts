// chạy ở môi trường server không chạy ở môi trường client
import z from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
});
const configProject = configSchema.safeParse({
  // phải ghi như vậy thì ở server và client mới dùng được còn nếu chỉ ghi env.process thì client ko chạy được
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
});
if (!configProject.success) {
  console.error("Invalid environment variables:", configProject.error.issues);
  throw new Error("Các giá trị khai báo trong file .env không hợp lệ");
}
const envConfig = configProject.data;
export default envConfig;
