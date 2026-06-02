'use server'

import { createClient } from '@/lib/supabase/server'

const PENDING_ERROR = '회원가입이 접수되었습니다. 원장님 승인 후 이용하실 수 있어요. 승인되면 다시 로그인해주세요.'
const REJECTED_ERROR = '가입이 거절되었습니다. 학원에 문의해주세요.'

async function checkApprovalAndMaybeSignOut(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status, role')
    .eq('id', userId)
    .maybeSingle()

  // 교사/관리자는 통과
  if (profile?.role === 'teacher' || profile?.role === 'admin') return null

  if (profile?.approval_status === 'pending') {
    await supabase.auth.signOut()
    return PENDING_ERROR
  }
  if (profile?.approval_status === 'rejected') {
    await supabase.auth.signOut()
    return REJECTED_ERROR
  }
  return null
}

export async function simpleAuth(name: string, birthDate: string, role: 'student' | 'parent' = 'student') {
  const supabase = await createClient()

  // 이름+생년월일 조합으로 이메일 생성 (Supabase Auth 호환)
  // 한글 이름은 이메일에 사용 불가하므로 hex 인코딩
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '')
  const nameHex = Buffer.from(normalizedName).toString('hex')
  const normalizedDate = birthDate.replace(/-/g, '')
  const syntheticEmail = `u${nameHex}_${normalizedDate}@codingssok.local`
  const syntheticPassword = `cs_${normalizedDate}_${nameHex}`

  // 1) 먼저 로그인 시도
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: syntheticPassword,
  })

  if (loginData?.user) {
    // 승인 상태 체크
    const blockMsg = await checkApprovalAndMaybeSignOut(supabase, loginData.user.id)
    if (blockMsg) return { error: blockMsg }
    return { error: null, isNewUser: false }
  }

  // 2) 로그인 실패 시 -> 회원가입 시도
  if (loginError) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password: syntheticPassword,
      options: {
        data: {
          name: name.trim(),
          role,
          birth_date: birthDate,
        },
      },
    })

    if (signUpError) {
      if (process.env.NODE_ENV === 'development') console.error('[simpleAuth] signUp error:', signUpError.message, signUpError.status)
      if (signUpError.message.includes('already registered')) {
        // 이미 등록된 유저인데 비밀번호가 다를 수 있음
        return { error: '이미 등록된 정보입니다. 이름과 생년월일을 확인해주세요.' }
      }
      return { error: `가입 오류: ${signUpError.message}` }
    }

    // 신규 가입 성공 — 교사/관리자가 아니면 즉시 로그아웃 + 승인 대기
    if (signUpData?.user) {
      // 기존 세션 정리 (혹시 붙어있으면)
      await supabase.auth.signOut().catch(() => { /* ignore */ })
      return {
        error: null,
        isNewUser: true,
        pendingApproval: true,
        message: '회원가입이 접수되었습니다! 원장님 승인 후 이용하실 수 있어요. 승인되면 다시 로그인해주세요.',
      }
    }

    return { error: '가입 처리 중 문제가 발생했습니다. 다시 시도해주세요.' }
  }

  return { error: '알 수 없는 오류가 발생했습니다.' }
}

export async function teacherLogin(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  return { error: null }
}
