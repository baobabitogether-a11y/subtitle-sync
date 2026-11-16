# Token Economy Architecture & Task Decomposition Protocol (tokens.md)

This document establishes the lightweight, high-efficiency operational protocol for maximizing token usage efficiency across all prompts and automated agent execution cycles without heavy processing overhead.

---

## 1. The Token Economy Problem: Why Big Tasks Fail

In complex full-stack applications, processing broad or monolithic tasks directly in a single sprawling execution pass leads to critical failure modes:

1. **Context Bloat & Token Exhaustion**: Loading massive files (`src/routes/index.tsx`, `docs/done.md`, `prompt_history.md`), long task histories in active tracking files, and sprawling outputs rapidly burns context windows.
2. **Abrupt Execution Termination (Zero-Change Timeout)**: Spending too many turns reading full files before writing code exhausts tokens mid-turn, ending with zero saved changes.
3. **Compound Regression Cascades**: Changing multiple distinct subsystems simultaneously makes diagnosis expensive in tokens.
4. **Waste of Prior Token Expenditure**: Without per-sub-task git commits and immediate `docs/done.md` migration, any interruption loses progress.

---

## 2. The Core Principle: Granular Decomposition Maximizes Token Efficiency

Current task state is maintained in `current-sub-task.md`; this protocol contains no task history.

> **Golden Rule**: **Always break every user prompt into small, isolated sub-tasks (max 1–2 files / 1 testable behavior each) and stage `current-sub-task.md` on every step.**

- **Token Input is Minimized**: Never read monolithic files in full; use targeted `grep` + <=150-line slices strictly relevant to the active sub-task.
- **Write-Early Checkpointed Execution**: Move from targeted lookup (max 1–2 discovery rounds) straight to the first atomic edit + focused verification.
- **Progress is Checkpointed**: Every single completed sub-task is immediately committed (`git commit` + `docs/git.md`) and moved out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md` before starting the next sub-task.
- **Zero Completed History in Active Files**: Never accumulate `Completed:` lists inside `current-sub-task.md`, `docs/todo.md`, `docs/tasks.md`, or `docs/tokens.md`.
- **Rules & Configuration Economy**: Keep `AGENTS.md` lean (< 21,000 bytes) to prevent platform rule truncation. Detailed optimization guidelines live in [`docs/suggestions.md`](suggestions.md).

---

## 3. Mandatory Task Management File Protocol

To guarantee token economy without heavy processing, maintain the following files on **every single prompt**:

| File                        | Purpose                                                                                                                                            | Retention               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| `docs/tokens.md`            | Protocol specification defining the token economy and task decomposition rules.                                                                    | Permanent specification |
| `docs/tasks.md`             | Master backlog of active, pending, and upcoming numbered tasks and sub-tasks across the project. Completed items are migrated to `docs/done.md`.   | Active backlog          |
| `docs/tasks-index.md`       | High-level index of project milestones and links to backlog & completed archives.                                                                  | Permanent index         |
| `current-sub-task.md`       | **Strictly focused staging of ONLY the single active/held sub-task.** Zero completed-task dumps.                                                   | Active state indicator  |
| `temp.md`                   | **Ephemeral scratchpad** for drafting file edits, temporary checklists, raw diffs, or intermediate calculations. Avoids cluttering permanent docs. | Ephemeral / Scratchpad  |
| `docs/todo.md`              | Lean active sub-task synchronization mirror (no completed history).                                                                                | Single active task      |
| `docs/done.md`              | Permanent verified changelog and archive of all completed tasks and sub-tasks.                                                                     | Permanent archive / log |
| `docs/self-verification.md` | Comprehensive self-verification protocol for automated test execution, screencast linking in README, and full sanity check audits.                 | Permanent specification |
| `docs/suggestions.md`       | Ranked optimization steps, feasibility analysis, and rule size monitoring guidelines for instruction files.                                        | Permanent specification |

---

## 4. Step-by-Step Prompt Execution Flow

```
[Prompt Received] ──► 1. Process tokens.md (lean preface, no history)
        │
        ▼
2. Decompose prompt into small atomic sub-tasks (<=1-2 files each) in docs/tasks.md
        │
        ▼
3. Stage single active sub-task in current-sub-task.md & docs/todo.md
        │
        ▼
4. Targeted grep/slice read -> implement ONLY the active sub-task early
        │
        ▼
5. Run dedicated sub-task test (+ compile_applet, lint_applet on code changes)
        │
        ▼
6. Git commit checkpoint + log in docs/git.md + attempt git push
        │
        ▼
7. Immediately move completed sub-task to docs/done.md (keep tasks.md/todo.md/current-sub-task.md clean)
        │
        ▼
   More sub-tasks? ──► [YES] ──► Advance current-sub-task.md
        │ [NO]
        ▼
8. Prompt Completion Audit Gate: Verify EVERY task & subtask is complete & tested; clean temp.md
```

### Recovery After an Interrupted Session

- On resumption, read `AGENTS.md`'s `## Resume after interruption` section first, then inspect `current-sub-task.md`, `docs/todo.md`, and the active entries in `docs/tasks.md`.
- Treat `git status` and the relevant `git diff` as authoritative evidence of uncommitted work. Preserve existing edits; do not reset, overwrite, or assume they are complete.
- Record the exact next action, validation still needed, and any blockers in `current-sub-task.md` before continuing.
- Do not resume an item already marked complete in `docs/done.md`; reconcile stale backlog entries before selecting the next task.
- Update `AGENTS.md`'s `## Last raw prompt` only with the exact latest user message.

### Protocol Requirements:

- **Activate Token Economy on Prompt Entry**: Acknowledge `tokens.md` as an ultra-fast preface; never begin un-staged source edits.
- **Atomic Sub-tasks in Backlog**: Numbered sub-tasks belong in `docs/tasks.md` (max 1–2 files / 1 single behavior per sub-task).
- **Numbered Prompt Routing**: Create one ordered backlog task per numbered user item; put explicitly deferred items only in the Later Tasks sections, and stage the earliest active item before implementation.
- **Requested Commit/Push**: Commit and log in `docs/git.md` after every sub-task; push safely when configured without rewriting published history.
- **Stage `current-sub-task.md`**: Focus exclusively on the active sub-task.
- **Move to done.md and Cycle**: Move the completed subtask/task completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md` immediately upon sub-task completion; keep `docs/tasks.md` strictly as the active backlog of pending and upcoming items.
- **Prompt Completion Audit Gate**: Before completing any prompt, verify that EVERY task and subtask planned for the prompt has been fully implemented, tested with a dedicated test, marked complete `[x]`, and recorded in `docs/done.md`.

---

## 5. Hotfix Workflow: Keeping Active Tasks on Hold

When an unexpected defect, broken build, regression, or failing CI flow arises during active development:

1. **SUSPEND ACTIVE TASK**: Place the active task/sub-task in `current-sub-task.md` **ON HOLD** (marked `[ON HOLD]`).
2. **STAGE HOTFIX**: Create `Hotfix: <issue>` in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
3. **EXECUTE IN ISOLATION**: Implement minimal targeted fix, verify with dedicated test, compile, and lint.
4. **COMMIT & MIGRATE**: Commit checkpoint (`fix(hotfix): <description>`), log in `docs/git.md`, attempt push, and move hotfix out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md` under `### Hotfix: <issue>`.
5. **RESUME SUSPENDED TASK**: Restore held subtask to active status in `current-sub-task.md` and resume execution.

---

## 6. Token Optimization Guidelines

- **Smart Read-Before-Write**: Never view monolithic files (`src/routes/index.tsx`, `docs/done.md`, `prompt_history.md`) in full; use `grep` + targeted <=150-line slices.
- **One Sub-Task at a Time**: Never combine multiple unverified features.
- **Write-Early Budget**: Start edits within 1–2 targeted read rounds so token limits never terminate a turn with zero changes saved.
- **Default Mode Coverage**: Follow [`AGENTS.md`](../AGENTS.md): unless explicitly scoped otherwise, apply behavior and settings changes to Beginner and Advanced modes and test both.
- **Fail Fast, Fix Fast**: Diagnose issues locally within the active subtask scope.
- **Precedence**: This lightweight workflow governs agent task execution across all prompts.

---

## 7. Zero Task Overhead & Task Index Delegation

- **No Historical Task Logs in tokens.md**: `docs/tokens.md` strictly defines the operational efficiency protocol and contains zero task logs.
- **Delegation to tasks.md & tasks-index.md**:
  - Active prompt backlog is staged exclusively in [`docs/tasks.md`](tasks.md).
  - High-level project milestones are indexed in [`docs/tasks-index.md`](tasks-index.md).
  - Permanent completed archives reside exclusively in [`docs/done.md`](done.md).
- **Fast Agent Overview**: The agent reviews this concise specification in seconds using minimal tokens before jumping into action.
