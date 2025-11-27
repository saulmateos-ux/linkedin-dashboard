"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";

interface DynamicMainProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DynamicMain - A wrapper component that adjusts left margin based on sidebar state
 *
 * This component solves the layout issue where the sidebar width (290px expanded, 90px collapsed)
 * needs to be matched by the main content's left margin.
 */
const DynamicMain: React.FC<DynamicMainProps> = ({ children, className = "" }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Sidebar is 290px when expanded OR hovered, 90px when collapsed
  const sidebarExpanded = isExpanded || isHovered;

  return (
    <main
      className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-[margin] duration-300 ease-in-out ${
        sidebarExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]"
      } ${className}`}
    >
      {children}
    </main>
  );
};

export default DynamicMain;
