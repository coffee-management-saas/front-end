import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import {
  createIngredient,
  getIngredients,
} from "@/services/ingredient.service";
import type {
  IngredientBaseUnit,
  IngredientInventoryStatus,
  IngredientStorageType,
} from "@/types/ingredient";

function parseBaseUnit(v: unknown): IngredientBaseUnit | undefined {
  const allowed: IngredientBaseUnit[] = [
    "GRAM",
    "KILOGRAM",
    "LITER",
    "MILLILITER",
    "PIECE",
    "PAIR",
  ];
  if (allowed.includes(v as IngredientBaseUnit)) return v as IngredientBaseUnit;
  if (typeof v === "string") {
    const up = v.toUpperCase() as IngredientBaseUnit;
    return allowed.includes(up) ? up : undefined;
  }
  return undefined;
}

function parseStorageType(v: unknown): IngredientStorageType | undefined {
  const allowed: IngredientStorageType[] = [
    "NORMAL",
    "COOL",
    "FROZEN",
    "DRY",
    "REFRIGERATED",
  ];
  if (allowed.includes(v as IngredientStorageType))
    return v as IngredientStorageType;
  if (typeof v === "string") {
    const up = v.toUpperCase() as IngredientStorageType;
    return allowed.includes(up) ? up : undefined;
  }
  return undefined;
}

function parseInventoryStatus(
  v: unknown,
): IngredientInventoryStatus | undefined {
  const allowed: IngredientInventoryStatus[] = [
    "ACTIVE",
    "INACTIVE",
    "DELETED",
  ];
  if (allowed.includes(v as IngredientInventoryStatus))
    return v as IngredientInventoryStatus;
  if (typeof v === "string") {
    const up = v.toUpperCase() as IngredientInventoryStatus;
    return allowed.includes(up) ? up : undefined;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getIngredients({ page, size }, accessToken);
    return Response.json(data, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload = {
      name: String((body as { name?: unknown }).name ?? "").trim(),
      skuCode: String((body as { skuCode?: unknown }).skuCode ?? "").trim(),
      baseUnit:
        parseBaseUnit((body as { baseUnit?: unknown }).baseUnit) ?? "GRAM",
      minStockAlert: Number(
        (body as { minStockAlert?: unknown }).minStockAlert ?? 0,
      ),
      storageType:
        parseStorageType((body as { storageType?: unknown }).storageType) ??
        "NORMAL",
      inventoryStatus:
        parseInventoryStatus(
          (body as { inventoryStatus?: unknown }).inventoryStatus,
        ) ?? "ACTIVE",
    };

    if (!payload.name) {
      return Response.json({ message: "Missing name" }, { status: 400 });
    }

    if (!payload.skuCode) {
      return Response.json({ message: "Missing skuCode" }, { status: 400 });
    }

    if (!Number.isFinite(payload.minStockAlert) || payload.minStockAlert < 0) {
      return Response.json(
        { message: "Invalid minStockAlert" },
        { status: 400 },
      );
    }

    const data = await createIngredient(payload, accessToken);
    return Response.json(data, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
