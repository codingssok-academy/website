// 서버 컴포넌트 wrapper — supabase prerender 회피용 force-dynamic
// 실제 UI는 MonitorClient (client component)
export const dynamic = "force-dynamic";

import MonitorClient from "./MonitorClient";

export default function MonitorPage() {
    return <MonitorClient />;
}
