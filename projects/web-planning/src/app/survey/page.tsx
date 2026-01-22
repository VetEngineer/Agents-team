"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { setKeepLoginRequested } from "@/lib/authRetention";
import styles from "../styles.module.css";

const steps = [
  { title: "로그인", meta: "워크스페이스 접근" },
  { title: "프로젝트 설정", meta: "이름, 업종, 일정" },
  { title: "브랜드 + 타깃", meta: "포지셔닝과 메시지" },
  { title: "사이트맵 + 섹션", meta: "페이지와 구조" },
  { title: "기능 + 운영", meta: "필수 기능" },
  { title: "스타일 + 레퍼런스", meta: "무드와 참고자료" },
  { title: "에셋 업로드", meta: "로고와 이미지" },
  { title: "검토 + 제출", meta: "최종 확인" },
];

const DEFAULT_STEP = 1;
const PROJECT_ID_KEY = "web-planning:project-id";

const EMPTY_PROJECT_SETUP = {
  projectName: "",
  industry: "",
  desiredLaunchDate: "",
  constraintsText: "",
};

const EMPTY_BRAND_INFO = {
  brandNameKo: "",
  brandNameEn: "",
  keyMessage: "",
  targetAudience: "",
};

type SaveState = "idle" | "saving" | "saved" | "error";

function SurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = Number(searchParams.get("step") ?? DEFAULT_STEP);
  const totalSteps = steps.length;
  const currentStep = Number.isFinite(stepParam)
    ? Math.min(Math.max(stepParam, 1), totalSteps)
    : DEFAULT_STEP;
  const progress = Math.round((currentStep / totalSteps) * 100);
  const stepTitle = steps[currentStep - 1]?.title ?? "설문";

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const shouldPersist = currentStep >= 2 && isAuthenticated;
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectSetup, setProjectSetup] = useState(EMPTY_PROJECT_SETUP);
  const [brandInfo, setBrandInfo] = useState(EMPTY_BRAND_INFO);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isLoaded, setIsLoaded] = useState(false);
  const initRef = useRef(false);

  const autosaveLabel = !shouldPersist
    ? "자동 저장을 사용하려면 로그인하세요"
    : saveState === "saving"
      ? "저장 중..."
      : saveState === "error"
        ? "저장 실패"
        : "자동 저장 활성화";

  const updateProjectSetup = (
    key: keyof typeof EMPTY_PROJECT_SETUP,
    value: string
  ) => {
    setProjectSetup((prev) => ({ ...prev, [key]: value }));
  };

  const updateBrandInfo = (
    key: keyof typeof EMPTY_BRAND_INFO,
    value: string
  ) => {
    setBrandInfo((prev) => ({ ...prev, [key]: value }));
  };

  const hydrateFromProject = (project: Record<string, string | null>) => {
    setProjectSetup({
      projectName: project.project_name ?? "",
      industry: project.industry ?? "",
      desiredLaunchDate: project.desired_launch_date ?? "",
      constraintsText: project.constraints_text ?? "",
    });
    setBrandInfo({
      brandNameKo: project.brand_name_ko ?? "",
      brandNameEn: project.brand_name_en ?? "",
      keyMessage: project.key_message ?? "",
      targetAudience: project.target_audience ?? "",
    });
  };

  const createProject = useCallback(async () => {
    try {
      setSaveState("saving");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: userId ?? undefined }),
      });
      if (!response.ok) {
        throw new Error("프로젝트 생성에 실패했습니다.");
      }
      const data = (await response.json()) as { id?: string };
      if (data?.id) {
        localStorage.setItem(PROJECT_ID_KEY, data.id);
        setProjectId(data.id);
        setSaveState("saved");
        setIsLoaded(true);
      }
    } catch {
      setSaveState("error");
    }
  }, [userId]);

  const loadProject = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error("프로젝트를 불러오지 못했습니다.");
        }
        const data = (await response.json()) as Record<string, string | null>;
        hydrateFromProject(data);
        setSaveState("saved");
        setIsLoaded(true);
      } catch {
        await createProject();
      }
    },
    [createProject]
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authed = Boolean(session?.user?.id);
        setIsAuthenticated(authed);
        setUserId(session?.user?.id ?? null);
        supabase.auth.onAuthStateChange((_, nextSession) => {
          setIsAuthenticated(Boolean(nextSession?.user?.id));
          setUserId(nextSession?.user?.id ?? null);
        });
      } catch {
        setIsAuthenticated(false);
        setUserId(null);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!shouldPersist || initRef.current) {
      return;
    }
    initRef.current = true;
    const storedId = localStorage.getItem(PROJECT_ID_KEY);
    if (storedId) {
      setProjectId(storedId);
      loadProject(storedId);
    } else {
      createProject();
    }
  }, [createProject, loadProject, shouldPersist]);

  useEffect(() => {
    if (isAuthenticated && currentStep === 1) {
      router.replace("/survey?step=2");
    }
  }, [currentStep, isAuthenticated, router]);

  useEffect(() => {
    if (!shouldPersist || !projectId || !isLoaded) {
      return;
    }
    setSaveState("saving");
    const timeout = setTimeout(async () => {
      try {
        const payload = {
          project_name: projectSetup.projectName,
          industry: projectSetup.industry,
          desired_launch_date: projectSetup.desiredLaunchDate || null,
          constraints_text: projectSetup.constraintsText,
          brand_name_ko: brandInfo.brandNameKo,
          brand_name_en: brandInfo.brandNameEn,
          key_message: brandInfo.keyMessage,
          target_audience: brandInfo.targetAudience,
        };
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("프로젝트 저장에 실패했습니다.");
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [brandInfo, isLoaded, projectId, projectSetup, shouldPersist]);

  const goStep = (step: number) => {
    router.push(`/survey?step=${step}`);
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <div className={styles.brandHeader}>
            <Image
              src="/brand/logo-mark.png"
              alt="하감솔루션 로고"
              width={44}
              height={44}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandWordmark}>
              <span className={styles.brandName}>하감솔루션</span>
              <span className={styles.brandNameEn}>HAKHAM SOLUTION</span>
            </div>
          </div>
          <div>
            <h2 className={styles.sectionTitle}>시작하려면 로그인하세요</h2>
            <p className={styles.sectionSubtitle}>
              카카오로 로그인하면 자동 저장과 공유 가능한 브리프가 열립니다.
            </p>
          </div>
          <div className={styles.callout}>
            로그인 없이도 흐름을 볼 수 있지만, 저장과 제출은 인증된 계정이
            필요합니다.
          </div>
          {authError ? (
            <div className={styles.callout}>{authError}</div>
          ) : null}
          <label className={styles.authOption}>
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(event) => setKeepSignedIn(event.target.checked)}
            />
            <span>로그인 상태 유지 (24시간)</span>
          </label>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={async () => {
              try {
                setAuthError(null);
                setKeepLoginRequested(keepSignedIn);
                const supabase = getSupabaseBrowserClient();
                const redirectTo = `${window.location.origin}/auth/callback`;
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "kakao",
                  options: {
                    redirectTo,
                    scopes: "profile_nickname profile_image",
                    queryParams: {
                      prompt: "login",
                    },
                  },
                });
                if (error) {
                  throw error;
                }
              } catch {
                setAuthError("로그인을 시작할 수 없습니다. 다시 시도해 주세요.");
              }
            }}
          >
            카카오로 계속하기
          </button>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <div>
            <h2 className={styles.sectionTitle}>프로젝트 설정</h2>
            <p className={styles.sectionSubtitle}>
              일정과 제작 범위를 정할 수 있도록 기본 정보를 알려주세요.
            </p>
          </div>
          {!isAuthenticated ? (
            <div className={styles.callout}>
              이 단계를 나가기 전에 로그인하면 자동 저장이 활성화됩니다.
            </div>
          ) : null}
          <label className={styles.field}>
            <span className={styles.label}>프로젝트 이름</span>
            <input
              className={styles.input}
              placeholder="루멘 클리닉 웹사이트"
              value={projectSetup.projectName}
              onChange={(event) =>
                updateProjectSetup("projectName", event.target.value)
              }
            />
          </label>
          <div className={styles.row}>
            <label className={styles.field} style={{ flex: 1 }}>
              <span className={styles.label}>업종</span>
              <input
                className={styles.input}
                placeholder="의료, 웰니스"
                value={projectSetup.industry}
                onChange={(event) =>
                  updateProjectSetup("industry", event.target.value)
                }
              />
            </label>
            <label className={styles.field} style={{ flex: 1 }}>
              <span className={styles.label}>희망 오픈일</span>
              <input
                className={styles.input}
                type="date"
                value={projectSetup.desiredLaunchDate}
                onChange={(event) =>
                  updateProjectSetup("desiredLaunchDate", event.target.value)
                }
              />
              <span className={styles.helper}>
                정확하지 않아도 대략적인 날짜면 됩니다.
              </span>
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>일정 제약</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="마케팅 캠페인, 오픈 일정, 성수기 등"
              value={projectSetup.constraintsText}
              onChange={(event) =>
                updateProjectSetup("constraintsText", event.target.value)
              }
            />
            <span className={styles.helper}>
              기간에 영향을 주는 마감이나 이벤트를 적어주세요.
            </span>
          </label>
          <div className={styles.inlineNote}>
            변경할 때마다 자동 저장됩니다. 언제든 나가서 이어서 작성할 수 있어요.
          </div>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <div>
            <h2 className={styles.sectionTitle}>브랜드 + 타깃</h2>
            <p className={styles.sectionSubtitle}>
              브랜드 톤과 전달 대상 정보를 기록하세요.
            </p>
          </div>
          {!isAuthenticated ? (
            <div className={styles.callout}>
              로그인하면 이 내용이 프로젝트에 연결됩니다.
            </div>
          ) : null}
          <div className={styles.row}>
            <label className={styles.field} style={{ flex: 1 }}>
              <span className={styles.label}>브랜드명(국문)</span>
              <input
                className={styles.input}
                placeholder="루멘 클리닉"
                value={brandInfo.brandNameKo}
                onChange={(event) =>
                  updateBrandInfo("brandNameKo", event.target.value)
                }
              />
            </label>
            <label className={styles.field} style={{ flex: 1 }}>
              <span className={styles.label}>브랜드명(영문)</span>
              <input
                className={styles.input}
                placeholder="Lumen Clinic"
                value={brandInfo.brandNameEn}
                onChange={(event) =>
                  updateBrandInfo("brandNameEn", event.target.value)
                }
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>핵심 메시지</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="우리의 약속을 한 줄로 표현해 주세요."
              value={brandInfo.keyMessage}
              onChange={(event) =>
                updateBrandInfo("keyMessage", event.target.value)
              }
            />
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => updateBrandInfo("keyMessage", "아직 미정")}
              >
                아직 미정
              </button>
            </div>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>타깃 고객</span>
            <input
              className={styles.input}
              placeholder="지역 직장인 30~45세"
              value={brandInfo.targetAudience}
              onChange={(event) =>
                updateBrandInfo("targetAudience", event.target.value)
              }
            />
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => updateBrandInfo("targetAudience", "아직 미정")}
              >
                아직 미정
              </button>
            </div>
          </label>
        </>
      );
    }

    return (
      <>
        <div>
          <h2 className={styles.sectionTitle}>{stepTitle}</h2>
          <p className={styles.sectionSubtitle}>
            이 단계는 이후 흐름이 이어지면 구현됩니다.
          </p>
        </div>
        <div className={styles.placeholder}>
          다음 단계로 이동해 브리프를 계속 완성해 주세요.
        </div>
      </>
    );
  };

  return (
    <AppShell title="설문" subtitle={`단계 ${currentStep} · ${stepTitle}`}>
      <section className={styles.surveyLayout}>
        <aside className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.stack}>
              <div>
                <h2 className={styles.sectionTitle}>설문 단계</h2>
                <p className={styles.sectionSubtitle}>
                  각 단계를 완료하면 제작용 브리프가 완성됩니다.
                </p>
              </div>
              <div className={styles.progressBlock}>
                <div className={styles.progressHeader}>
                  <span>
                    단계 {currentStep} / {totalSteps}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={styles.statusChip}>{autosaveLabel}</span>
              </div>
              <ul className={styles.stepList}>
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === currentStep;
                  const isComplete = stepNumber < currentStep;
                  return (
                    <li
                      key={step.title}
                      className={`${styles.stepItem} ${
                        isActive ? styles.stepItemActive : ""
                      } ${isComplete ? styles.stepItemDone : ""}`}
                    >
                      <span className={styles.stepIndex}>{stepNumber}</span>
                      <div>
                        <p className={styles.stepTitle}>{step.title}</p>
                        <p className={styles.stepMeta}>{step.meta}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>
        <div className={styles.card}>
          <div className={styles.stack}>
            {renderStepContent()}
            <div className={styles.stepActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => goStep(Math.max(1, currentStep - 1))}
                disabled={currentStep <= 1}
              >
                이전
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => goStep(Math.min(totalSteps, currentStep + 1))}
                disabled={currentStep >= totalSteps}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="설문" subtitle="불러오는 중...">
          <section className={styles.card}>
            <div className={styles.stack}>
              <h2 className={styles.sectionTitle}>설문을 불러오는 중</h2>
              <p className={styles.sectionSubtitle}>
                워크스페이스를 준비하고 있습니다...
              </p>
            </div>
          </section>
        </AppShell>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
