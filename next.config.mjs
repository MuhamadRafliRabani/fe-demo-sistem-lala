/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pin.it",
        port: "",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "id.pinterest.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "nova-null-latosha.ngrok-free.dev",
        port: "",
      },
      {
        protocol: "https",
        hostname: "nado.langitlangit.id",
        port: "",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "baggy-segment-macarena.ngrok-free.dev",
        port: "",
      },
    ],
  },
};

export default nextConfig;
