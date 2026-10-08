import {
  DM_Mono,
  Geist,
  Geist_Mono,
  Playfair_Display,
  Poppins,
} from "next/font/google";
import "./global.css";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmDialogProvider } from "@/hooks/use-confirm-dialog";
import { NotificationProvider } from "./context/NotificationContext";

const fonts = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Langit - Langit",
  description: "Dashboard oprasional langit langit.",
  icons: {
    icon: "/icon-logo.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fonts.className}  antialiased overflow-x-hidden bg-sidebar`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <ConfirmDialogProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </ConfirmDialogProvider>
          </ReactQueryProvider>
          <Toaster position="top-center" />
        </ThemeProvider>

        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)] -webkit-[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>

        {/* 2. LAYER AMBIENT GLOW (Cahaya Redup Orange & Blue) */}
        <div className="absolute -top-[15%] -left-[10%] w-full h-[500px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.06)_0%,transparent_0%)] z-0 pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] hidden w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] z-0 pointer-events-none"></div>
      </body>
    </html>
  );
}
