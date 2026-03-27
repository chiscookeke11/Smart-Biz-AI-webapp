import { ChartNoAxesGanttIcon, FileText, LayoutDashboard, Settings, Sparkle, Users } from "lucide-react";



export const side_nav_links = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        isBeta: false,
    },
    // {
    //     label: "Leads",
    //     path: "/dashboard/leads",
    //     icon: Users,
    //     isBeta: false,
    // },
    {
        label: "Products",
        path: "/dashboard/products",
        icon: ChartNoAxesGanttIcon,
        isBeta: false,
    },
    {
        label: "Invoices",
        path: "/dashboard/invoices",
        icon: FileText,
        isBeta: false,
    },
    {
        label: "AI Assistant",
        path: "/dashboard/chat",
        icon: Sparkle,
        isBeta: false,
    },

    {
        label: "Whatsapp Demo",
        path: "#",
        icon: Sparkle,
        isBeta: true,
    },
    {
        label: "Subscription",
        path: "#",
        icon: Sparkle,
        isBeta: true,
    },
    {
        label: "Settings",
        path: "/dashboard/settings",
        icon: Settings,
        isBeta: false,
    },

]