import ModelViewer from "@/components/ModelViewer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black">
      <div className="w-full h-screen">
        <ModelViewer />
      </div>
    </main>
  );
}
