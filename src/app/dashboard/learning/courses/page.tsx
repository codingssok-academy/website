import Link from "next/link";
import { COURSES } from "@/data/courses";

function formatMeta(value: number, suffix: string) {
    return value > 0 ? `${value}${suffix}` : "준비 중";
}

export default function CoursesPage() {
    const activeCourses = COURSES.filter((course) => !course.comingSoon);
    const pendingCourses = COURSES.filter((course) => course.comingSoon);
    const courses = [...activeCourses, ...pendingCourses];

    return (
        <main style={{
            minHeight: "100vh",
            background: "#f8fafc",
            padding: "56px 20px 80px",
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                <header style={{ marginBottom: 28 }}>
                    <p style={{
                        margin: "0 0 10px",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                    }}>
                        CODINGSSOK LEARNING PLATFORM
                    </p>
                    <h1 style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: "clamp(30px, 5vw, 52px)",
                        lineHeight: 1.08,
                        fontWeight: 950,
                        letterSpacing: "-0.03em",
                    }}>
                        코스와 교재
                    </h1>
                    <p style={{
                        margin: "14px 0 0",
                        maxWidth: 680,
                        color: "#475569",
                        fontSize: 16,
                        lineHeight: 1.7,
                        fontWeight: 600,
                    }}>
                        배정센터나 성장 대시보드 없이, 수업에서 바로 쓰는 코스와 교재를 먼저 보여줍니다.
                    </p>
                </header>

                <section style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 18,
                }}>
                    {courses.map((course) => {
                        const disabled = Boolean(course.comingSoon);
                        const card = (
                            <article style={{
                                height: "100%",
                                minHeight: 370,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                borderRadius: 16,
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                            }}>
                                <div style={{
                                    position: "relative",
                                    aspectRatio: "16 / 10",
                                    background: course.gradient,
                                    overflow: "hidden",
                                }}>
                                    {course.cardImage ? (
                                        <img
                                            src={course.cardImage}
                                            alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#ffffff",
                                            fontSize: 42,
                                            fontWeight: 900,
                                        }}>
                                            {course.icon}
                                        </div>
                                    )}
                                    <span style={{
                                        position: "absolute",
                                        left: 14,
                                        top: 14,
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        background: disabled ? "rgba(15,23,42,0.72)" : "rgba(37,99,235,0.9)",
                                        color: "#ffffff",
                                        fontSize: 11,
                                        fontWeight: 900,
                                    }}>
                                        {disabled ? "준비 중" : "교재 보기"}
                                    </span>
                                </div>

                                <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                                    <h2 style={{
                                        margin: "0 0 7px",
                                        color: "#0f172a",
                                        fontSize: 20,
                                        lineHeight: 1.25,
                                        fontWeight: 950,
                                    }}>
                                        {course.title}
                                    </h2>
                                    {course.subtitle && (
                                        <p style={{
                                            margin: "0 0 10px",
                                            color: "#2563eb",
                                            fontSize: 12,
                                            lineHeight: 1.5,
                                            fontWeight: 850,
                                        }}>
                                            {course.subtitle}
                                        </p>
                                    )}
                                    <p style={{
                                        margin: 0,
                                        color: "#64748b",
                                        fontSize: 13,
                                        lineHeight: 1.65,
                                        fontWeight: 600,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}>
                                        {course.description}
                                    </p>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: 8,
                                        marginTop: "auto",
                                        paddingTop: 18,
                                    }}>
                                        {[
                                            ["유닛", formatMeta(course.totalUnits, "개")],
                                            ["문제", formatMeta(course.totalProblems, "+")],
                                            ["시간", formatMeta(course.estimatedHours, "h")],
                                        ].map(([label, value]) => (
                                            <span key={label} style={{
                                                borderRadius: 10,
                                                background: "#f1f5f9",
                                                padding: "10px 8px",
                                                textAlign: "center",
                                            }}>
                                                <span style={{
                                                    display: "block",
                                                    color: "#94a3b8",
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    marginBottom: 3,
                                                }}>
                                                    {label}
                                                </span>
                                                <strong style={{
                                                    display: "block",
                                                    color: "#0f172a",
                                                    fontSize: 12,
                                                    fontWeight: 950,
                                                }}>
                                                    {value}
                                                </strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        );

                        if (disabled) {
                            return <div key={course.id} aria-disabled="true" style={{ opacity: 0.62 }}>{card}</div>;
                        }

                        return (
                            <Link
                                key={course.id}
                                href={`/dashboard/learning/courses/${course.id}`}
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                {card}
                            </Link>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
