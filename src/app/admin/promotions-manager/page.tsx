"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { Promotion } from "@/types/promotion";

type FormState = Partial<Promotion>;
type ModalMode = "create" | "edit" | "view" | "delete" | null;

const emptyForm: FormState = {
  promotionCode: "",
  promotionName: "",
  promotionType: "ORDER",
  discountType: "PERCENTAGE",
  discountValue: 0,
  minimumSpent: 0,
  quantity: 0,
  maxDiscountAmount: 0,
  usageLimitPerUser: 0,
  startDate: "",
  endDate: "",
  promotionStatus: "ACTIVE",
  status: "ACTIVE",
  imageUrl: "",
  shopId: 1,
};

const FALLBACK_IMAGE =
  "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg";

const canUseImage = (url?: string | null) =>
  !!url && (/^https?:\/\//.test(url) || url.startsWith("data:image"));

export default function PromotionsManagerPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const modalWidthClass =
    modalMode === "delete"
      ? "max-w-sm"
      : modalMode === "create" || modalMode === "edit"
        ? "max-w-lg"
        : "max-w-md";

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promotion", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load promotions failed");
      const normalized: Promotion[] = Array.isArray(data)
        ? data.map((p: Promotion) => ({
            ...p,
            promotionStatus: p.promotionStatus ?? p.status ?? "ACTIVE",
            status: p.status ?? p.promotionStatus ?? "ACTIVE",
          }))
        : [];

      setPromotions(normalized);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không tải được danh sách";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (field: keyof FormState, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSelected(null);
    setModalMode("create");
  };

  const handleView = (item: Promotion) => {
    setSelected(item);
    setModalMode("view");
  };

  const handleEdit = (item: Promotion) => {
    setEditingId(item.promotionId);
    setSelected(item);
    setForm({
      promotionCode: item.promotionCode,
      promotionName: item.promotionName,
      promotionType: item.promotionType,
      discountType: item.discountType,
      discountValue: item.discountValue,
      minimumSpent: item.minimumSpent,
      quantity: item.quantity,
      maxDiscountAmount: item.maxDiscountAmount,
      usageLimitPerUser: item.usageLimitPerUser,
      startDate: item.startDate?.slice(0, 10),
      endDate: item.endDate?.slice(0, 10),
      promotionStatus: item.promotionStatus,
      status: item.status ?? item.promotionStatus,
      imageUrl: item.imageUrl ?? "",
      shopId: item.shopId,
    });
    setModalMode("edit");
  };

  const handleDelete = (item: Promotion) => {
    setSelected(item);
    setModalMode("delete");
  };

  const handleConfirmDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/promotion/${selected.promotionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Xóa thất bại");
      }
      setPromotions((prev) =>
        prev.filter((p) => p.promotionId !== selected.promotionId),
      );
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayloadForApi(form, selected, editingId);

      const res = await fetch(
        editingId ? `/api/promotion/${editingId}` : "/api/promotion",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lưu thất bại");

      if (editingId) {
        setPromotions((prev) =>
          prev.map((p) => (p.promotionId === editingId ? data : p)),
        );
      } else {
        setPromotions((prev) => [data, ...prev]);
      }
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lưu thất bại";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setEditingId(null);
    setForm(emptyForm);
  };

  const buildPayloadForApi = (
    data: FormState,
    currentSelected: Promotion | null,
    currentEditingId: number | null,
  ) => {
    const toIso = (v?: string) =>
      v && v.trim() ? new Date(v).toISOString() : undefined;

    const status =
      data.status ||
      data.promotionStatus ||
      currentSelected?.status ||
      "ACTIVE";

    const shopId = data.shopId ?? currentSelected?.shopId ?? 1;

    return {
      promotionName: data.promotionName ?? "",
      promotionCode: data.promotionCode ?? "",
      promotionType: data.promotionType ?? "ORDER",
      minimumSpent: Number(data.minimumSpent ?? 0),
      quantity: Number(data.quantity ?? 0),
      imageUrl: data.imageUrl ?? "",
      discountType: data.discountType ?? "PERCENTAGE",
      discountValue: Number(data.discountValue ?? 0),
      maxDiscountAmount: Number(data.maxDiscountAmount ?? 0),
      usageLimitPerUser: Number(data.usageLimitPerUser ?? 0),
      status,
      startDate: toIso(data.startDate),
      endDate: toIso(data.endDate),
      shopId,
      // giữ nguyên các field BE không yêu cầu sẽ bị bỏ qua
      promotionId: currentEditingId ?? undefined,
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quản lý khuyến mãi
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#876F60] rounded-lg shadow hover:bg-[#876F60] transition"
        >
          <Plus className="w-4 h-4" />
          Thêm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách khuyến mãi
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-gradient-to-r from-[#c3b3a9] to-[#c3b3a9]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Mã
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Hình
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Tên
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Loại
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Giá trị
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {promotions.map((item) => (
                <tr key={item.promotionId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.promotionCode}
                  </td>
                  <td className="px-4 py-3">
                    <PromoImageCell
                      url={item.imageUrl}
                      alt={item.promotionName}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">
                    {item.promotionName}
                  </td>
                  <td className="px-4 py-3 text-[#693916] font-medium">
                    {item.promotionType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${
                        item.promotionStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {item.promotionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#693916] font-medium">
                    {item.discountType === "PERCENTAGE"
                      ? `${item.discountValue}%`
                      : `${item.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.startDate?.slice(0, 10)} →{" "}
                    {item.endDate?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleView(item)}
                        className="p-2 rounded-md border border-[#876F60] bg-white text-[#693916] hover:bg-amber-50 hover:shadow transition"
                        aria-label="Xem"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-md border border-[#876F60] bg-white text-[#693916] hover:bg-amber-50 hover:shadow transition"
                        aria-label="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4 text-[#693916]" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:shadow transition"
                        aria-label="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!promotions.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    {loading ? "Đang tải..." : "Chưa có khuyến mãi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className={`w-full ${modalWidthClass} max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "view"
                  ? "Xem khuyến mãi"
                  : modalMode === "edit"
                    ? "Chỉnh sửa khuyến mãi"
                    : modalMode === "delete"
                      ? "Xóa khuyến mãi"
                      : "Thêm khuyến mãi"}
              </h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={closeModal}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {modalMode === "view" && selected && (
                <>
                  <div className="px-5 pt-4">
                    <PromotionHeroImage
                      url={selected.imageUrl}
                      alt={selected.promotionName}
                    />
                  </div>
                  <div className="px-5 pb-4 grid sm:grid-cols-2 gap-4 text-sm text-gray-800">
                    <Detail label="Mã" value={selected.promotionCode} />
                    <Detail label="Tên" value={selected.promotionName} />
                    <Detail label="Loại" value={selected.promotionType} />
                    <Detail
                      label="Trạng thái"
                      value={selected.promotionStatus}
                    />
                    <Detail
                      label="Giá trị"
                      value={
                        selected.discountType === "PERCENTAGE"
                          ? `${selected.discountValue}%`
                          : `${selected.discountValue.toLocaleString()}đ`
                      }
                    />
                    <Detail
                      label="Giảm tối đa"
                      value={`${selected.maxDiscountAmount.toLocaleString()}đ`}
                    />
                    <Detail
                      label="Tối thiểu đơn"
                      value={`${selected.minimumSpent.toLocaleString()}đ`}
                    />
                    <Detail label="Số lượng" value={selected.quantity} />
                    <Detail
                      label="Giới hạn / user"
                      value={selected.usageLimitPerUser}
                    />
                    <Detail
                      label="Thời gian"
                      value={`${selected.startDate?.slice(0, 10)} → ${selected.endDate?.slice(0, 10)}`}
                    />
                  </div>
                </>
              )}

              {(modalMode === "create" || modalMode === "edit") && (
                <form
                  onSubmit={handleSubmit}
                  className="px-5 py-4 grid md:grid-cols-2 gap-4"
                >
                  <Input
                    label="Mã KM"
                    required
                    value={form.promotionCode}
                    onChange={(e) => onChange("promotionCode", e.target.value)}
                  />
                  <Input
                    label="Tên KM"
                    required
                    value={form.promotionName}
                    onChange={(e) => onChange("promotionName", e.target.value)}
                  />
                  <Select
                    label="Loại KM"
                    value={form.promotionType}
                    onChange={(e) => onChange("promotionType", e.target.value)}
                    options={[
                      { value: "ORDER", label: "Theo đơn hàng" },
                      { value: "PRODUCT", label: "Theo sản phẩm" },
                    ]}
                  />
                  <Select
                    label="Trạng thái"
                    value={form.promotionStatus}
                    onChange={(e) =>
                      onChange("promotionStatus", e.target.value)
                    }
                    options={[
                      { value: "ACTIVE", label: "ACTIVE" },
                      { value: "INACTIVE", label: "INACTIVE" },
                    ]}
                  />
                  <Select
                    label="Kiểu giảm"
                    value={form.discountType}
                    onChange={(e) => onChange("discountType", e.target.value)}
                    options={[
                      { value: "PERCENTAGE", label: "% Phần trăm" },
                      { value: "FIXED_AMOUNT", label: "Số tiền cố định" },
                    ]}
                  />
                  <NumberInput
                    label="Giá trị giảm"
                    value={form.discountValue}
                    step={0.01}
                    onChange={(v) => onChange("discountValue", v)}
                  />
                  <Input
                    label="Ảnh (imageUrl)"
                    value={form.imageUrl}
                    onChange={(e) => onChange("imageUrl", e.target.value)}
                    placeholder="https://..."
                  />
                  <NumberInput
                    label="Giảm tối đa"
                    value={form.maxDiscountAmount}
                    step={0.01}
                    onChange={(v) => onChange("maxDiscountAmount", v)}
                  />
                  <NumberInput
                    label="Tối thiểu đơn"
                    value={form.minimumSpent}
                    onChange={(v) => onChange("minimumSpent", v)}
                  />
                  <NumberInput
                    label="Số lượng"
                    value={form.quantity}
                    onChange={(v) => onChange("quantity", v)}
                  />
                  <NumberInput
                    label="Giới hạn / user"
                    value={form.usageLimitPerUser}
                    onChange={(v) => onChange("usageLimitPerUser", v)}
                  />
                  <NumberInput
                    label="Shop ID"
                    value={form.shopId}
                    onChange={(v) => onChange("shopId", v)}
                  />
                  <Input
                    label="Ngày bắt đầu"
                    type="date"
                    value={form.startDate}
                    required
                    onChange={(e) => onChange("startDate", e.target.value)}
                  />
                  <Input
                    label="Ngày kết thúc"
                    type="date"
                    value={form.endDate}
                    required
                    onChange={(e) => onChange("endDate", e.target.value)}
                  />

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                      disabled={saving}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#876F60] hover:bg-[#876F60] transition disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving
                        ? "Đang lưu..."
                        : editingId
                          ? "Cập nhật"
                          : "Thêm mới"}
                    </button>
                  </div>
                </form>
              )}

              {modalMode === "delete" && selected && (
                <div className="px-5 py-5 space-y-4">
                  <p className="text-sm text-gray-800">
                    Bạn chắc chắn muốn xóa khuyến mãi{" "}
                    <strong>{selected.promotionName}</strong>?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Hủy
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
                      onClick={handleConfirmDelete}
                      disabled={saving}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoImageCell({ url, alt }: { url?: string | null; alt: string }) {
  const src = canUseImage(url) ? (url as string) : FALLBACK_IMAGE;

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
      <Image src={src} alt={alt} fill className="object-cover" sizes="48px" />
    </div>
  );
}

function PromotionHeroImage({
  url,
  alt,
}: {
  url?: string | null;
  alt: string;
}) {
  const src = canUseImage(url) ? (url as string) : FALLBACK_IMAGE;

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 560px"
      />
    </div>
  );
}

function Input({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input
        {...rest}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#876F60] focus:ring-[#876F60]"
      />
    </div>
  );
}

function Select({
  label,
  options,
  ...rest
}: {
  label: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <select
        {...rest}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#876F60] focus:ring-[#876F60]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input
        type="number"
        min={0}
        step={step ?? 1}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#876F60] focus:ring-[#876F60]"
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}
