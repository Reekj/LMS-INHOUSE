import { Building2, PlusCircle } from "lucide-vue-next";

export const platformMenu = [
  {
    label: "Institutions",
    icon: Building2,
    path: "/platform-admin/institutions",
    // Also highlight on /platform-admin/institutions/:id.
    matchNested: true,
  },
  {
    label: "Add Institution",
    icon: PlusCircle,
    path: "/platform-admin/new-institution",
  },
];
