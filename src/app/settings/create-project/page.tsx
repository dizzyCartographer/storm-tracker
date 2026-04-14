import { redirect } from "next/navigation";

export default function CreateProjectRedirect() {
  redirect("/projects/create");
}
