import { redirect } from "next/navigation";

export default function ParentHomeRedirect() {
    redirect("/parent/feedback");
}
