import React from "react";
import {
  Youtube,
  Instagram,
  Facebook,
  Send,
  Music,
  HardDrive,
  Globe,
  Disc,
  Link as LinkIcon
} from "lucide-react";

export interface PlatformConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  glowClass: string;
}

export function detectPlatform(url: string): PlatformConfig {
  const cleanUrl = url.trim().toLowerCase();

  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: Youtube,
      colorClass: "text-[#FF0000]",
      glowClass: "hover:border-[#FF0000]/40 group-hover:shadow-[#FF0000]/20"
    };
  }

  if (cleanUrl.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: Instagram,
      colorClass: "text-[#E1306C]",
      glowClass: "hover:border-[#E1306C]/40 group-hover:shadow-[#E1306C]/20"
    };
  }

  if (cleanUrl.includes("facebook.com") || cleanUrl.includes("fb.com")) {
    return {
      name: "Facebook",
      icon: Facebook,
      colorClass: "text-[#1877F2]",
      glowClass: "hover:border-[#1877F2]/40 group-hover:shadow-[#1877F2]/20"
    };
  }

  if (cleanUrl.includes("t.me") || cleanUrl.includes("telegram")) {
    return {
      name: "Telegram",
      icon: Send, // Lucide standard paper plane
      colorClass: "text-[#229ED9]",
      glowClass: "hover:border-[#229ED9]/40 group-hover:shadow-[#229ED9]/20"
    };
  }

  if (cleanUrl.includes("tiktok.com")) {
    return {
      name: "TikTok",
      icon: Music, // Lucide Music Note
      colorClass: "text-[#EE1D52]",
      glowClass: "hover:border-[#EE1D52]/40 group-hover:shadow-[#EE1D52]/20"
    };
  }

  if (cleanUrl.includes("discord.gg") || cleanUrl.includes("discord.com")) {
    return {
      name: "Discord",
      icon: Disc,
      colorClass: "text-[#5865F2]",
      glowClass: "hover:border-[#5865F2]/40 group-hover:shadow-[#5865F2]/20"
    };
  }

  if (cleanUrl.includes("drive.google.com") || cleanUrl.includes("google.com/drive")) {
    return {
      name: "Google Drive",
      icon: HardDrive,
      colorClass: "text-[#34A853]",
      glowClass: "hover:border-[#34A853]/40 group-hover:shadow-[#34A853]/20"
    };
  }

  // Default web platform
  return {
    name: "Web Link",
    icon: Globe,
    colorClass: "text-[#8B5CF6]",
    glowClass: "hover:border-[#8B5CF6]/40 group-hover:shadow-[#8B5CF6]/20"
  };
}
