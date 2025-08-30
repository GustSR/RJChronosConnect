import {
  Analytics,
  PieChart,
  ShoppingCart,
  LocalShipping,
  Campaign,
  School,
  Work,
  Person,
  AccountCircle,
  Group,
  Inventory,
  Receipt,
  TableChart,
  ChecklistRtl,
  ViewKanban,
  People,
  Router,
} from "@mui/icons-material";

const index = [
  // Dashboard Section
  {
    title: "Dashboard",
    Icon: Analytics,
    category: "dashboard",
    children: [
      {
        title: "Analises Geral",
        path: "/dashboard",
      },
    ],
  },
  {
    title: "Provisionamento",
    Icon: Router,
    category: "dashboard",
    path: "/dashboard/provisionar",
  },
  {
    title: "Clientes",
    Icon: People,
    category: "dashboard",
    path: "/dashboard/clientes",
  },
  {
    title: "CRM",
    Icon: PieChart,
    category: "dashboard",
    children: [
      {
        title: "CRM 1",
        path: "/dashboard/crm",
      },
      {
        title: "CRM 2",
        path: "/dashboard/crm-2",
      },
    ],
  },
  {
    title: "Sales",
    Icon: ShoppingCart,
    category: "dashboard",
    path: "/dashboard/sales",
  },
  {
    title: "Ecommerce",
    Icon: ShoppingCart,
    category: "dashboard",
    path: "/dashboard/ecommerce",
  },
  {
    title: "Logistics",
    Icon: LocalShipping,
    category: "dashboard",
    path: "/dashboard/logistics",
  },
  {
    title: "Marketing",
    Icon: Campaign,
    category: "dashboard",
    path: "/dashboard/marketing",
  },
  {
    title: "LMS",
    Icon: School,
    category: "dashboard",
    path: "/dashboard/lms",
  },
  {
    title: "Job Management",
    Icon: Work,
    category: "dashboard",
    path: "/dashboard/job-management",
  },

  // Management Section
  {
    title: "Profile",
    Icon: Person,
    category: "management",
    path: "/dashboard/user-profile",
  },
  {
    title: "Account",
    Icon: AccountCircle,
    category: "management",
    path: "/dashboard/account",
  },
  {
    title: "Users",
    Icon: Group,
    category: "management",
    children: [
      {
        title: "User List",
        path: "/dashboard/user-list",
      },
      {
        title: "User Grid",
        path: "/dashboard/user-grid",
      },
      {
        title: "Add User",
        path: "/dashboard/add-user",
      },
    ],
  },
  {
    title: "Products",
    Icon: Inventory,
    category: "management",
    children: [
      {
        title: "Product List",
        path: "/dashboard/products",
      },
      {
        title: "Product Details",
        path: "/dashboard/product-details",
      },
    ],
  },
  {
    title: "Invoice",
    Icon: Receipt,
    category: "management",
    children: [
      {
        title: "Invoice List",
        path: "/dashboard/invoice",
      },
      {
        title: "Invoice Details",
        path: "/dashboard/invoice-details",
      },
    ],
  },
  {
    title: "Ecommerce",
    Icon: ShoppingCart,
    category: "management",
    children: [
      {
        title: "Products",
        path: "/dashboard/ecommerce-products",
      },
      {
        title: "Orders",
        path: "/dashboard/ecommerce-orders",
      },
    ],
  },
  {
    title: "Projects",
    Icon: Work,
    category: "management",
    children: [
      {
        title: "Project List",
        path: "/dashboard/projects",
      },
      {
        title: "Project Details",
        path: "/dashboard/project-details",
      },
    ],
  },
  {
    title: "Data Table",
    Icon: TableChart,
    category: "management",
    children: [
      {
        title: "Basic Table",
        path: "/dashboard/data-table",
      },
      {
        title: "Advanced Table",
        path: "/dashboard/data-table-advanced",
      },
    ],
  },

  // Apps Section
  {
    title: "Kanban",
    Icon: ViewKanban,
    category: "apps",
    path: "/dashboard/kanban",
  },
  {
    title: "Todo List",
    Icon: ChecklistRtl,
    category: "apps",
    path: "/dashboard/todo",
  },
];

export default index;
