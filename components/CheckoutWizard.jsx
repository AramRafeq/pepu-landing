import useTranslation from "next-translate/useTranslation";
import C from "~/styles/checkout.module.css";
import { TbCreditCard, TbHeartHandshake, TbHelp } from "react-icons/tb";
import { Btn, CheckIcon } from "~/components/CheckoutUi";

/** The grades the shop sells, highest first (the plans need sign-in to load). */
const GRADES = [12, 11, 10, 9, 8, 7];

export const PAYERS = ["me", "parent", "unsure"];

/** One icon per way to pay, the same on the question and on the pay buttons. */
const PAYER_ICON = { me: TbCreditCard, parent: TbHeartHandshake, unsure: TbHelp };

const toKu = (n, lang) => (lang === "en" ? String(n) : String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]));

/**
 * Where the wizard is. `answers` is `{ grade, payer, editing, browse }`:
 * `editing` names an answer being changed ("grade" | "payer"), so changing
 * one answer never throws the other away, and finishing the change returns
 * straight to the plan.
 */
export const wizardStage = (a) =>
  a.editing || (a.grade == null ? "grade" : a.payer == null ? "payer" : "done");

/** Opens one answer for changing; the other answers stay. */
export const editAnswer = (a, field) => ({ ...a, editing: field, browse: false });

/**
 * The three steps as tappable pills: any step already reached can be jumped
 * back to, the current one is filled.
 */
function WizardSteps({ answers, onChange }) {
  const { t } = useTranslation("subscribe");
  const stage = wizardStage(answers);
  const steps = [
    { key: "grade", label: t("xStepGrade"), reachable: true },
    { key: "payer", label: t("xStepPayer"), reachable: answers.grade != null },
    { key: "done", label: t("xStepPlan"), reachable: answers.grade != null && answers.payer != null },
  ];
  const go = (key) => onChange(key === "done" ? { ...answers, editing: null } : editAnswer(answers, key));
  return (
    <ol className={C.wizardSteps}>
      {steps.map((s, i) => (
        <li key={s.key}>
          <button type="button" disabled={!s.reachable || stage === s.key} onClick={() => go(s.key)}
                  className={`${C.wizardStep} ${stage === s.key ? C.wizardStepOn : ""} ${s.reachable && stage !== s.key ? C.wizardStepDone : ""}`}
                  aria-current={stage === s.key ? "step" : undefined}>
            <span className={C.wizardStepNum}>{i + 1}</span>
            {s.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

/**
 * The answers so far as chips with a pencil: tap one to change just that
 * answer. Shown on the questions, above the sign-in, and on the plan card.
 */
export function WizardAnswers({ answers, onChange }) {
  const { t, lang } = useTranslation("subscribe");
  const chips = [];
  if (answers.grade != null && answers.editing !== "grade") {
    chips.push({ key: "grade", text: `${t("gradeWord")} ${toKu(answers.grade, lang)}` });
  }
  if (answers.payer != null && answers.editing !== "payer") {
    chips.push({ key: "payer", text: t(`xPayerShort_${answers.payer}`) });
  }
  if (chips.length === 0) return null;
  return (
    <div className={C.wizardAnswers}>
      {chips.map((c) => (
        <button key={c.key} type="button" className={C.wizardAnswer}
                aria-label={`${t("xWizChange")}: ${c.text}`}
                onClick={() => onChange(editAnswer(answers, c.key))}>
          {c.text}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** A back arrow at the card's top corner. */
function BackArrow({ onClick, label }) {
  return (
    <button type="button" className={C.wizardBack} onClick={onClick} aria-label={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {/* a chevron toward the reading start: right in rtl, flipped for ltr in CSS */}
        <path d="M9 18l6-6-6-6" />
      </svg>
      {label}
    </button>
  );
}

/**
 * The "wizard" arm's questions, asked before anything is typed: which grade,
 * and who pays. One question per screen, big buttons, the owl on each step.
 * The account comes after (it's the one step that needs typing), and then a
 * single plan card that pays the way the student said here.
 *
 * Every answer stays changeable: the step pills jump back, the answer chips
 * reopen one answer, and the back arrow steps back. A changed answer returns
 * to wherever the student was, never to the start.
 *
 * `onChange` gets the next answers; `onDone` fires when the last one lands.
 */
export default function CheckoutWizard({ answers, onChange, onDone }) {
  const { t, lang } = useTranslation("subscribe");
  const stage = wizardStage(answers);

  const finish = (next) => {
    onChange(next);
    if (wizardStage(next) === "done") onDone?.(next);
  };
  const pickGrade = (grade) => finish({ ...answers, grade, editing: null });
  const pickPayer = (payer) => finish({ ...answers, payer, editing: null });
  // changing an answer someone already had: back returns to the plan untouched
  const canCancel = !!answers.editing && answers.grade != null && answers.payer != null;

  return (
    <div className={`${C.card} ${C.wizard}`}>
      <WizardSteps answers={answers} onChange={onChange} />

      {stage === "grade" && (
        <>
          {canCancel && <BackArrow label={t("back")} onClick={() => onChange({ ...answers, editing: null })} />}
          <img className={C.wizardOwl} src="/assets/pepu/lets_start.webp" alt="" />
          <div className={C.wizardQ}>{t("xWizGrade")}</div>
          <div className={C.grades}>
            {GRADES.map((g) => (
              <button key={g} type="button" aria-pressed={answers.grade === g}
                      className={`${C.grade} ${answers.grade === g ? C.gradeActive : ""}`}
                      onClick={() => pickGrade(g)}>
                <span className={C.gradeWord}>{t("gradeWord")}</span>
                <span className={C.gradeNum}>{toKu(g, lang)}</span>
                {answers.grade === g && <span className={C.gradeTick}><CheckIcon /></span>}
              </button>
            ))}
          </div>
        </>
      )}

      {stage === "payer" && (
        <>
          <BackArrow label={t("back")}
                     onClick={() => onChange(canCancel ? { ...answers, editing: null } : editAnswer(answers, "grade"))} />
          <WizardAnswers answers={answers} onChange={onChange} />
          <img className={C.wizardOwl} src="/assets/pepu/listening.webp" alt="" />
          <div className={C.wizardQ}>{t("xWizPayer")}</div>
          <p className={C.muted} style={{ textAlign: "center", marginBottom: 14 }}>{t("xWizPayerHint")}</p>
          <div className={C.stack}>
            {PAYERS.map((p) => (
              <button key={p} type="button" aria-pressed={answers.payer === p}
                      className={`${C.option} ${answers.payer === p ? C.optionSelected : ""}`}
                      onClick={() => pickPayer(p)}>
                <span className={`${C.wizardIcon} ${C[`wizardIcon_${p}`]}`} aria-hidden="true">
                  {(() => { const Icon = PAYER_ICON[p]; return <Icon />; })()}
                </span>
                <span className={C.optionBody}>
                  <div className={C.optionName} style={{ fontSize: 17 }}>{t(`xPayer_${p}`)}</div>
                  <div className={C.optionDesc}>{t(`xPayer_${p}_hint`)}</div>
                </span>
                {answers.payer === p && <span className={C.radio}><CheckIcon /></span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The wizard's last screen, once signed in: the plan its answers point at
 * (a section to pick when the grade has several), the price, and one way to
 * pay — the one the student chose. The answers sit on top as chips, so a
 * wrong grade or payer is one tap to fix; "Show every plan" drops back into
 * the normal shop for anyone the wizard guessed wrong for.
 */
export function WizardPlan({
  plans, answers, onChange, plan, onPickPlan, amount, fmt, gradeOf, trackOf, isOwned,
  onPayFib, onParent, busy, parentBusy, onBrowse,
}) {
  const { t, lang } = useTranslation("subscribe");
  const inGrade = plans.filter((p) => gradeOf(p) === answers.grade);
  const buyable = inGrade.filter((p) => !isOwned(p));
  const setPayer = (payer) => onChange({ ...answers, payer, editing: null });

  const header = (
    <>
      <WizardSteps answers={answers} onChange={onChange} />
      <WizardAnswers answers={answers} onChange={onChange} />
    </>
  );

  if (inGrade.length === 0 || buyable.length === 0) {
    return (
      <div className={`${C.card} ${C.wizard}`}>
        {header}
        <p className={C.muted} style={{ margin: "12px 0" }}>
          {inGrade.length === 0 ? t("xWizNoPlan") : t("xWizOwned")}
        </p>
        <Btn variant="primary" onClick={onBrowse}>{t("xWizBrowse")}</Btn>
      </div>
    );
  }

  // colour-coded and the same everywhere: FIB is always green with a card,
  // someone else is always purple with a handshake (as on the question)
  const payFib = (label = t("payWithFib")) => (
    <Btn variant="fib" loading={busy} disabled={!plan}
         onClick={() => { if (answers.payer === "parent") setPayer("me"); onPayFib(); }}>
      <TbCreditCard aria-hidden="true" className={C.btnIcon} />{label}
    </Btn>
  );
  const askOther = (
    <Btn variant="primary" className={C.btnBig} loading={parentBusy} disabled={!plan}
         onClick={() => { if (answers.payer === "me") setPayer("parent"); onParent(); }}>
      <TbHeartHandshake aria-hidden="true" className={C.btnIcon} />{t("xWizAskParent")}
    </Btn>
  );

  return (
    <div className={`${C.card} ${C.wizard}`}>
      {header}
      <img className={C.wizardOwl} src="/assets/pepu/encourage.webp" alt="" />
      <div className={C.wizardQ}>{t("xWizYourPlan", { grade: toKu(answers.grade, lang) })}</div>

      {inGrade.length > 1 && (
        <>
          <p className={C.muted} style={{ textAlign: "center", marginBottom: 10 }}>{t("pickTrack")}</p>
          {inGrade.map((p) => {
            const owned = isOwned(p);
            const selected = plan?.id === p.id;
            return (
              <button key={p.id} type="button" aria-pressed={selected} disabled={owned}
                      onClick={() => onPickPlan(p)}
                      className={`${C.option} ${C.optionCompact} ${selected ? C.optionSelected : ""} ${owned ? C.optionOwned : ""}`}>
                <span className={C.radio}>{(selected || owned) && <CheckIcon />}</span>
                <span className={C.optionBody}>
                  <div className={C.optionName} style={{ fontSize: 17 }}>{trackOf(p)}</div>
                  {owned && <div className={C.optionDesc}>{t("owned")}</div>}
                </span>
              </button>
            );
          })}
        </>
      )}

      {plan && (
        <div className={C.wizardPrice}>
          <div className={C.payLabel}>{plan.nameKurdish}</div>
          <div className={C.price} style={{ fontSize: 32 }}>{fmt(amount)} <small>{t("iqd")}</small></div>
          <div className={C.perMonth}>{t("forDays", { days: plan.standardDays })}</div>
        </div>
      )}

      {/* both ways are real buttons, the chosen one first and full colour;
          picking the other just pays that way (and becomes the answer) */}
      <div className={C.stack} style={{ marginTop: 14 }}>
        {answers.payer === "unsure" && (
          <div className={C.parentBox} style={{ marginTop: 0 }}>
            <div className={C.parentBoxTitle}>{t("xWizUnsureTitle")}</div>
            <p className={C.muted} style={{ fontSize: 13.5, margin: "4px 0 0" }}>{t("xWizUnsureHint")}</p>
          </div>
        )}
        {answers.payer === "me"
          ? <>{payFib()}{askOther}</>
          : <>{askOther}{payFib(t("xWizPayMyself"))}</>}
      </div>

      <div className={C.wizardFoot}>
        <button type="button" className={C.btnLink} onClick={onBrowse}>{t("xWizBrowse")}</button>
      </div>
    </div>
  );
}
