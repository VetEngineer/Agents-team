const steps = [
  {
    title: "프로젝트 셋업",
    desc: "업종/오픈 일정 정리",
  },
  {
    title: "브랜드 & 타깃",
    desc: "메시지/대상 정의",
  },
  {
    title: "사이트맵 & 섹션",
    desc: "페이지 구조 설계",
  },
  {
    title: "기능 & 운영",
    desc: "필수 기능 선택",
  },
  {
    title: "스타일 & 레퍼런스",
    desc: "톤/이미지 기준",
  },
  {
    title: "필수 자료 업로드",
    desc: "로고/이미지 제출",
  },
  {
    title: "검토 & 제출",
    desc: "요약 확인",
  },
];

export default function Home() {
  return (
    <div className="page">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            Planning<span>Flow</span>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`step ${index === 2 ? "step--active" : ""}`}
              >
                <div className="step-index">{index + 1}</div>
                <div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="content">
          <section className="hero">
            <div className="eyebrow">MVP Wizard</div>
            <h1 className="headline">제작팀이 바로 이해하는 기획서 초안.</h1>
            <p className="subhead">
              설문과 빌더를 결합해 핵심 정보만 빠르게 정리합니다. 현재 화면은
              사이트맵 & 섹션 편집 단계의 기본 골격입니다.
            </p>
            <div className="cta-row">
              <button type="button" className="cta">
                이 단계 설계하기
              </button>
              <button type="button" className="cta secondary">
                샘플 보기
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-title">섹션 프리셋</div>
            <div className="pill-row">
              <div className="pill">히어로</div>
              <div className="pill">서비스 소개</div>
              <div className="pill">후기</div>
              <div className="pill">FAQ</div>
              <div className="pill">문의/CTA</div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">빠른 작업 체크리스트</div>
            <div className="pill-row">
              <div className="pill">페이지 순서 정의</div>
              <div className="pill">핵심 CTA 결정</div>
              <div className="pill">참고 사이트 첨부</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
