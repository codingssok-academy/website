"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { XP_REWARDS } from "@/lib/xp-engine";
import { awardXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import { checkAchievementBadges } from "@/lib/reward-engine";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import AITutor from "@/components/ui/AITutor";
import CodeVisualizer from "@/components/ui/CodeVisualizer";
import type { MemoryCell as VizMemoryCell, ExecutionStep } from "@/components/ui/CodeVisualizer";
import type { editor } from "monaco-editor";
import "./compiler.css";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeSubmission {
  id: string;
  user_id: string;
  language: string;
  code: string;
  output: string;
  status: string;
  created_at: string;
}

function safeGetItem(key: string, fallback: string = ""): string {
  if (typeof window === "undefined") return fallback;
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, value); } catch {}
}

/* ── Constants ── */
const C_DEFAULT = `#include <stdio.h>\n\nint main() {\n    printf("Hello, 코딩쏙!\\n");\n    int a = 10, b = 20;\n    printf("%d + %d = %d\\n", a, b, a + b);\n    return 0;\n}`;
const PY_DEFAULT = `# 파이썬 코딩쏙\nname = "코딩쏙"\nprint(f"Hello, {name}!")\nprint(f"합계: {sum([1,2,3,4,5])}")`;
const JS_DEFAULT = `// JavaScript 코딩쏙\nconst name = "코딩쏙";\nconsole.log(\`Hello, \${name}!\`);\nconsole.log(\`합계: \${[1,2,3,4,5].reduce((a,b)=>a+b)}\`);`;
const CPP_DEFAULT = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, 코딩쏙!" << endl;\n    int a = 10, b = 20;\n    cout << a << " + " << b << " = " << a + b << endl;\n    return 0;\n}`;
const JAVA_DEFAULT = `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, 코딩쏙!");\n        int sum = 0;\n        for (int i = 1; i <= 5; i++) sum += i;\n        System.out.println("합계: " + sum);\n    }\n}`;

interface FileTab { id: string; name: string; content: string; lang: string; modified: boolean; }

const LANG_CFG: Record<string, { label: string; monaco: string; ext: string; defaultCode: string }> = {
  c:          { label:"C",          monaco:"c",          ext:".c",    defaultCode: C_DEFAULT },
  cpp:        { label:"C++",        monaco:"cpp",        ext:".cpp",  defaultCode: CPP_DEFAULT },
  python:     { label:"Python",     monaco:"python",     ext:".py",   defaultCode: PY_DEFAULT },
  javascript: { label:"JavaScript", monaco:"javascript", ext:".js",   defaultCode: JS_DEFAULT },
  java:       { label:"Java",       monaco:"java",       ext:".java", defaultCode: JAVA_DEFAULT },
};

const SNIPPETS = [
  { title:"Hello World", lang:"c", code:`#include <stdio.h>\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}` },
  { title:"배열 순회", lang:"c", code:`#include <stdio.h>\nint main() {\n    int arr[] = {10,20,30,40,50};\n    for(int i=0; i<5; i++)\n        printf("arr[%d]=%d\\n", i, arr[i]);\n    return 0;\n}` },
  { title:"포인터", lang:"c", code:`#include <stdio.h>\nint main() {\n    int x=42; int *p=&x;\n    printf("값:%d 주소:%p\\n", *p, (void*)p);\n    return 0;\n}` },
  { title:"구조체", lang:"c", code:`#include <stdio.h>\ntypedef struct { char name[20]; int age; } Student;\nint main() {\n    Student s = {"홍길동", 18};\n    printf("%s %d세\\n", s.name, s.age);\n    return 0;\n}` },
  { title:"함수", lang:"c", code:`#include <stdio.h>\nint factorial(int n) { return n<=1?1:n*factorial(n-1); }\nint main() {\n    for(int i=1;i<=7;i++) printf("%d!=%d\\n",i,factorial(i));\n    return 0;\n}` },
  { title:"동적 할당", lang:"c", code:`#include <stdio.h>\n#include <stdlib.h>\nint main() {\n    int *arr = (int*)malloc(5*sizeof(int));\n    for(int i=0;i<5;i++) arr[i]=i*10;\n    for(int i=0;i<5;i++) printf("%d ",arr[i]);\n    printf("\\n"); free(arr);\n    return 0;\n}` },
  { title:"리스트", lang:"python", code:`fruits=["사과","바나나","딸기"]\nfor i,f in enumerate(fruits): print(f"{i+1}. {f}")` },
  { title:"클래스", lang:"python", code:`class Animal:\n    def __init__(self,name,sound):\n        self.name=name;self.sound=sound\n    def speak(self): print(f"{self.name}: {self.sound}!")\nAnimal("고양이","야옹").speak()` },
  { title:"배열 메서드", lang:"javascript", code:`const nums = [1,2,3,4,5];\nconsole.log("합계:", nums.reduce((a,b)=>a+b));\nconsole.log("짝수:", nums.filter(n=>n%2===0));\nconsole.log("2배:", nums.map(n=>n*2));` },
  { title:"Promise", lang:"javascript", code:`async function fetchData() {\n  return new Promise(resolve => {\n    setTimeout(() => resolve("데이터 로드 완료!"), 100);\n  });\n}\nfetchData().then(console.log);` },
  { title:"Hello C++", lang:"cpp", code:`#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}` },
  { title:"벡터", lang:"cpp", code:`#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> v = {10,20,30,40,50};\n    for(int x : v) cout << x << " ";\n    cout << endl;\n    return 0;\n}` },
  { title:"Hello Java", lang:"java", code:`public class Main {\n    public static void main(String[] args) {\n        for(int i=1;i<=5;i++)\n            System.out.println(i + ". Hello!");\n    }\n}` },
];

const CHEATSHEET: Record<string,{title:string;items:{k:string;v:string}[]}[]> = {
  c: [
    { title:"자료형", items:[{k:"int",v:"정수 (4B)"},{k:"float",v:"실수 (4B)"},{k:"double",v:"실수 (8B)"},{k:"char",v:"문자 (1B)"},{k:"void",v:"없음"}]},
    { title:"제어문", items:[{k:"if/else",v:"조건 분기"},{k:"for",v:"반복"},{k:"while",v:"조건 반복"},{k:"switch",v:"다중 분기"},{k:"break",v:"루프 탈출"}]},
    { title:"포인터", items:[{k:"&x",v:"x의 주소"},{k:"*p",v:"p가 가리키는 값"},{k:"malloc()",v:"동적 할당"},{k:"free()",v:"메모리 해제"}]},
  ],
  cpp: [
    { title:"자료형", items:[{k:"int",v:"정수 (4B)"},{k:"double",v:"실수 (8B)"},{k:"string",v:"문자열"},{k:"vector",v:"동적 배열"},{k:"bool",v:"참/거짓"}]},
    { title:"키워드", items:[{k:"cout/cin",v:"입출력"},{k:"class",v:"클래스"},{k:"new/delete",v:"동적 할당"},{k:"template",v:"제네릭"},{k:"namespace",v:"네임스페이스"}]},
  ],
  python: [
    { title:"자료형", items:[{k:"int",v:"정수"},{k:"float",v:"실수"},{k:"str",v:"문자열"},{k:"list",v:"리스트"},{k:"dict",v:"딕셔너리"}]},
    { title:"제어문", items:[{k:"if/elif/else",v:"조건"},{k:"for...in",v:"반복"},{k:"while",v:"조건 반복"},{k:"def",v:"함수 정의"},{k:"class",v:"클래스"}]},
  ],
  javascript: [
    { title:"자료형", items:[{k:"number",v:"숫자"},{k:"string",v:"문자열"},{k:"boolean",v:"참/거짓"},{k:"array",v:"배열"},{k:"object",v:"객체"}]},
    { title:"키워드", items:[{k:"let/const",v:"변수 선언"},{k:"function",v:"함수"},{k:"=>",v:"화살표 함수"},{k:"async/await",v:"비동기"},{k:"class",v:"클래스"}]},
  ],
  java: [
    { title:"자료형", items:[{k:"int",v:"정수 (4B)"},{k:"double",v:"실수 (8B)"},{k:"String",v:"문자열"},{k:"boolean",v:"참/거짓"},{k:"char",v:"문자 (2B)"}]},
    { title:"키워드", items:[{k:"public",v:"공개"},{k:"static",v:"정적"},{k:"void",v:"반환 없음"},{k:"class",v:"클래스"},{k:"extends",v:"상속"}]},
  ],
};

const SHORTCUTS = [
  {keys:"F5",desc:"실행"},{keys:"Ctrl+N",desc:"새 파일"},{keys:"Ctrl+Enter",desc:"컴파일 & 실행"},
  {keys:"Ctrl+`",desc:"터미널 토글"},{keys:"Ctrl+/",desc:"주석 토글"},{keys:"Ctrl+Shift+P",desc:"명령 팔레트"},
  {keys:"Ctrl+D",desc:"단어 선택"},{keys:"Ctrl+Shift+K",desc:"줄 삭제"},{keys:"Alt+↑↓",desc:"줄 이동"},
  {keys:"Ctrl+B",desc:"사이드바 토글"},{keys:"Ctrl+F",desc:"찾기"},{keys:"Ctrl+H",desc:"바꾸기"},
];

const CODE_RAIN = ["int main(){","printf()","#include","return 0;","for(i=0;","while(1)","if(x>0)","malloc()","sizeof()","struct{}","*ptr","break;"];
type RTab = "snippets"|"cheatsheet"|"stats"|"shortcuts"|"memory"|"visualizer"|"achievements"|"heatmap"|"challenge"|"algo"|"execution"|"bookmarks"|"review"|"focus"|"notifications";
const RTABS_BASIC:{id:RTab;icon:string;label:string}[] = [
  {id:"snippets",icon:"code",label:"스니펫"},{id:"cheatsheet",icon:"menu_book",label:"치트시트"},
  {id:"memory",icon:"memory",label:"메모리"},{id:"review",icon:"rate_review",label:"코드리뷰"},
];
const RTABS_ADVANCED:{id:RTab;icon:string;label:string}[] = [
  {id:"stats",icon:"bar_chart",label:"통계"},{id:"shortcuts",icon:"keyboard",label:"단축키"},
  {id:"visualizer",icon:"visibility",label:"시각화"},{id:"achievements",icon:"emoji_events",label:"성취"},
  {id:"heatmap",icon:"grid_on",label:"히트맵"},{id:"challenge",icon:"flag",label:"챌린지"},
  {id:"algo",icon:"account_tree",label:"알고리즘"},{id:"execution",icon:"play_circle",label:"실행추적"},
  {id:"bookmarks",icon:"bookmark",label:"북마크"},
  {id:"focus",icon:"center_focus_strong",label:"집중"},{id:"notifications",icon:"notifications",label:"알림"},
];
const RTABS = [...RTABS_BASIC, ...RTABS_ADVANCED];
type ActPanel = "files"|"search"|"templates"|null;

const ALGO_LIST = [
  {name:"버블 정렬",complexity:"O(n²)",desc:"인접 요소를 비교하며 정렬",code:`#include <stdio.h>\nvoid bubbleSort(int arr[], int n) {\n    for(int i=0;i<n-1;i++)\n        for(int j=0;j<n-i-1;j++)\n            if(arr[j]>arr[j+1]) {\n                int t=arr[j]; arr[j]=arr[j+1]; arr[j+1]=t;\n            }\n}\nint main() {\n    int arr[]={64,34,25,12,22,11,90};\n    int n=sizeof(arr)/sizeof(arr[0]);\n    bubbleSort(arr,n);\n    for(int i=0;i<n;i++) printf("%d ",arr[i]);\n    return 0;\n}`},
  {name:"이진 탐색",complexity:"O(log n)",desc:"정렬된 배열에서 반씩 줄여 탐색",code:`#include <stdio.h>\nint binarySearch(int arr[],int l,int r,int x) {\n    while(l<=r) {\n        int m=l+(r-l)/2;\n        if(arr[m]==x) return m;\n        if(arr[m]<x) l=m+1; else r=m-1;\n    }\n    return -1;\n}\nint main() {\n    int arr[]={2,3,4,10,40};\n    int result=binarySearch(arr,0,4,10);\n    printf(result!=-1?"인덱스: %d\\n":"없음\\n",result);\n    return 0;\n}`},
  {name:"피보나치",complexity:"O(n)",desc:"재귀/반복으로 피보나치 수열",code:`#include <stdio.h>\nint fib(int n) {\n    int a=0,b=1,c;\n    for(int i=2;i<=n;i++) { c=a+b; a=b; b=c; }\n    return n==0?a:b;\n}\nint main() {\n    for(int i=0;i<10;i++) printf("F(%d)=%d\\n",i,fib(i));\n    return 0;\n}`},
  {name:"선택 정렬",complexity:"O(n²)",desc:"최솟값을 찾아 앞으로 이동",code:`#include <stdio.h>\nint main() {\n    int arr[]={29,10,14,37,13};\n    int n=5;\n    for(int i=0;i<n-1;i++) {\n        int min=i;\n        for(int j=i+1;j<n;j++) if(arr[j]<arr[min]) min=j;\n        int t=arr[min]; arr[min]=arr[i]; arr[i]=t;\n    }\n    for(int i=0;i<n;i++) printf("%d ",arr[i]);\n    return 0;\n}`},
];

function MI({icon,s,c}:{icon:string;s?:number;c?:string}){
  return <span className="material-symbols-outlined" style={{fontSize:s||14,color:c}}>{icon}</span>;
}

/* ═══ MAIN ═══ */
export default function CompilerPage() {
  const { user } = useAuth();
  const supabase = useMemo(()=>createClient(),[]);
  const userId = user?.id||null;

  // 탭 상태 복원 (localStorage)
  const [tabs,setTabs]=useState<FileTab[]>(()=>{
    const saved=safeGetItem("cs-tabs","");
    if(saved){try{const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.length>0)return parsed;}catch{}}
    return [{id:"1",name:"main.c",content:C_DEFAULT,lang:"c",modified:false}];
  });
  const [activeTabId,setActiveTabId]=useState(()=>safeGetItem("cs-active-tab","1"));
  const [tabCnt,setTabCnt]=useState(()=>{
    const saved=safeGetItem("cs-tabs","");
    if(saved){try{const parsed=JSON.parse(saved);return parsed.length+1;}catch{}}
    return 2;
  });
  const activeTab=tabs.find(t=>t.id===activeTabId)||tabs[0];
  const lang=activeTab?.lang||"c";
  const cfg=LANG_CFG[lang];

  const [running,setRunning]=useState(false);
  const [output,setOutput]=useState("");
  const [outStatus,setOutStatus]=useState<"idle"|"success"|"error"|"waiting_input">("idle");
  const [execTime,setExecTime]=useState<number|null>(null);
  const [stdin,setStdin]=useState("");
  const [showStdin,setShowStdin]=useState(false);
  const [stdinLines,setStdinLines]=useState<string[]>([]);
  const [currentInput,setCurrentInput]=useState("");
  const stdinInputRef=useRef<HTMLInputElement>(null);

  const [actPanel,setActPanel]=useState<ActPanel>("files");
  const [showRight,setShowRight]=useState(true);
  const [advancedTabs,setAdvancedTabs]=useState(false);
  const [rightTab,setRightTab]=useState<RTab>("snippets");
  const [showTerminal,setShowTerminal]=useState(true);
  const termH=180;
  const [showPalette,setShowPalette]=useState(false);
  const [xpMsg,setXpMsg]=useState("");
  const [particles,setParticles]=useState<{id:number;x:number;y:number;color:string}[]>([]);
  const [compileCount,setCompileCount]=useState(()=>parseInt(safeGetItem("cs-cc","0")));
  const [minimap,setMinimap]=useState(true);
  const [cursorPos,setCursorPos]=useState({ln:1,col:1});
  const editorRef=useRef<editor.IStandaloneCodeEditor|null>(null);
  const [zenMode,setZenMode]=useState(false);
  const [typingSound,setTypingSound]=useState(false);
  const [bookmarks,setBookmarks]=useState<{ln:number;text:string}[]>([]);
  const [notifications,setNotifications]=useState<{id:number;type:string;msg:string;time:string}[]>([]);
  const addNotif=(type:string,msg:string)=>setNotifications(p=>[{id:Date.now(),type,msg,time:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})},...p].slice(0,20));

  const [history,setHistory]=useState<CodeSubmission[]>([]);
  useEffect(()=>{safeSetItem("cs-cc",String(compileCount))},[compileCount]);

  // 실시간 저장: 탭 변경 시 localStorage에 자동 저장 (디바운스 500ms)
  useEffect(()=>{
    const t=setTimeout(()=>{
      safeSetItem("cs-tabs",JSON.stringify(tabs));
      safeSetItem("cs-active-tab",activeTabId);
    },500);
    return()=>clearTimeout(t);
  },[tabs,activeTabId]);

  const fetchHist=useCallback(async()=>{
    if(!userId)return;
    try{const{data}=await supabase.from("code_submissions").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(20);setHistory((data as CodeSubmission[])||[]);}catch(e){if(process.env.NODE_ENV==="development")console.error("[Compiler] fetchHist:",e);}
  },[userId,supabase]);
  useEffect(()=>{if(userId)fetchHist()},[userId,fetchHist]);

  const updateCode=(v:string|undefined)=>{const val=v||"";setTabs(p=>p.map(t=>t.id===activeTabId?{...t,content:val,modified:true}:t));};
  const newFile=()=>{const id=String(tabCnt);setTabs((p: FileTab[])=>[...p,{id,name:`Untitled-${tabCnt}.c`,content:C_DEFAULT,lang:"c",modified:false}]);setActiveTabId(id);setTabCnt((p: number)=>p+1);};
  const closeTab=(id:string)=>{const idx=tabs.findIndex(t=>t.id===id);setTabs(p=>p.filter(t=>t.id!==id));if(activeTabId===id){const next=tabs[idx-1]||tabs[idx+1];if(next)setActiveTabId(next.id);}};
  const switchLang=(l:string)=>{const cfg=LANG_CFG[l];if(!cfg)return;setTabs(p=>p.map(t=>t.id===activeTabId?{...t,lang:l,name:`main${cfg.ext}`,content:cfg.defaultCode,modified:false}:t));setOutput("");setOutStatus("idle");};

  // 입력 함수 감지
  const INPUT_PATS:Record<string,RegExp>={c:/\b(scanf|gets|fgets|getchar|fscanf)\s*\(/,cpp:/\b(cin\s*>>|getline\s*\(|scanf|gets|getchar)/,python:/\binput\s*\(/,javascript:/\bprompt\s*\(/,java:/\b(Scanner|BufferedReader|readLine)\b/};
  const needsInput=(code:string,l:string)=>{const p=INPUT_PATS[l];return p?p.test(code):false;};
  // 담당자 'cin 입력칸 어디' — 코드에 입력 함수 감지 시 STDIN 패널 자동 펼침
  const inputDetected = activeTab ? needsInput(activeTab.content, activeTab.lang) : false;
  useEffect(() => { if (inputDetected) setShowStdin(true); }, [inputDetected]);

  // 실제 컴파일 실행
  const executeCompile=useCallback(async(finalStdin:string)=>{
    if(!activeTab)return;setRunning(true);setExecTime(null);
    const t0=performance.now();let res="",stat="success";
    try{
      const r=await fetch("/api/compile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:activeTab.content,language:activeTab.lang,stdin:finalStdin})});
      const d=await r.json();
      if(!d.success){res=d.stderr||d.error||"오류 발생";stat="error";}
      else{res=d.stdout||"(출력 없음)";stat="success";}
    }catch{res="서버 연결 실패";stat="error";}
    setExecTime(Math.round(performance.now()-t0));setOutStatus(stat==="success"?"success":"error");setOutput(p=>p+res);setRunning(false);setCompileCount(p=>p+1);
    addNotif(stat==="success"?"success":"error",stat==="success"?`실행 완료 (${Math.round(performance.now()-t0)}ms)`:`오류 발생`);
    if(stat==="success"){const ps=Array.from({length:10},(_,i)=>({id:Date.now()+i,x:50+Math.random()*60,y:50+Math.random()*40,color:["#4ade80","#6d9fff","#22d3ee","#fbbf24"][i%4]}));setParticles(ps);setTimeout(()=>setParticles([]),900);}
    if(userId){try{await supabase.from("code_submissions").insert({user_id:userId,language:activeTab.lang,code:activeTab.content,output:res,status:stat});fetchHist();if(stat==="success"){await awardXP("code_run", `compiler:${crypto.randomUUID()}`);setXpMsg(`+${XP_REWARDS.code_submit} XP`);setTimeout(()=>setXpMsg(""),3000);trackMission("code_run");checkAchievementBadges({completedUnits:0,codeRuns:compileCount+1,quizStreak:0});}}catch(e){if(process.env.NODE_ENV==="development")console.error("[Compiler] save:",e);}}
  },[activeTab,userId,supabase,fetchHist,compileCount]);

  const runCode=useCallback(async()=>{
    if(!activeTab)return;setOutput("");setStdinLines([]);setCurrentInput("");setShowTerminal(true);
    if(needsInput(activeTab.content,activeTab.lang)&&!stdin){
      setOutStatus("waiting_input");
      setTimeout(()=>stdinInputRef.current?.focus(),100);
    }else{
      executeCompile(stdin);
    }
  },[activeTab,stdin,executeCompile]);

  const submitInteractiveInput=useCallback(()=>{
    const all=[...stdinLines,...(currentInput?[currentInput]:[])];
    const final=all.join("\n");
    setStdin(final);setOutput(p=>p+"\n");
    executeCompile(final);
  },[stdinLines,currentInput,executeCompile]);

  const handleStdinKeyDown=useCallback((e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();submitInteractiveInput();}
    else if(e.key==="Enter"){e.preventDefault();setStdinLines(p=>[...p,currentInput]);setOutput(p=>p+currentInput+"\n");setCurrentInput("");}
  },[currentInput,submitInteractiveInput]);

  const handleMount=(editorInstance:editor.IStandaloneCodeEditor,monaco:typeof import("monaco-editor"))=>{
    editorRef.current=editorInstance;
    // Pure black theme
    monaco.editor.defineTheme("cs-black",{base:"vs-dark",inherit:true,rules:[
      {token:"",background:"000000",foreground:"e0e0e0"},
      {token:"keyword",foreground:"c084fc",fontStyle:"bold"},
      {token:"keyword.control",foreground:"c084fc"},
      {token:"keyword.flow",foreground:"c084fc"},
      {token:"type",foreground:"5eead4"},
      {token:"type.identifier",foreground:"5eead4"},
      {token:"string",foreground:"86efac"},
      {token:"string.escape",foreground:"fcd34d"},
      {token:"comment",foreground:"6b7280",fontStyle:"italic"},
      {token:"number",foreground:"7dd3fc"},
      {token:"number.float",foreground:"7dd3fc"},
      {token:"number.hex",foreground:"7dd3fc"},
      {token:"delimiter",foreground:"c8c8c8"},
      {token:"delimiter.bracket",foreground:"c8c8c8"},
      {token:"operator",foreground:"e0e0e0"},
      {token:"identifier",foreground:"e0e0e0"},
      {token:"variable",foreground:"e0e0e0"},
      {token:"function",foreground:"fdba74"},
      {token:"predefined",foreground:"67e8f9"},
      {token:"tag",foreground:"f472b6"},
      {token:"attribute.name",foreground:"fdba74"},
      {token:"attribute.value",foreground:"86efac"},
      {token:"metatag",foreground:"f472b6"},
    ],colors:{"editor.background":"#000000","editor.foreground":"#e0e0e0","editorLineNumber.foreground":"#444444","editorLineNumber.activeForeground":"#888888","editor.selectionBackground":"#1a3a6a","editor.lineHighlightBackground":"#0a0a0a","editorCursor.foreground":"#7daaff","editorWhitespace.foreground":"#1a1a1a","editorIndentGuide.background":"#151515","editorIndentGuide.activeBackground":"#2a2a2a","editorWidget.background":"#0a0a0a","editorWidget.border":"#222","editorSuggestWidget.background":"#0a0a0a","editorSuggestWidget.border":"#222","editorSuggestWidget.selectedBackground":"#1a1a1a","minimap.background":"#000000","scrollbar.shadow":"#000000","scrollbarSlider.background":"#1a1a1a80","scrollbarSlider.hoverBackground":"#22222280","scrollbarSlider.activeBackground":"#33333380"}});
    monaco.editor.setTheme("cs-black");
    editorInstance.addAction({id:"run",label:"Run",keybindings:[2048|3],run:()=>runCode()});
    editorInstance.addAction({id:"bookmark",label:"Toggle Bookmark",keybindings:[2048|66],run:(ed)=>{const ln=ed.getPosition()?.lineNumber;if(ln){const mdl=ed.getModel();const text=mdl?.getLineContent(ln)||"";
      setBookmarks(p=>{const exists=p.find(b=>b.ln===ln);return exists?p.filter(b=>b.ln!==ln):[...p,{ln,text:text.trim()}];});}}})
    editorInstance.onDidChangeCursorPosition((e)=>setCursorPos({ln:e.position.lineNumber,col:e.position.column}));
    if(typingSound){(editorInstance as editor.IStandaloneCodeEditor & {onDidType:(cb:()=>void)=>void}).onDidType(()=>{const a=new Audio();a.src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";a.volume=0.02;a.play().catch(()=>{});});}
  };

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="P"){e.preventDefault();setShowPalette(p=>!p);}
      if((e.ctrlKey||e.metaKey)&&e.key==="n"){e.preventDefault();newFile();}
      if(e.key==="F5"){e.preventDefault();runCode();}
      if((e.ctrlKey||e.metaKey)&&e.key==="`"){e.preventDefault();setShowTerminal(p=>!p);}
      if((e.ctrlKey||e.metaKey)&&e.key==="b"){e.preventDefault();setActPanel(p=>p?null:"files");}
    };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[runCode]);

  const rainCols=useMemo(()=>Array.from({length:18},(_,i)=>({left:`${(i/18)*100}%`,delay:Math.random()*10,dur:8+Math.random()*12,text:CODE_RAIN[i%CODE_RAIN.length]})),[]);
  const lines=(activeTab?.content||"").split("\n").length;
  const bytes=new Blob([activeTab?.content||""]).size;

  // Simple memory simulation for C code
  const memCells=useMemo(()=>{
    if(lang!=="c")return[];
    const m:{name:string;type:string;addr:string;val:string}[]=[];
    const code=activeTab?.content||"";
    const re=/\b(int|float|double|char)\s+(\w+)\s*=\s*([^;]+)/g;let match;let addr=0x7FFF0000;
    while((match=re.exec(code))!==null){m.push({name:match[2],type:match[1],addr:`0x${(addr).toString(16).toUpperCase()}`,val:match[3].trim()});addr+=4;}
    return m;
  },[activeTab?.content,lang]);

  // Extract variables for CodeVisualizer
  const vizSteps = useMemo<ExecutionStep[]>(() => {
    const code = activeTab?.content || "";
    const cells: VizMemoryCell[] = [];
    let addr = 0x7FFF0000;
    for (const m of code.matchAll(/\bint\s+(\w+)\s*=\s*([^;,]+)/g)) {
      cells.push({ name: m[1], value: m[2].trim(), type: "int", address: `0x${(addr).toString(16).toUpperCase()}`, highlight: false });
      addr += 4;
    }
    for (const m of code.matchAll(/\bchar\s+(\w+)\s*=\s*'([^']*)'/g)) {
      cells.push({ name: m[1], value: m[2], type: "char", address: `0x${(addr).toString(16).toUpperCase()}`, highlight: false });
      addr += 1;
    }
    for (const m of code.matchAll(/\b(?:float|double)\s+(\w+)\s*=\s*([^;,]+)/g)) {
      cells.push({ name: m[1], value: m[2].trim(), type: "float", address: `0x${(addr).toString(16).toUpperCase()}`, highlight: false });
      addr += 8;
    }
    if (cells.length === 0) return [];
    // Build incremental steps
    return cells.map((_, idx) => ({
      line: idx + 1,
      label: `${cells[idx].type} ${cells[idx].name} = ${cells[idx].value};`,
      variables: cells.slice(0, idx + 1).map((c, ci) => ({ ...c, highlight: ci === idx })),
    }));
  }, [activeTab?.content]);

  // Coding heatmap (last 12 weeks from localStorage)
  const heatmapData=useMemo(()=>{
    const d:number[]=[];const saved=JSON.parse(safeGetItem("cs-heatmap","[]"));
    for(let i=0;i<84;i++)d.push(saved[i]||0);return d;
  },[]);
  useEffect(()=>{
    const today=new Date().getDay()+new Date().getDate();
    const saved=JSON.parse(safeGetItem("cs-heatmap","[]"));
    saved[today%84]=(saved[today%84]||0)+1;
    safeSetItem("cs-heatmap",JSON.stringify(saved));
  },[compileCount]);

  // Achievements
  const achievements=[
    {icon:"1",title:"첫 컴파일",desc:"첫 코드를 컴파일하세요",done:compileCount>=1},
    {icon:"10",title:"10회 컴파일",desc:"10번 컴파일하세요",done:compileCount>=10},
    {icon:"50",title:"50회 컴파일",desc:"50번 컴파일하세요",done:compileCount>=50},
    {icon:"100",title:"100회 컴파일",desc:"100번 컴파일하세요",done:compileCount>=100},
    {icon:"5F",title:"5개 파일",desc:"5개 파일을 만드세요",done:tabCnt>5},
    {icon:"OK",title:"첫 성공",desc:"컴파일 성공 1회",done:history.some(h=>h.status==="success")},
  ];

  // Challenges
  const challenges=[
    {title:"1+1 출력하기",desc:"1+1의 결과를 출력하세요",hint:'printf("%d", 1+1);'},
    {title:"이름 출력하기",desc:"자신의 이름을 출력하세요",hint:'printf("홍길동");'},
    {title:"구구단 2단",desc:"2×1부터 2×9까지 출력",hint:"for(int i=1;i<=9;i++)"},
    {title:"별 삼각형",desc:"*로 삼각형을 그리세요",hint:"이중 for문 사용"},
  ];

  return (
    <div className="cs-ide">
      {/* ── Title Bar ── */}
      <div className="cs-titlebar">
        <div className="cs-titlebar-brand">
          <div className="cs-titlebar-logo"><MI icon="code" s={10} c="#fff"/></div>
          <span className="cs-titlebar-name">C-Studio</span>
          <span style={{color:"#333"}}>·</span>
          <span className="cs-titlebar-file">{activeTab?.name}</span>
        </div>
        <div className="cs-titlebar-actions">
          {(["c","cpp","python","javascript","java"] as const).map(l=>(
            <button key={l} className={`cs-titlebar-btn ${lang===l?"active-btn":""}`} onClick={()=>switchLang(l)}>{LANG_CFG[l].label}</button>
          ))}
          <span style={{width:1,height:12,background:"#222",margin:"0 4px"}}/>
          <button className="cs-titlebar-btn" onClick={()=>setMinimap(p=>!p)} title="미니맵"><MI icon="map" s={12}/></button>
          <button className="cs-titlebar-btn" onClick={()=>setShowRight(p=>!p)} title="우측패널"><MI icon="right_panel_open" s={12}/></button>
        </div>
      </div>

      <div className="cs-body">
        {/* ── Activity Bar ── */}
        <div className="cs-activity-bar">
          <button className={`cs-act-btn ${actPanel==="files"?"active":""}`} onClick={()=>setActPanel(p=>p==="files"?null:"files")} title="탐색기"><MI icon="folder" s={18}/></button>
          <button className={`cs-act-btn ${actPanel==="search"?"active":""}`} onClick={()=>setActPanel(p=>p==="search"?null:"search")} title="검색"><MI icon="search" s={18}/></button>
          <button className={`cs-act-btn ${actPanel==="templates"?"active":""}`} onClick={()=>setActPanel(p=>p==="templates"?null:"templates")} title="템플릿"><MI icon="description" s={18}/></button>
          <button className="cs-act-btn" onClick={()=>setShowStdin(p=>!p)} title="입력"><MI icon="keyboard" s={18}/></button>
          <button className="cs-act-btn" onClick={()=>setShowPalette(true)} title="명령 팔레트"><MI icon="terminal" s={18}/></button>
          <div className="cs-act-spacer"/>
          <button className="cs-act-btn" onClick={()=>window.history.back()} title="돌아가기"><MI icon="arrow_back" s={18}/></button>
        </div>

        {/* ── Side Panel ── */}
        {actPanel&&(
          <div className="cs-panel">
            <div className="cs-panel-header">
              <span>{actPanel==="files"?"탐색기":actPanel==="search"?"검색":"템플릿"}</span>
              <button className="cs-titlebar-btn" onClick={()=>setActPanel(null)}><MI icon="close" s={12}/></button>
            </div>
            <div className="cs-panel-body">
              {actPanel==="files"&&(<>
                <div className="cs-panel-section">
                  <div className="cs-panel-label">열린 파일 <button className="cs-titlebar-btn" onClick={newFile}><MI icon="add" s={12}/></button></div>
                  {tabs.map(t=>(
                    <div key={t.id} className={`cs-file-item ${t.id===activeTabId?"active":""}`} onClick={()=>setActiveTabId(t.id)}>
                      <MI icon={t.lang==="c"?"code":"data_object"} s={13} c={t.lang==="c"?"#6d9fff":"#fbbf24"}/>
                      <span style={{flex:1,fontSize:11}}>{t.name}</span>
                      {t.modified&&<span style={{width:5,height:5,borderRadius:"50%",background:"var(--cs-accent)"}}/>}
                    </div>
                  ))}
                </div>
                <div className="cs-panel-section">
                  <div className="cs-panel-label">통계</div>
                  <div style={{display:"flex",gap:6,padding:"6px 14px"}}>
                    <div className="cs-stat" style={{flex:1}}><div className="cs-stat-val" style={{color:"var(--cs-accent)"}}>{compileCount}</div><div className="cs-stat-label">컴파일</div></div>
                    <div className="cs-stat" style={{flex:1}}><div className="cs-stat-val" style={{color:"var(--cs-green)"}}>{history.filter(h=>h.status==="success").length}</div><div className="cs-stat-label">성공</div></div>
                    <div className="cs-stat" style={{flex:1}}><div className="cs-stat-val" style={{color:"var(--cs-red)"}}>{history.filter(h=>h.status!=="success").length}</div><div className="cs-stat-label">실패</div></div>
                  </div>
                </div>
                <div className="cs-panel-section">
                  <div className="cs-panel-label">최근 기록</div>
                  {history.slice(0,8).map(h=>(
                    <div key={h.id} className="cs-file-item" onClick={()=>{updateCode(h.code);setOutput(h.output);setOutStatus(h.status==="success"?"success":"error");}}>
                      <span style={{fontSize:9,fontWeight:700,padding:"1px 4px",borderRadius:3,background:h.status==="success"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)",color:h.status==="success"?"#4ade80":"#f87171"}}>{h.status==="success"?"✓":"✗"}</span>
                      <span style={{fontSize:10,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{h.code.substring(0,30)}...</span>
                    </div>
                  ))}
                </div>
              </>)}
              {actPanel==="templates"&&(
                <div className="cs-panel-section">
                  <div className="cs-panel-label">{cfg.label} 템플릿</div>
                  {SNIPPETS.filter(s=>s.lang===lang).map(s=>(
                    <div key={s.title} className="cs-file-item" onClick={()=>{updateCode(s.code);setActPanel(null);}}>
                      <MI icon="description" s={13} c="#555"/>
                      <span>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {actPanel==="search"&&(
                <div style={{padding:14}}>
                  <input placeholder="코드에서 검색..." style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #222",background:"#0a0a0a",color:"#c8c8c8",fontSize:12,outline:"none",fontFamily:"'JetBrains Mono',monospace"}}
                    onKeyDown={e=>{if(e.key==="Enter"&&editorRef.current){const ed=editorRef.current;const mdl=ed.getModel();if(mdl){const matches=mdl.findMatches((e.target as HTMLInputElement).value,false,false,false,null,true);if(matches.length>0)ed.setSelection(matches[0].range);}}}}/>
                  <p style={{fontSize:10,color:"#555",marginTop:8}}>Enter로 첫 번째 결과로 이동</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <div className="cs-main">
          <div className="cs-toolbar">
            <motion.button className="cs-tool-btn primary" onClick={runCode} disabled={running||outStatus==="waiting_input"} whileTap={{scale:0.95}}>
              {running?<><motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}><MI icon="sync" s={12} c="#fff"/></motion.span>빌드 중</>:outStatus==="waiting_input"?<><MI icon="keyboard" s={13} c="#fff"/> 입력 대기</>:<><MI icon="play_arrow" s={13} c="#fff"/> Run (F5)</>}
            </motion.button>
            <div className="cs-tool-sep"/>
            <button className="cs-tool-btn" onClick={newFile}><MI icon="note_add" s={12}/> 새 파일</button>
            <button className="cs-tool-btn" onClick={()=>setShowStdin(p=>!p)} title={inputDetected?"코드에 입력 함수 감지됨 — 클릭해서 STDIN 패널 열기":"STDIN 패널 토글"} style={{...(showStdin?{color:"var(--cs-accent)"}:{}),...(inputDetected&&!showStdin?{color:"#fbbf24",boxShadow:"0 0 0 1px rgba(251,191,36,0.4), 0 0 12px rgba(251,191,36,0.25)",animation:"cs-input-pulse 1.6s ease-in-out infinite"}:{})}}><MI icon="keyboard" s={12} c={inputDetected&&!showStdin?"#fbbf24":undefined}/> 입력{inputDetected&&!showStdin&&<span style={{marginLeft:4,fontSize:8,color:"#fbbf24"}}>●</span>}</button>
            <button className="cs-tool-btn" onClick={()=>{setShowRight(true);setRightTab("snippets");}}><MI icon="code" s={12}/> 스니펫</button>
            <button className="cs-tool-btn" onClick={()=>{setShowRight(true);setRightTab("cheatsheet");}}><MI icon="menu_book" s={12}/> 치트시트</button>
            <button className="cs-tool-btn" onClick={()=>{setShowRight(true);setRightTab("memory");}}><MI icon="memory" s={12}/> 메모리</button>
            <div style={{flex:1}}/>
            {/* XP Local UI 제거: Global XPToast가 처리 (피드백 L51) */}
            {execTime!==null&&<span style={{fontSize:10,fontWeight:600,color:"#555",fontFamily:"'JetBrains Mono'"}}>{execTime}ms</span>}
          </div>

          {/* Tabs */}
          <div className="cs-tabs">
            {tabs.map(t=>(
              <button key={t.id} className={`cs-tab ${t.id===activeTabId?"active":""}`} onClick={()=>setActiveTabId(t.id)}>
                <span className="cs-tab-dot" style={{background:t.lang==="c"?"var(--cs-accent)":"var(--cs-yellow)"}}/>
                {t.name}
                {t.modified&&<span style={{color:"var(--cs-accent)",fontSize:12}}>●</span>}
                {tabs.length>1&&<span className="cs-tab-close" onClick={e=>{e.stopPropagation();closeTab(t.id);}}>✕</span>}
              </button>
            ))}
          </div>

          {/* Stdin */}
          <AnimatePresence>{showStdin&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden",borderBottom:"1px solid #1a1a1a",padding:"10px 12px",background:"#050505"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <MI icon="keyboard" s={13} c="var(--cs-accent)"/>
                <span style={{fontSize:10,fontWeight:800,color:"var(--cs-accent)",letterSpacing:0.5}}>STDIN — 프로그램 입력값</span>
                <span style={{fontSize:9,color:"#666",fontWeight:500}}>cin / scanf / input 호출 시 사용</span>
              </div>
              <textarea value={stdin} onChange={e=>setStdin(e.target.value)} placeholder={inputDetected?"여기에 입력값을 한 줄씩 작성하세요. 예: 5 ↵ 홍길동":"여기에 입력값을 작성하면 cin/scanf/input이 받아갑니다"} style={{width:"100%",minHeight:54,padding:10,borderRadius:6,border:`1px solid ${inputDetected?"rgba(251,191,36,0.35)":"#1a1a1a"}`,fontFamily:"'JetBrains Mono'",fontSize:12,outline:"none",resize:"vertical",background:"#000",color:"#c8c8c8",boxShadow:inputDetected?"0 0 0 1px rgba(251,191,36,0.15)":"none"}}/>
              <div style={{fontSize:9,color:"#555",marginTop:4,display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                <span>여러 입력값은 줄바꿈(Enter)으로 구분</span>
                <span>예: <span style={{color:"#888"}}>5</span> ↵ <span style={{color:"#888"}}>홍길동</span></span>
              </div>
            </motion.div>
          )}</AnimatePresence>

          {/* Editor */}
          <div className="cs-editor-area">
            <div className="cs-code-rain">{rainCols.map((c,i)=>(<div key={i} className="cs-code-rain-col" style={{left:c.left,animationDuration:`${c.dur}s`,animationDelay:`${c.delay}s`}}>{c.text}</div>))}</div>
            <Editor height="100%" language={cfg.monaco} value={activeTab?.content||""} onChange={updateCode} onMount={handleMount} theme="cs-black"
              options={{fontSize:14,fontFamily:"'JetBrains Mono','Fira Code','Consolas',monospace",fontLigatures:true,minimap:{enabled:minimap&&!zenMode,maxColumn:60},scrollBeyondLastLine:false,lineNumbers:zenMode?"off":"on",renderLineHighlight:"all",padding:{top:12,bottom:12},automaticLayout:true,tabSize:4,bracketPairColorization:{enabled:true},guides:{bracketPairs:true,indentation:true},cursorBlinking:"expand",cursorSmoothCaretAnimation:"on",smoothScrolling:true,scrollbar:{verticalScrollbarSize:6,horizontalScrollbarSize:6}}}/>
            {running&&<div className="cs-pipeline"><div className="cs-pipeline-bar"/></div>}
          </div>

          {/* Terminal */}
          {showTerminal&&(
            <div className="cs-terminal-area" style={{height:termH}}>
              <div className="cs-terminal-header">
                <div className="cs-terminal-tab active"><MI icon="terminal" s={11}/> 터미널</div>
                <div style={{flex:1}}/>
                <AnimatePresence>{outStatus!=="idle"&&(<motion.span initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} exit={{opacity:0}} style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:12,background:outStatus==="success"?"rgba(74,222,128,0.08)":outStatus==="waiting_input"?"rgba(125,170,255,0.08)":"rgba(248,113,113,0.08)",color:outStatus==="success"?"var(--cs-green)":outStatus==="waiting_input"?"var(--cs-accent)":"var(--cs-red)",display:"flex",alignItems:"center",gap:3}}><span className="cs-status-dot" style={{background:outStatus==="success"?"var(--cs-green)":outStatus==="waiting_input"?"var(--cs-accent)":"var(--cs-red)"}}/>{outStatus==="success"?"SUCCESS":outStatus==="waiting_input"?"INPUT":"ERROR"}</motion.span>)}</AnimatePresence>
                <button className="cs-titlebar-btn" onClick={()=>{setOutput("");setOutStatus("idle");}}><MI icon="delete" s={12}/></button>
                <button className="cs-titlebar-btn" onClick={()=>setShowTerminal(false)}><MI icon="close" s={12}/></button>
              </div>
              <div className="cs-terminal-body" style={{position:"relative"}}>
                <div className="cs-holo-scan"/>
                {running?(<div style={{display:"flex",alignItems:"center",gap:6}}><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} style={{width:10,height:10,border:"2px solid #222",borderTopColor:"var(--cs-accent)",borderRadius:"50%"}}/><span className="cs-terminal-line info">컴파일 중...</span></div>)
                :outStatus==="waiting_input"?(<>
                  <div className="cs-terminal-line" style={{color:"var(--cs-accent)"}}>프로그램이 입력을 기다리고 있습니다...</div>
                  {stdinLines.map((line,i)=>(<div key={i} className="cs-terminal-line"><span style={{color:"#fbbf24"}}>&gt; </span>{line}</div>))}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                    <span style={{color:"#fbbf24",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>&gt;</span>
                    <input ref={stdinInputRef} value={currentInput} onChange={e=>setCurrentInput(e.target.value)} onKeyDown={handleStdinKeyDown} placeholder="입력값 입력 후 Enter (완료: Ctrl+Enter)" autoFocus
                      style={{flex:1,padding:"4px 8px",fontSize:12,fontFamily:"'JetBrains Mono',monospace",background:"#0a0a0a",color:"#c8c8c8",border:"1px solid #222",borderRadius:4,outline:"none",caretColor:"var(--cs-accent)"}}/>
                    <button onClick={submitInteractiveInput} style={{padding:"4px 10px",borderRadius:4,border:"none",background:"var(--cs-accent)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                      <MI icon="send" s={12} c="#fff"/>전송
                    </button>
                  </div>
                </>)
                :output?(<pre style={{margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all"}}><span className="cs-terminal-prompt">{outStatus==="success"?"$ ":"stderr: "}</span><span className={`cs-terminal-line ${outStatus==="error"?"error":""}`}>{output}</span></pre>)
                :(<div className="cs-terminal-line" style={{color:"#555"}}><span className="cs-terminal-prompt">$ </span>코드를 실행하세요 (F5)</div>)}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        {showRight&&(
          <div className="cs-right">
            <div className="cs-right-tabs">
              {(advancedTabs ? RTABS : RTABS_BASIC).map(t=>(<button key={t.id} className={`cs-right-tab ${rightTab===t.id?"active":""}`} onClick={()=>setRightTab(t.id)}><MI icon={t.icon} s={11}/>{t.label}</button>))}
              <button className={`cs-right-tab`} onClick={()=>setAdvancedTabs(p=>!p)} style={{marginLeft:"auto",opacity:0.6}}><MI icon={advancedTabs?"unfold_less":"unfold_more"} s={11}/>{advancedTabs?"접기":"더보기"}</button>
            </div>
            <div className="cs-right-body">
              {rightTab==="snippets"&&SNIPPETS.filter(s=>s.lang===lang).map(s=>(
                <div key={s.title} className="cs-snippet" onClick={()=>updateCode(s.code)}>
                  <div className="cs-snippet-title">{s.title}</div>
                  <div className="cs-snippet-code">{s.code.substring(0,120)}</div>
                </div>
              ))}
              {rightTab==="cheatsheet"&&(CHEATSHEET[lang]||[]).map(sec=>(
                <div key={sec.title} className="cs-right-section">
                  <div className="cs-right-title"><MI icon="menu_book" s={11} c="var(--cs-cyan)"/>{sec.title}</div>
                  {sec.items.map(it=>(<div key={it.k} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}><code style={{color:"var(--cs-accent)",background:"rgba(109,159,255,0.06)",padding:"1px 5px",borderRadius:3,fontSize:10}}>{it.k}</code><span style={{color:"#555",fontSize:10}}>{it.v}</span></div>))}
                </div>
              ))}
              {rightTab==="stats"&&(<>
                <div className="cs-right-section">
                  <div className="cs-right-title"><MI icon="bar_chart" s={11} c="var(--cs-accent)"/>코드 분석</div>
                  {[{l:"언어",v:cfg.label,c:"var(--cs-accent)"},{l:"라인",v:`${lines}`,c:"var(--cs-yellow)"},{l:"크기",v:`${bytes} B`,c:"var(--cs-orange)"},{l:"모드",v:lang,c:"#555"},{l:"총 컴파일",v:`${compileCount}회`,c:"var(--cs-cyan)"},{l:"성공률",v:history.length?`${Math.round(history.filter(h=>h.status==="success").length/history.length*100)}%`:"—",c:"var(--cs-green)"}].map(i=>(<div key={i.l} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}><span style={{color:"#555"}}>{i.l}</span><span style={{color:i.c,fontFamily:"'JetBrains Mono'",fontWeight:600,fontSize:10}}>{i.v}</span></div>))}
                </div>
              </>)}
              {rightTab==="shortcuts"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="keyboard" s={11} c="var(--cs-pink)"/>키보드 단축키</div>{SHORTCUTS.map(s=>(<div key={s.keys} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:10}}><span style={{color:"#555"}}>{s.desc}</span><kbd style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:"#0a0a0a",border:"1px solid #222",color:"#c8c8c8",fontFamily:"'JetBrains Mono'"}}>{s.keys}</kbd></div>))}</div>)}
              {rightTab==="memory"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="memory" s={11} c="var(--cs-cyan)"/>메모리 시각화</div>{memCells.length===0?<p style={{fontSize:10,color:"#555"}}>변수 선언을 감지하면 메모리 맵이 표시됩니다</p>:<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{memCells.map(m=>(<div key={m.name} className="cs-mem-cell"><div className="cs-mem-addr">{m.addr}</div><div className="cs-mem-val">{m.val}</div><div className="cs-mem-name">{m.type} {m.name}</div></div>))}</div>}</div>)}
              {rightTab==="visualizer"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="visibility" s={11} c="var(--cs-accent2)"/>메모리 시각화 (Step)</div>{vizSteps.length===0?<p style={{fontSize:10,color:"#555"}}>C 코드에서 변수 선언(int x = 5; 등)을 감지하면 시각화됩니다</p>:<CodeVisualizer steps={vizSteps}/>}</div>)}
              {rightTab==="achievements"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="emoji_events" s={11} c="var(--cs-yellow)"/>성취</div>{achievements.map(a=>(<div key={a.title} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:6,borderRadius:6,background:a.done?"rgba(74,222,128,0.04)":"var(--cs-surface)",border:`1px solid ${a.done?"rgba(74,222,128,0.15)":"var(--cs-border)"}`,opacity:a.done?1:0.5}}><span style={{fontSize:16}}>{a.icon}</span><div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:a.done?"var(--cs-green)":"#555"}}>{a.title}</div><div style={{fontSize:9,color:"#555"}}>{a.desc}</div></div>{a.done&&<MI icon="check_circle" s={14} c="var(--cs-green)"/>}</div>))}</div>)}
              {rightTab==="heatmap"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="grid_on" s={11} c="var(--cs-green)"/>코딩 히트맵 (12주)</div><div className="cs-heatmap">{heatmapData.map((v,i)=>(<div key={i} className="cs-heatmap-cell" style={{background:v===0?"#0a0a0a":v<3?"rgba(74,222,128,0.15)":v<5?"rgba(74,222,128,0.3)":"rgba(74,222,128,0.5)"}}/>))}</div><p style={{fontSize:9,color:"#555",marginTop:6}}>컴파일할수록 채워집니다</p></div>)}
              {rightTab==="challenge"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="flag" s={11} c="var(--cs-orange)"/>코딩 챌린지</div>{challenges.map(ch=>(<div key={ch.title} className="cs-snippet" onClick={()=>updateCode(`// 챌린지: ${ch.title}\n// ${ch.desc}\n// 힌트: ${ch.hint}\n\n#include <stdio.h>\n\nint main() {\n    // 여기에 코드를 작성하세요\n    \n    return 0;\n}`)}><div className="cs-snippet-title">{ch.title}</div><div style={{fontSize:10,color:"#555"}}>{ch.desc}</div></div>))}</div>)}
              {rightTab==="algo"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="account_tree" s={11} c="var(--cs-accent2)"/>알고리즘 라이브러리</div>{ALGO_LIST.map(a=>(<div key={a.name} className="cs-snippet" onClick={()=>updateCode(a.code)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div className="cs-snippet-title">{a.name}</div><span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:"rgba(167,139,250,0.1)",color:"var(--cs-accent2)",fontFamily:"'JetBrains Mono'"}}>{a.complexity}</span></div><div style={{fontSize:10,color:"#555",marginTop:2}}>{a.desc}</div></div>))}</div>)}
              {rightTab==="execution"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="play_circle" s={11} c="var(--cs-green)"/>실행 추적</div>{output?(<div><p style={{fontSize:10,color:"#555",marginBottom:6}}>마지막 실행 결과:</p><div style={{padding:8,borderRadius:6,background:"var(--cs-surface)",border:"1px solid var(--cs-border)",fontFamily:"'JetBrains Mono'",fontSize:10,color:outStatus==="success"?"var(--cs-green)":"var(--cs-red)",lineHeight:1.6,whiteSpace:"pre-wrap",maxHeight:200,overflow:"auto"}}>{output}</div>{execTime&&<div style={{marginTop:6,fontSize:9,color:"#555"}}>실행 시간: {execTime}ms</div>}</div>):<p style={{fontSize:10,color:"#555"}}>코드를 실행하면 결과가 여기에 표시됩니다</p>}</div>)}
              {rightTab==="bookmarks"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="bookmark" s={11} c="var(--cs-yellow)"/>북마크 (Ctrl+B)</div>{bookmarks.length===0?<p style={{fontSize:10,color:"#555"}}>에디터에서 Ctrl+B로 북마크 추가</p>:bookmarks.map(b=>(<div key={b.ln} className="cs-snippet" onClick={()=>{if(editorRef.current)editorRef.current.revealLineInCenter(b.ln);}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"var(--cs-yellow)"}}>Ln {b.ln}</span><button onClick={e=>{e.stopPropagation();setBookmarks(p=>p.filter(x=>x.ln!==b.ln));}} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:10}}>✕</button></div><div style={{fontSize:9,color:"#555",fontFamily:"'JetBrains Mono'",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.text}</div></div>))}</div>)}
              {rightTab==="review"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="rate_review" s={11} c="var(--cs-cyan)"/>코드 리뷰</div>{(()=>{const code=activeTab?.content||"";const issues:{type:string;msg:string;color:string}[]=[];if(code.includes("gets("))issues.push({type:"⚠",msg:"gets()는 보안 취약 → fgets() 권장",color:"var(--cs-red)"});if(!code.includes("free")&&code.includes("malloc"))issues.push({type:"⚠",msg:"malloc 후 free 누락 의심",color:"var(--cs-yellow)"});if(code.includes("// TODO")||code.includes("// FIXME"))issues.push({type:"ℹ",msg:"TODO/FIXME 주석 발견",color:"var(--cs-accent)"});if(code.split("\n").some(l=>l.length>120))issues.push({type:"!",msg:"120자 이상 긴 줄 존재",color:"var(--cs-orange)"});if(issues.length===0)issues.push({type:"OK",msg:"특이사항 없음",color:"var(--cs-green)"});return issues.map((iss,i)=>(<div key={i} style={{display:"flex",gap:6,padding:"6px 8px",borderRadius:6,background:"var(--cs-surface)",border:"1px solid var(--cs-border)",marginBottom:4}}><span>{iss.type}</span><span style={{fontSize:10,color:iss.color}}>{iss.msg}</span></div>));})()}</div>)}
              {rightTab==="focus"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="center_focus_strong" s={11} c="var(--cs-pink)"/>집중 모드</div><p style={{fontSize:10,color:"#555",marginBottom:8}}>Zen 모드로 전환하면 에디터만 표시됩니다</p><button onClick={()=>{setZenMode(p=>!p);if(!zenMode){setActPanel(null);setShowRight(false);setShowTerminal(false);}else{setActPanel("files");setShowRight(true);setShowTerminal(true);}}} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:"1px solid var(--cs-border)",background:zenMode?"rgba(244,114,182,0.1)":"var(--cs-surface)",color:zenMode?"var(--cs-pink)":"var(--cs-text)",cursor:"pointer",fontSize:11,fontWeight:700}}>{zenMode?"Zen 모드 해제":"Zen 모드 시작"}</button><div style={{marginTop:12}}><p style={{fontSize:10,color:"#555",marginBottom:4}}>타이핑 효과음</p><button onClick={()=>setTypingSound(p=>!p)} style={{padding:"6px 10px",borderRadius:4,border:"1px solid var(--cs-border)",background:typingSound?"rgba(74,222,128,0.1)":"var(--cs-surface)",color:typingSound?"var(--cs-green)":"#555",cursor:"pointer",fontSize:10}}>{typingSound?"ON":"OFF"}</button></div></div>)}
              {rightTab==="notifications"&&(<div className="cs-right-section"><div className="cs-right-title"><MI icon="notifications" s={11} c="var(--cs-accent)"/>알림 센터</div>{notifications.length===0?<p style={{fontSize:10,color:"#555"}}>알림이 없습니다</p>:notifications.map(n=>(<div key={n.id} style={{padding:6,borderRadius:6,background:"var(--cs-surface)",border:"1px solid var(--cs-border)",marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:n.type==="success"?"var(--cs-green)":n.type==="error"?"var(--cs-red)":"var(--cs-accent)",fontWeight:700}}>{n.type.toUpperCase()}</span><span style={{color:"#555"}}>{n.time}</span></div><div style={{fontSize:10,color:"var(--cs-text)",marginTop:2}}>{n.msg}</div></div>))}</div>)}
            </div>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div className="cs-statusbar">
        <div className="cs-status-group">
          <div className="cs-status-item"><span className="cs-status-dot cs-pulse" style={{background:running?"var(--cs-yellow)":outStatus==="error"?"var(--cs-red)":"var(--cs-green)"}}/>{running?"Building":outStatus==="error"?"Error":"Ready"}</div>
          {outStatus!=="idle"&&<div className="cs-status-item" style={{color:outStatus==="success"?"var(--cs-green)":"var(--cs-red)"}}>{outStatus==="success"?"✓ 0 errors":"✗ errors"}</div>}
        </div>
        <div className="cs-status-group">
          <div className="cs-status-item">Ln {cursorPos.ln}, Col {cursorPos.col}</div>
          <div className="cs-status-item">Spaces: 4</div>
          <div className="cs-status-item">{cfg.label}</div>
          <div className="cs-status-item">UTF-8</div>
          <div className="cs-status-item clickable" onClick={()=>setMinimap(p=>!p)}>{minimap?"⊞":"⊟"}</div>
          <div className="cs-status-item">Godbolt</div>
          <div className="cs-status-item" style={{fontWeight:700}}>C-Studio</div>
        </div>
      </div>

      {/* Particles */}
      {particles.map(p=>(<div key={p.id} className="cs-particle" style={{left:`${p.x}%`,top:`${p.y}%`,background:p.color,"--px":`${(Math.random()-0.5)*80}px`,"--py":`${(Math.random()-0.5)*80}px`} as React.CSSProperties}/>))}

      {/* Command Palette */}
      <AnimatePresence>{showPalette&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowPalette(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",justifyContent:"center",paddingTop:60}}>
          <motion.div initial={{y:-16,scale:0.96}} animate={{y:0,scale:1}} exit={{y:-16,scale:0.96}} onClick={e=>e.stopPropagation()} style={{width:480,maxHeight:360,background:"#0a0a0a",border:"1px solid #222",borderRadius:10,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.8)"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",gap:6}}><MI icon="search" s={14} c="#555"/><span style={{fontSize:11,color:"#555"}}>명령어를 입력하세요...</span></div>
            <div style={{padding:6}}>
              {[{l:"실행 (F5)",a:()=>{runCode();setShowPalette(false);}},{l:"+ 새 파일",a:()=>{newFile();setShowPalette(false);}},{l:"터미널 토글",a:()=>{setShowTerminal(p=>!p);setShowPalette(false);}},{l:"사이드바 토글",a:()=>{setActPanel(p=>p?null:"files");setShowPalette(false);}},{l:"메모리 시각화",a:()=>{setShowRight(true);setRightTab("memory");setShowPalette(false);}},{l:"성취",a:()=>{setShowRight(true);setRightTab("achievements");setShowPalette(false);}},{l:"통계",a:()=>{setShowRight(true);setRightTab("stats");setShowPalette(false);}},{l:"챌린지",a:()=>{setShowRight(true);setRightTab("challenge");setShowPalette(false);}}].map(cmd=>(
                <button key={cmd.l} onClick={cmd.a} style={{width:"100%",padding:"7px 10px",border:"none",borderRadius:5,background:"transparent",color:"#c8c8c8",cursor:"pointer",textAlign:"left",fontSize:11,transition:"background 0.1s"}} onMouseEnter={e=>(e.currentTarget.style.background="#1a1a1a")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>{cmd.l}</button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* AI 튜터 — Smart Context */}
      <AITutor
        context={`${cfg.label} 코드 작성 중${activeTab?.name ? ` (${activeTab.name})` : ""}`}
        currentLanguage={lang}
        getCurrentCode={() => activeTab?.content || ""}
        getCurrentError={() => outStatus === "error" ? output : ""}
      />
    </div>
  );
}
