import { BrowserRouter, Routes, Route } from "react-router";

function Home() {
  return (
    <div className="min-h-screen bg-[#EDF5F4] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-2">
          Storm Tracker v2
        </h1>
        <p className="text-[#475569]">Vite + React + Tailwind</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
