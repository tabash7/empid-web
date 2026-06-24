export type ScreenshotDevice = "desktop" | "mobile";

export type SelectorOption = string | string[];

export interface ScreenshotNote {
  stepNumber: number;
  selector: SelectorOption;
  textAr: string;
  textEn: string;
}

export interface ScreenshotAction {
  name: string;
  selectors: SelectorOption[];
  action: "click" | "fill" | "press" | "select";
  value?: string;
  waitFor?: SelectorOption[];
  required?: boolean;
}

export interface ScreenshotFlowStep {
  slug: string;
  title: string;
  path: string;
  outputFile?: string;
  route?: string;
  notes?: ScreenshotNote[];
  actions?: ScreenshotAction[];
  waitFor?: SelectorOption[];
  pauseMs?: number;
  hideUnstable?: string[];
}

export interface ScreenshotFlow {
  name: string;
  steps: ScreenshotFlowStep[];
}

export const loginFlow: ScreenshotFlowStep[] = [
  {
    slug: "login-dashboard",
    title: "تسجيل الدخول إلى EMPID (عرض شاشة الدخول)",
    path: "/login",
    waitFor: ["[data-tour='login-panel']", "form", "main", "body"],
    pauseMs: 900,
    actions: [
      {
        name: "Fill login email",
        selectors: ["#email-address", "input[name='email']", "input[type='email']"],
        action: "fill",
        value: "{{DEMO_EMAIL}}",
        required: false
      },
      {
        name: "Fill login password",
        selectors: ["#password", "input[name='password']", "input[type='password']"],
        action: "fill",
        value: "{{DEMO_PASSWORD}}",
        required: false
      },
      {
        name: "Submit login form",
        selectors: ["button[type='submit']", "[data-tour='login-submit']", "[data-tour='auth-submit']"],
        action: "click",
        required: true
      }
    ],
    hideUnstable: [
      "[data-tour='login-notification']",
      "[data-tour='loading-skeleton']"
    ]
  }
];

export const demoFlows: ScreenshotFlow[] = [
  {
    name: "Employee Management Flow",
    steps: [
      {
        slug: "employee-directory",
        outputFile: "02-employee-directory.png",
        title: "لوحة الموظفين — القائمة الرئيسية",
        path: "/employees",
        waitFor: ["main", "table", "section"],
        notes: [
          {
            stepNumber: 1,
            selector: "main",
            textAr: "عرض عام لصفحة إدارة الموظفين مع البحث والفلترة.",
            textEn: "Employee directory overview with search and filtering controls."
          },
          {
            stepNumber: 2,
            selector: "main table",
            textAr: "زر إضافة موظف جديد.",
            textEn: "Add new employee quick action."
          }
        ],
        hideUnstable: [
          "[data-tour='current-time']",
          "[data-tour='real-time-clock']",
          "[data-tour='live-notification']",
          "[aria-live='polite']"
        ],
        pauseMs: 800
      },
      {
        slug: "employee-profile",
        outputFile: "03-employee-profile.png",
        title: "تفاصيل ملف موظف",
        path: "/employees",
        actions: [
          {
            name: "Open first employee profile",
            selectors: [
            "table tbody tr button[aria-label^='View ']",
            "table tbody tr button[title='View']",
            "tbody tr:first-child button[aria-label]",
            "button[aria-label^='View ']"
          ],
            action: "click",
            waitFor: ["h1", "main", "section"],
            required: false
          }
        ],
        waitFor: ["h1", "main", "section"],
        notes: [
          {
            stepNumber: 3,
            selector: "h1",
            textAr: "تفاصيل ملف الموظف كاملة (بيانات شخصية، الحضور، الإجازات والرواتب).",
            textEn: "Complete employee profile sections including attendance and leave."
          },
          {
            stepNumber: 4,
            selector: "section",
            textAr: "زر إجراء سريع في صفحة الملف.",
            textEn: "Primary action button in employee profile."
          }
        ],
        pauseMs: 700
      }
    ]
  },
  {
    name: "Attendance Flow",
    steps: [
      {
        slug: "attendance-overview",
        outputFile: "04-attendance-overview.png",
        title: "لوحة الحضور والانصراف",
        path: "/workforce-command-center",
        waitFor: ["main", "section"],
        notes: [
          {
            stepNumber: 5,
            selector: "main",
            textAr: "عرض إجمالي الحضور اليومي وعدد المتأخرين والحضور المعتمد.",
            textEn: "Attendance dashboard with summary KPIs."
          },
          {
            stepNumber: 6,
            selector: "section",
            textAr: "تصدير التقرير بنفس خطوة واحدة.",
            textEn: "Export action for attendance report."
          }
        ],
        hideUnstable: [
          "[data-tour='clock-widget']",
          "[data-tour='live-notification']",
          ".spinner",
          "[role='status']"
        ],
        pauseMs: 700
      }
    ]
  },
  {
    name: "Leave Flow",
    steps: [
      {
        slug: "leave-management",
        outputFile: "05-leave-management.png",
        title: "إدارة طلبات الإجازات",
        path: "/leave",
        waitFor: ["[data-tour='leave-requests']", "[data-tour='leave-calendar']", "main"],
        notes: [
          {
            stepNumber: 7,
            selector: "[data-tour='leave-requests']",
            textAr: "قائمة الطلبات مع حالتها وصلاحيات الاعتماد.",
            textEn: "Leave requests list with approval status."
          },
          {
            stepNumber: 8,
            selector: "[data-tour='leave-calendar']",
            textAr: "تقويم الإجازات لقراءة الساعات والإجمالي شهرياً.",
            textEn: "Leave calendar view for monthly totals."
          }
        ],
        pauseMs: 700
      }
    ]
  },
  {
    name: "Payroll Flow",
    steps: [
      {
        slug: "payroll-overview",
        outputFile: "06-payroll-overview.png",
        title: "لوحة الرواتب",
        path: "/reports",
        waitFor: ["main", "section"],
        notes: [
          {
            stepNumber: 9,
            selector: "h1",
            textAr: "نظرة سريعة على دورة الرواتب والتشغيل.",
            textEn: "Payroll run and reconciliation area."
          },
          {
            stepNumber: 10,
            selector: "section",
            textAr: "زر تشغيل الرواتب أو تصدير التفاصيل.",
            textEn: "Payroll execution or export action."
          }
        ],
        pauseMs: 700
      }
    ]
  },
  {
    name: "Dashboard Executive Flow",
    steps: [
      {
        slug: "dashboard-overview",
        outputFile: "01-dashboard-overview.png",
        title: "لوحة تنفيذية عامة",
        path: "/dashboard",
        waitFor: ["[data-tour='main-dashboard']", "[data-tour='kpi-strip']", "main"],
        notes: [
          {
            stepNumber: 11,
            selector: "[data-tour='main-dashboard']",
            textAr: "ملخص تشغيل اليوم: تغطية أقسام، حضور، إجازات، رواتب.",
            textEn: "Executive summary with workforce, attendance, leave, and payroll KPIs."
          },
          {
            stepNumber: 12,
            selector: "[data-tour='dashboard-branch-filter'], [data-tour='branch-selector']",
            textAr: "تصفية النتائج حسب الفرع أو الفريق.",
            textEn: "Filter workspace by branch or team."
          }
        ],
        pauseMs: 800
      }
    ]
  }
];

const dashboardFlow = demoFlows.find((flow) => flow.name === "Dashboard Executive Flow");
const remainingFlows = demoFlows.filter((flow) => flow.name !== "Dashboard Executive Flow");

export const screenshotFlowSteps: ScreenshotFlowStep[] = [
  ...loginFlow,
  ...(dashboardFlow?.steps ?? []),
  ...remainingFlows.flatMap((flow) => flow.steps)
];



