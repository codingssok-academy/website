"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";

export interface FriendChallenge {
    id: string;
    challenger_id: string;
    opponent_id: string;
    problem_id: string;
    problem_title: string;
    challenger_time_ms: number | null;
    opponent_time_ms: number | null;
    challenger_solved: boolean;
    opponent_solved: boolean;
    status: "pending" | "active" | "completed" | "expired";
    winner_id: string | null;
    xp_reward: number;
    created_at: string;
    expires_at: string;
    // joined fields
    challenger_name?: string;
    opponent_name?: string;
}

export function useFriendChallenge(userId?: string) {
    const supabase = useMemo(() => createClient(), []);
    const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChallenges = useCallback(async () => {
        if (!userId) return;
        const { data } = await supabase
            .from("friend_challenges")
            .select("*")
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .order("created_at", { ascending: false })
            .limit(20);

        if (data) {
            // 이름 조회
            const userIds = new Set<string>();
            data.forEach((c: FriendChallenge) => {
                userIds.add(c.challenger_id);
                userIds.add(c.opponent_id);
            });
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name")
                .in("id", Array.from(userIds));

            const nameMap = new Map<string, string>();
            profiles?.forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));

            setChallenges(data.map((c: FriendChallenge) => ({
                ...c,
                challenger_name: nameMap.get(c.challenger_id) || "???",
                opponent_name: nameMap.get(c.opponent_id) || "???",
            })));
        }
        setLoading(false);
    }, [userId, supabase]);

    useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

    // 챌린지 생성
    const createChallenge = useCallback(async (opponentId: string, problemId: string, problemTitle: string) => {
        if (!userId) return null;
        const { data, error } = await supabase
            .from("friend_challenges")
            .insert({
                challenger_id: userId,
                opponent_id: opponentId,
                problem_id: problemId,
                problem_title: problemTitle,
            })
            .select()
            .single();

        if (!error && data) {
            await fetchChallenges();
            return data as FriendChallenge;
        }
        return null;
    }, [userId, supabase, fetchChallenges]);

    // 챌린지 결과 제출
    const submitResult = useCallback(async (challengeId: string, timeMs: number, solved: boolean) => {
        if (!userId) return;

        const challenge = challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const isChallenger = challenge.challenger_id === userId;
        const updateData = isChallenger
            ? { challenger_time_ms: timeMs, challenger_solved: solved }
            : { opponent_time_ms: timeMs, opponent_solved: solved };

        await supabase.from("friend_challenges").update(updateData).eq("id", challengeId);

        // 양쪽 다 제출했는지 확인
        const { data: updated } = await supabase
            .from("friend_challenges")
            .select("*")
            .eq("id", challengeId)
            .single();

        if (updated) {
            const c = updated as FriendChallenge;
            const bothDone = (isChallenger ? solved : c.challenger_solved) &&
                             (isChallenger ? c.opponent_solved : solved);
            const bothSubmitted = (isChallenger ? timeMs !== null : c.challenger_time_ms !== null) &&
                                  (isChallenger ? c.opponent_time_ms !== null : timeMs !== null);

            if (bothSubmitted) {
                let winnerId: string | null = null;
                const cSolved = isChallenger ? solved : c.challenger_solved;
                const oSolved = isChallenger ? c.opponent_solved : solved;
                const cTime = isChallenger ? timeMs : (c.challenger_time_ms || Infinity);
                const oTime = isChallenger ? (c.opponent_time_ms || Infinity) : timeMs;

                if (cSolved && !oSolved) winnerId = c.challenger_id;
                else if (!cSolved && oSolved) winnerId = c.opponent_id;
                else if (cSolved && oSolved) winnerId = cTime <= oTime ? c.challenger_id : c.opponent_id;

                await supabase.from("friend_challenges").update({
                    status: "completed",
                    winner_id: winnerId,
                }).eq("id", challengeId);
            }
        }

        await fetchChallenges();
    }, [userId, challenges, supabase, fetchChallenges]);

    // 내 관련 챌린지 분류
    const pendingReceived = challenges.filter(c => c.opponent_id === userId && c.status === "pending");
    const pendingSent = challenges.filter(c => c.challenger_id === userId && c.status === "pending");
    const active = challenges.filter(c => c.status === "active" || c.status === "pending");
    const completed = challenges.filter(c => c.status === "completed");

    return {
        challenges, loading, createChallenge, submitResult, fetchChallenges,
        pendingReceived, pendingSent, active, completed,
    };
}
