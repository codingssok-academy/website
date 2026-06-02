/**
 * HTML 교재 파일 매핑
 *
 * 컴퓨터기초(8), 코딩기초(1), C언어(4): 각 커리큘럼 ts에서 직접 경로 관리 (skip)
 * 프로그래밍대회(6): 이 매핑에서 관리
 */

const PROGRAMMING_CONTEST_FILES = [
  'Iron-R1.html','Iron-R2.html','Iron-R3.html','Iron-R4.html','Iron-R5.html','Iron-R6.html','Iron-R7.html','Iron-R8.html',
  'Bronze-R1.html','Bronze-R2.html','Bronze-R3.html','Bronze-R4.html','Bronze-R5.html','Bronze-R6.html','Bronze-R7.html','Bronze-R8.html',
  'Silver-R1.html','Silver-R2.html','Silver-R3.html','Silver-R4.html','Silver-R5.html','Silver-R6.html','Silver-R7.html','Silver-R8.html',
  'Gold-R1.html','Gold-R2.html','Gold-R3.html','Gold-R4.html','Gold-R5.html','Gold-R6.html','Gold-R7.html','Gold-R8.html',
  'Platinum-R1.html','Platinum-R2.html','Platinum-R3.html','Platinum-R4.html','Platinum-R5.html','Platinum-R6.html','Platinum-R7.html','Platinum-R8.html',
] as const;

/**
 * 코스와 유닛 인덱스(1-based)로 HTML 교재 파일 경로 반환
 * 커리큘럼 ts에서 직접 관리하는 코스(1,4,8)는 page.tsx에서 skip 처리됨
 */
export function getHtmlContentPath(courseId: string, unitIndex: number): string | null {
  if (courseId === '6') {
    const file = PROGRAMMING_CONTEST_FILES[unitIndex - 1];
    return file ? `/learn/프로그래밍대회/${file}` : null;
  }
  return null;
}
