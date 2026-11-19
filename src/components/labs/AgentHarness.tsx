"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { fmt } from "@/i18n";
import { useLang } from "@/i18n/client";

/* Agent Harness 核心循环：左边一段真实的 Claude Agent SDK 代码，右边一圈
 * 循环的流程图。点节点（或下方步骤条）→ 对应代码行高亮 + 详解切换；
 * 「播放一遍」按 1→…→6→（回环）2→…→6→7 的顺序自动走完。
 * 内容为中文课文（本课暂无 en.yaml，英文页按全站规则回退中文）。 */

const CODE = String.raw`import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { appendFile } from "node:fs/promises";

// 定义一个自定义工具：把学习笔记追加写进文件
const notesServer = createSdkMcpServer({
  name: "notes",
  version: "1.0.0",
  tools: [
    tool(
      "save_note",
      "把一条学习笔记保存到 notes.md",
      { text: z.string().describe("要保存的笔记内容") },
      async ({ text }) => {
        await appendFile("notes.md", text + "\n");
        return { content: [{ type: "text", text: "已保存" }] };
      }
    ),
  ],
});

// 启动一次任务：harness 的控制循环就跑在这个 query 里面
for await (const message of query({
  prompt: "读 src 目录，总结项目架构，把结论存成一条笔记",
  options: {
    model: "claude-sonnet-4-5",
    systemPrompt: "你是代码阅读助手，用中文回答。",
    permissionMode: "default",
    allowedTools: ["Read", "Glob", "mcp__notes__save_note"],
    maxTurns: 12,
    mcpServers: { notes: notesServer },
    canUseTool: async (toolName, input) => {
      if (toolName === "Bash") {
        return { behavior: "deny", message: "这个任务不许执行命令" };
      }
      return { behavior: "allow", updatedInput: input };
    },
  },
})) {
  // 模型每走一步，这里就收到一条消息
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if (block.type === "text") console.log("模型说:", block.text);
      if (block.type === "tool_use") console.log("模型想调用:", block.name);
    }
  }
  // 循环结束时，会收到一条 result 消息
  if (message.type === "result") {
    console.log("任务结束:", message.subtype, "总轮次:", message.num_turns);
  }
}`;
const CODE_LINES = CODE.split("\n");

type Stage = { title: string; ranges: [number, number][]; text: string };
const STAGES: Stage[] = [
  {
    title: "组装上下文",
    ranges: [[5, 20], [24, 31]],
    text: "先想一个画面：你按下回车的那一瞬间，harness 要在几毫秒里备齐一份简报——模型是谁（systemPrompt）、手边有哪些工具（包括代码上方用 tool() 定义的 save_note）、这次的任务是什么（prompt）、之前说过什么（历史消息）。这一步就叫组装上下文：把散落的信息打包成模型一次能读懂的格式。代价是上下文窗口有限，塞得越多越费钱，也越容易让模型抓不住重点，所以放什么进去必须挑。Claude Agent SDK 里，你写在 options 里的 systemPrompt、mcpServers 和工具定义，就是在替 harness 准备这份简报里固定的那一部分。",
  },
  {
    title: "调用模型",
    ranges: [[23, 26]],
    text: "简报备齐，harness 就把它通过 API 发给 options.model 指定的模型，然后等回复。这一步只是“问”：模型只返回文字，它碰不到你的硬盘，也执行不了任何命令。它的代价是时间和钱——每问一次就是一次 API 计费，这也是循环轮数必须设上限的原因之一。Claude Code 每次显示“思考中”，背后就是 harness 在发起这样一次调用。",
  },
  {
    title: "模型决策",
    ranges: [[41, 44]],
    text: "模型看完简报，只做一个二选一的决定：直接回一段文字，或者返回一个 tool_use 请求，意思是“请替我读一下这个文件”。注意它只能提请求，不能自己动手——这是整个 harness 的安全底线。这一步决定循环怎么走：只要模型还在发 tool_use，循环就继续；它不再要工具、只回文字，一般就说明任务快完成了。左边代码里 block.type 是 text 还是 tool_use，区分的正是这两种东西。",
  },
  {
    title: "权限检查",
    ranges: [[28, 29], [32, 37]],
    text: "模型提出请求后，harness 不会照单全收，而是先过安检：这个工具在 allowedTools 白名单里吗？permissionMode 设的是哪一档？如果配了 canUseTool 回调，还要再问它一次——左边代码里的回调就明确把 Bash 拒了。被拦下的请求会变成一条“不允许”的结果返回给模型，模型只能换个做法。这一步是 harness 存在的头号理由：模型再聪明也是个外人，不能让它对你的机器有无限权限。你在 Claude Code 里见过的“是否允许执行这条命令？”弹窗，就是这一步在向你本人请示。",
  },
  {
    title: "执行工具",
    ranges: [[10, 18]],
    text: "通过安检，harness 才真的动手。内置工具由 SDK 执行：Read 去读文件、Glob 去找文件；自定义工具则运行你写的处理函数——比如 save_note 的函数真的把笔记追加写进了 notes.md。执行结果可能是文件内容，也可能是一条报错，两种都会被 harness 原样收好。这一步是整个循环里唯一会改变真实世界的环节，所以工具的副作用要由写工具的人负责：文件写错了地方，锅在工具实现，不在模型。",
  },
  {
    title: "结果回填",
    ranges: [[23, 23], [40, 41]],
    text: "工具跑完，harness 把结果包成一条 tool_result 消息，追加到对话历史的末尾，然后带着变长了的历史回到第 1 步，重新组装、再问模型一次。模型正是靠读这些回填的结果，才知道文件里写了什么、上一步成没成功，进而决定下一步做什么。这个“问一次、做一次、把结果喂回去”的往返，就是 agent 循环的心跳。在 Claude Agent SDK 里这一步是自动完成的：你代码里的 for await 每多转一圈，就说明 harness 已经完成了一次回填，并拿到了模型的新回复。",
  },
  {
    title: "终止与交付",
    ranges: [[30, 30], [47, 50]],
    text: "循环不能无限转下去，它有两个出口。第一个是正常出口：模型不再请求工具、给出最终答复，SDK 发来一条 result 消息，subtype 是 success，你的程序把最终文本交付给用户。第二个是强制出口：options.maxTurns 设了轮次上限（这里是 12 轮），先耗完就立刻停，result 里会标明是被轮次截断的。maxTurns 看着是个不起眼的参数，其实是防止 agent 卡在死循环里一直烧 API 费用的保险丝，Claude Code 里也有同样的机制。",
  },
];
/** 图内节点副标题（框宽有限，用比详解更短的版本）。 */
const DSUB = ["打包给模型看的简报", "把简报发出去，等回复", "回话，还是要工具",
  "先过安检再放行", "真的去读写文件", "结果追加进历史", "交出答复，或被叫停"];

/* ---------- 极简语法高亮（与样板页同一套规则，只作用于这段静态示例代码） ---------- */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const KEYWORDS = new Set(["import", "from", "const", "let", "var", "async", "await",
  "for", "of", "if", "else", "return", "new", "function", "in"]);
function highlight(src: string): string {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i]!;
    if (c === "/" && src[i + 1] === "/") {
      out += '<span class="htk-cm">' + esc(src.slice(i)) + "</span>";
      break;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === "\\") j++; j++; }
      j = Math.min(j + 1, n);
      out += '<span class="htk-str">' + esc(src.slice(i, j)) + "</span>";
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9.]/.test(src[j]!)) j++;
      out += '<span class="htk-num">' + esc(src.slice(i, j)) + "</span>";
      i = j; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(src[j]!)) j++;
      const w = src.slice(i, j);
      let cls = "";
      if (KEYWORDS.has(w)) cls = "htk-kw";
      else if (/^[A-Z]/.test(w)) cls = "htk-type";
      else {
        let k = j;
        while (k < n && src[k] === " ") k++;
        if (src[k] === "(") cls = "htk-fn";
      }
      out += cls ? '<span class="' + cls + '">' + esc(w) + "</span>" : esc(w);
      i = j; continue;
    }
    out += esc(c); i++;
  }
  return out;
}
const LINE_HTML = CODE_LINES.map((l) => highlight(l));

/* ---------- 流程图布局（与样板页同一套坐标） ---------- */
const BOX_X = 35, BOX_W = 190, BOX_H = 50, BCX = BOX_X + BOX_W / 2;
const BOX_Y: (number | null)[] = [8, 78, null, 248, 318, 388, 478];
const DIA = { cx: 130, cy: 186, top: 146, bottom: 226, left: 28, right: 232 };

/** 播放序列：先走 1–6，再沿回环走 2–6（第二圈），最后到 7 停下。 */
const SEQ = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6];
const STEP_MS = 2000;

type PlayState = "idle" | "playing" | "paused" | "done";

export default function AgentHarness() {
  const { s } = useLang();
  const [current, setCurrent] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [loopFlash, setLoopFlash] = useState(false);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<number | null>(null);
  const flashRef = useRef<number | null>(null);
  const posRef = useRef(-1);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (flashRef.current) window.clearTimeout(flashRef.current);
    };
  }, []);

  const inRanges = (lineNo: number, ranges: [number, number][]) =>
    ranges.some(([a, b]) => lineNo >= a && lineNo <= b);
  const rangesText = (ranges: [number, number][]) =>
    ranges.map(([a, b]) => (a === b ? `第 ${a} 行` : `第 ${a}–${b} 行`)).join(" · ");

  const selectStage = (idx: number, scroll: boolean) => {
    setCurrent(idx);
    if (!scroll) return;
    const stage = STAGES[idx]!;
    const first = CODE_LINES.findIndex((_, i) => inRanges(i + 1, stage.ranges));
    const el = first >= 0 ? lineRefs.current[first] : null;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "center", behavior: reducedRef.current ? "auto" : "smooth" });
      });
    }
  };

  const stopPlay = () => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (playState === "playing" || playState === "paused") {
      setPlayState("idle");
      posRef.current = -1;
      setPlayingIdx(-1);
    }
  };

  const showPlayStep = (pos: number) => {
    const idx = SEQ[pos]!;
    // 从第 6 步跳回第 2 步时，让回环箭头闪一下，眼睛能跟上这趟回程。
    if (pos > 0 && SEQ[pos - 1] === 5 && idx === 1) {
      setLoopFlash(true);
      if (flashRef.current) window.clearTimeout(flashRef.current);
      flashRef.current = window.setTimeout(() => setLoopFlash(false), 1100);
    }
    selectStage(idx, true);
    setPlayingIdx(idx);
  };

  const scheduleNext = () => {
    timerRef.current = window.setTimeout(() => {
      const nextPos = posRef.current + 1;
      if (nextPos >= SEQ.length) {
        timerRef.current = null;
        posRef.current = -1;
        setPlayingIdx(-1);
        setPlayState("done");
        return;
      }
      posRef.current = nextPos;
      showPlayStep(nextPos);
      scheduleNext();
    }, STEP_MS);
  };

  const onPlayClick = () => {
    if (playState === "playing") {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
      setPlayingIdx(-1);
      setPlayState("paused");
      return;
    }
    if (playState === "paused") {
      setPlayState("playing");
      setPlayingIdx(SEQ[posRef.current]!);
      scheduleNext();
      return;
    }
    // idle 或 done：从第一步重新开始
    setPlayState("playing");
    posRef.current = 0;
    showPlayStep(0);
    scheduleNext();
  };

  const jumpTo = (idx: number) => { stopPlay(); selectStage(idx, true); };

  const playLabel = playState === "playing" ? s.labHarnessPause
    : playState === "paused" ? s.labHarnessResume
    : playState === "done" ? s.labHarnessReplay
    : s.labHarnessPlay;

  const stage = STAGES[current]!;

  const nodeProps = (idx: number) => ({
    className: "harness-fnode" + (idx === current ? " active" : "") + (idx === playingIdx ? " playing" : ""),
    tabIndex: 0,
    role: "button" as const,
    "aria-label": fmt(s.labHarnessStageAria, { n: idx + 1, title: STAGES[idx]!.title }),
    onClick: () => jumpTo(idx),
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpTo(idx); }
    },
  });

  return (
    <div className="harness-lab">
      <div className="harness-layout">
        <section className="harness-code-panel" aria-label="示例代码">
          <div className="harness-code-head"><span className="harness-dot" />{s.labHarnessCodeHead}</div>
          <div className="harness-code">
            {CODE_LINES.map((line, i) => (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={"harness-line" + (inRanges(i + 1, stage.ranges) ? " hl" : "")}
              >
                <span className="no">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: LINE_HTML[i] || " " }} />
              </div>
            ))}
          </div>
        </section>

        <aside className="harness-flow-panel" aria-label="循环流程图">
          <h3 className="harness-flow-title">{s.labHarnessFlowTitle}</h3>
          <button type="button" className="harness-play" onClick={onPlayClick}>{playLabel}</button>
          <svg className="harness-svg" viewBox="0 0 360 544" role="img" aria-label={s.labHarnessFlowAria}>
            <defs>
              <marker id="hMkGrey" viewBox="0 0 10 10" refX={8.5} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" style={{ fill: "var(--neutral)" }} />
              </marker>
              <marker id="hMkAccent" viewBox="0 0 10 10" refX={8.5} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" style={{ fill: "var(--active)" }} />
              </marker>
            </defs>
            {/* 连接线（先画，压在节点下面） */}
            <line x1={BCX} y1={58} x2={BCX} y2={75} className="harness-arrow" markerEnd="url(#hMkGrey)" />
            <line x1={BCX} y1={128} x2={BCX} y2={143} className="harness-arrow" markerEnd="url(#hMkGrey)" />
            <line x1={BCX} y1={DIA.bottom} x2={BCX} y2={245} className="harness-arrow" markerEnd="url(#hMkGrey)" />
            <text x={141} y={240} className="harness-flow-label">要调工具</text>
            <line x1={BCX} y1={298} x2={BCX} y2={315} className="harness-arrow" markerEnd="url(#hMkGrey)" />
            <line x1={BCX} y1={368} x2={BCX} y2={385} className="harness-arrow" markerEnd="url(#hMkGrey)" />
            <path d="M225 413 L272 413 L272 103 L229 103" className={"harness-loop" + (loopFlash ? " flash" : "")} markerEnd="url(#hMkAccent)" />
            <text x={265} y={258} className="harness-loop-label" textAnchor="middle" transform="rotate(-90 265 258)">带着新上下文再问一轮</text>
            <path d={`M${DIA.right} 186 L324 186 L324 503 L229 503`} className="harness-branch" markerEnd="url(#hMkGrey)" />
            <text x={278} y={175} className="harness-flow-label" textAnchor="middle">直接回答</text>

            {STAGES.map((st, idx) => {
              if (idx === 2) {
                const pts = `${DIA.cx},${DIA.top} ${DIA.right},${DIA.cy} ${DIA.cx},${DIA.bottom} ${DIA.left},${DIA.cy}`;
                return (
                  <g key={idx} {...nodeProps(idx)}>
                    <polygon points={pts} className="shape" />
                    <circle cx={DIA.cx} cy={DIA.cy - 24} r={10.5} className="fnum" />
                    <text x={DIA.cx} y={DIA.cy - 20} className="fnum-t small" textAnchor="middle">3</text>
                    <text x={DIA.cx} y={DIA.cy + 5} className="ft" textAnchor="middle">{st.title}</text>
                    <text x={DIA.cx} y={DIA.cy + 21} className="fs" textAnchor="middle">{DSUB[idx]}</text>
                  </g>
                );
              }
              const y = BOX_Y[idx]!, cy = y + BOX_H / 2;
              return (
                <g key={idx} {...nodeProps(idx)}>
                  <rect x={BOX_X} y={y} width={BOX_W} height={BOX_H} rx={10} className="shape" />
                  <circle cx={BOX_X + 22} cy={cy} r={13} className="fnum" />
                  <text x={BOX_X + 22} y={cy + 4.5} className="fnum-t" textAnchor="middle">{idx + 1}</text>
                  <text x={BOX_X + 44} y={cy - 1} className="ft">{st.title}</text>
                  <text x={BOX_X + 44} y={cy + 15} className="fs">{DSUB[idx]}</text>
                </g>
              );
            })}
          </svg>
          <p className="harness-loop-note">{s.labHarnessLoopNote}</p>
        </aside>
      </div>

      <div className="harness-detail">
        <div className="harness-chips">
          {STAGES.map((st, idx) => (
            <button
              key={idx}
              type="button"
              className={"harness-chip" + (idx === current ? " active" : "")}
              onClick={() => jumpTo(idx)}
            >
              {idx + 1} {st.title}
            </button>
          ))}
        </div>
        <h3 className="harness-detail-title">
          <span className="stepno">{fmt(s.labHarnessStepOf, { n: current + 1 })}</span> · {stage.title}
        </h3>
        <p className="harness-detail-text">{stage.text}</p>
        <p className="harness-detail-lines">{fmt(s.labHarnessDetailLines, { lines: rangesText(stage.ranges) })}</p>
      </div>
    </div>
  );
}
