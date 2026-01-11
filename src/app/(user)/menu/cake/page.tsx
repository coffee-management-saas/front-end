"use client";
import React from "react";

function page() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border p-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">Danh mục</h2>

        <ul className="space-y-3">
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 1</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 2</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 3</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 1</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 2</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 3</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 1</li>
          <li className="bg-gray-100 p-3 rounded-lg">Nội dung 2</li>
        </ul>
      </aside>
    </div>
  );
}

export default page;
