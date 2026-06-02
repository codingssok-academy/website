type QueryResult = {
    data: unknown;
    error: null;
    count?: number | null;
};

type Resolver = (value: QueryResult) => unknown;
type Rejecter = (reason?: unknown) => unknown;

function createQuery(initial: QueryResult = { data: [], error: null, count: 0 }) {
    let result = initial;
    const passthrough = () => query;

    const query = {
        select: passthrough,
        insert: passthrough,
        update: passthrough,
        upsert: passthrough,
        delete: passthrough,
        eq: passthrough,
        neq: passthrough,
        gt: passthrough,
        gte: passthrough,
        lt: passthrough,
        lte: passthrough,
        like: passthrough,
        ilike: passthrough,
        in: passthrough,
        is: passthrough,
        or: passthrough,
        contains: passthrough,
        order: passthrough,
        limit: passthrough,
        range: passthrough,
        maybeSingle: () => {
            result = { data: null, error: null, count: null };
            return query;
        },
        single: () => {
            result = { data: null, error: null, count: null };
            return query;
        },
        then: (resolve: Resolver, reject?: Rejecter) => Promise.resolve(result).then(resolve, reject),
        catch: (reject: Rejecter) => Promise.resolve(result).catch(reject),
        finally: (callback: () => void) => Promise.resolve(result).finally(callback),
    };

    return query;
}

export function shouldUseNoopSupabaseClient() {
    return process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createNoopSupabaseClient() {
    const noopChannel = {
        on: () => noopChannel,
        subscribe: () => noopChannel,
        unsubscribe: () => Promise.resolve("ok"),
        send: () => Promise.resolve("ok"),
    };

    return {
        from: () => createQuery(),
        rpc: () => Promise.resolve({ data: null, error: null }),
        channel: () => noopChannel,
        removeChannel: () => Promise.resolve({ error: null }),
        removeAllChannels: () => Promise.resolve({ error: null }),
        getChannels: () => [],
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({
                data: {
                    subscription: {
                        unsubscribe: () => undefined,
                    },
                },
            }),
        },
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ data: null, error: null }),
                download: () => Promise.resolve({ data: null, error: null }),
                list: () => Promise.resolve({ data: [], error: null }),
                remove: () => Promise.resolve({ data: [], error: null }),
                getPublicUrl: () => ({ data: { publicUrl: "" }, error: null }),
            }),
        },
    };
}
