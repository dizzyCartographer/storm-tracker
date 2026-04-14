import { Outlet } from "react-router";
import { ProjectProvider } from "../lib/project-context";
import Nav from "./Nav";
import ProjectSelector from "./ProjectSelector";

export default function Layout() {
  return (
    <ProjectProvider>
      <div className="min-h-screen bg-[#EDF5F4]">
        <Nav />
        <ProjectSelector />
        <main className="max-w-5xl mx-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </ProjectProvider>
  );
}
