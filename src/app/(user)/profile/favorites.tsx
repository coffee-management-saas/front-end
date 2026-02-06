"use client";

import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

interface FavoriteProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    rating?: number;
    description?: string;
}

// Mock data - replace with actual API call
const mockFavorites: FavoriteProduct[] = [
    {
        id: 1,
        name: "Cà phê đen đá",
        price: 35000,
        image: "/placeholder-coffee.jpg",
        category: "Cà phê",
        rating: 4.5,
        description: "Cà phê đen truyền thống, đậm đà"
    },
    {
        id: 2,
        name: "Bạc xỉu",
        price: 40000,
        image: "/placeholder-coffee.jpg",
        category: "Cà phê",
        rating: 4.8,
        description: "Cà phê sữa ngọt ngào"
    },
    {
        id: 3,
        name: "Trà sữa trân châu",
        price: 45000,
        image: "/placeholder-coffee.jpg",
        category: "Trà sữa",
        rating: 4.7,
        description: "Trà sữa thơm ngon với trân châu dai"
    }
];

export default function Favorites() {
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const fetchFavorites = async () => {
            try {
                // Replace with actual API call
                // const data = await getFavoriteProducts(accessToken);
                await new Promise(resolve => setTimeout(resolve, 500));
                setFavorites(mockFavorites);
            } catch (error) {
                console.error("Failed to fetch favorites:", error);
                toast.error("Không thể tải sản phẩm yêu thích");
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const handleRemoveFavorite = (productId: number) => {
        setFavorites(prev => prev.filter(item => item.id !== productId));
        toast.success("Đã xóa khỏi danh sách yêu thích");
    };

    const handleAddToCart = (product: FavoriteProduct) => {
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Heart className="w-20 h-20 mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sản phẩm yêu thích</h3>
                <p className="text-sm text-gray-500 mb-6">Hãy thêm những sản phẩm bạn yêu thích vào đây</p>
                <Button
                    onClick={() => window.location.href = '/menu'}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    Khám phá sản phẩm
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Sản phẩm yêu thích</h3>
                    <p className="text-sm text-gray-500 mt-1">Bạn có {favorites.length} sản phẩm yêu thích</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((product) => (
                    <div
                        key={product.id}
                        className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                        {/* Remove button */}
                        <button
                            onClick={() => handleRemoveFavorite(product.id)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors group/remove"
                            aria-label="Xóa khỏi yêu thích"
                        >
                            <Heart className="w-4 h-4 text-red-500 fill-red-500 group-hover/remove:scale-110 transition-transform" />
                        </button>

                        {/* Product Image */}
                        <div className="relative h-48 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 bg-amber-200/30 rounded-full"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShoppingCart className="w-16 h-16 text-amber-300" />
                            </div>
                            {/* Replace with actual image when available */}
                            {/* <Image src={product.image} alt={product.name} fill className="object-cover" /> */}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                            <div>
                                <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full mb-2">
                                    {product.category}
                                </span>
                                <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{product.name}</h4>
                                {product.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                                )}
                            </div>

                            {/* Rating */}
                            {product.rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                                    <span className="text-xs text-gray-400">(128 đánh giá)</span>
                                </div>
                            )}

                            {/* Price and Action */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500">Giá</p>
                                    <p className="text-lg font-bold text-amber-700">{formatCurrency(product.price)}</p>
                                </div>
                                <Button
                                    onClick={() => handleAddToCart(product)}
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Thêm
                                </Button>
                            </div>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                    variant="outline"
                    onClick={() => {
                        favorites.forEach(product => handleAddToCart(product));
                    }}
                    className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Thêm tất cả vào giỏ
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        setFavorites([]);
                        toast.success("Đã xóa tất cả sản phẩm yêu thích");
                    }}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa tất cả
                </Button>
            </div>
        </div>
    );
}
